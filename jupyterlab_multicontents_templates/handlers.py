import datetime
import importlib
import json
from functools import lru_cache

import nbformat
import tornado
from cached_property import cached_property
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from nbconvert import HTMLExporter


@lru_cache(maxsize=20)
def manager_builder(cls, **kwargs):
    if isinstance(cls, str):
        module_name, cls_name = cls.rsplit(".", 1)
    cls = getattr(importlib.import_module(module_name), cls_name)
    return  cls(**kwargs)


class MultiContentsManager(object):

    def __init__(self, config):
        self.config = config

    @cached_property
    def alias_to_manager(self):
        return {
            folder["alias"]: manager_builder(
                folder["manager_class"], **folder["manager_kwargs"]
            )
            for folder in self.config.get("template_folders", [])
        }

    def get(self, alias, path, **kwargs):
        content = self.alias_to_manager[alias].get(path, **kwargs)
        return content

    def file_exists(self, alias, path):
        return self.alias_to_manager[alias].file_exists(path)

    def dir_exists(self, alias, path):
        return self.alias_to_manager[alias].dir_exists(path)


class BaseHandler(APIHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.manager = MultiContentsManager(
            self.config.get("JupyterLabMultiContentsTemplates", {})
        )

    def to_json(self, content):

        def convert_dt(obj):
            if isinstance(obj, datetime.datetime):
                return obj.isoformat()

        return json.dumps(content, default=convert_dt)

    def get_notebook(self):
        alias = self.get_argument("alias")
        path = self.get_argument("path")
        if not self.manager.file_exists(alias, path):
            raise tornado.web.HTTPError(404, reason="File Not Found")
        if path.rsplit(".", 1)[-1].lower() != "ipynb":
            raise tornado.web.HTTPError(400, reason="Not ipynb File")
        return self.manager.get(alias, path, content=True)


class ContentHandler(BaseHandler):

    @tornado.web.authenticated
    def get(self):
        self.finish(self.to_json(self.get_notebook()))


class PreviewHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        html_exporter = HTMLExporter()
        html_exporter.template_name = 'classic'
        notebook_node = nbformat.from_dict(self.get_notebook().get("content", {}))
        html, _ = html_exporter.from_notebook_node(notebook_node)
        self.write(html)
        self.set_header("Content-Type", "text/html")
        self.finish()


class ListHandler(BaseHandler):

    @tornado.web.authenticated
    def get(self):
        alias = self.get_argument("alias", None)
        path = self.get_argument("path", None)
        if alias is None:
            return self.finish(json.dumps({
                "name": "",
                "path": "",
                "content": [
                    {"name": folder["alias"], "path": "", "type": "directory"}
                    for folder in self.config.get("JupyterLabMultiContentsTemplates", {}).get("template_folders", [])
                ]
            }))
        if not self.manager.dir_exists(alias, path):
            raise tornado.web.HTTPError(404, reason="Directory Not Found")

        self.finish(self.to_json(self.manager.get(alias, path)))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = url_path_join(
        web_app.settings["base_url"],
        "jupyterlab_multicontents_templates"
    )
    route_to_handler = {
        "list": ListHandler,
        "preview": PreviewHandler,
        "content": ContentHandler
    }
    handlers = [
        (url_path_join(base_url, route), handler)
        for route, handler in route_to_handler.items()
    ]
    web_app.add_handlers(host_pattern, handlers)
