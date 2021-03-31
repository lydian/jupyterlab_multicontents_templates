import datetime
import json
import base64
import urllib.parse

import nbformat
import tornado
from IPython.html.base.handlers import IPythonHandler
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from multicontents import MultiContentsManager
from nbconvert import HTMLExporter
from traitlets.config import Config


def build_manager(config):
    return


class BaseMixin(object):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        config = self.config.get("JupyterLabMultiContentsTemplates", {}).get(
            "template_folders", {}
        )
        self.manager = MultiContentsManager(
            config=Config({"MultiContentsManager": {"managers": config}})
        )

    def to_json(self, content):
        def convert_dt(obj):
            if isinstance(obj, datetime.datetime):
                return obj.isoformat()

        return json.dumps(content, default=convert_dt)

    def get_notebook(self, path):
        if not self.manager.file_exists(path):
            raise tornado.web.HTTPError(404, reason="File Not Found")
        if path.rsplit(".", 1)[-1].lower() != "ipynb":
            raise tornado.web.HTTPError(400, reason="Not ipynb File")
        return self.manager.get(path, content=True)


class ContentHandler(BaseMixin, APIHandler):
    @tornado.web.authenticated
    def put(self):
        data = json.loads(self.request.body)
        path = data.get("path", None)
        self.finish(self.to_json(self.get_notebook(path)))


class PreviewHandler(BaseMixin, IPythonHandler):
    def get(self):
        path = self.get_argument("path")
        html_exporter = HTMLExporter()
        html_exporter.template_name = "classic"
        notebook_node = nbformat.from_dict(self.get_notebook(path).get("content", {}))
        html, _ = html_exporter.from_notebook_node(notebook_node)
        self.finish(html)


class PublishHandler(BaseMixin, APIHandler):
    def put(self):
        data = json.loads(self.request.body)
        notebook = self.contents_manager.get(
            data["source_path"], type="notebook", content=1
        )
        target_path = data["target_path"]
        output = self.manager.save(notebook, target_path)
        output["path"] = target_path
        self.finish({"save": "success", **json.loads(self.to_json(output))})


class ListHandler(BaseMixin, APIHandler):
    def put(self):
        data = json.loads(self.request.body)
        path = data.get("path", "")
        result = self.manager.get(path, content=True)
        result["content"] = [
            item
            for item in result["content"] or []
            if item["type"] in ("notebook", "directory")
        ]
        self.finish(self.to_json(result))


class ShareURLHandler(APIHandler):
    def put(self):
        data = json.loads(self.request.body)
        path = data.get("path", "")
        append_prefix = self.config.get("JupyterLabMultiContentsTemplates", {}).get(
            "append_hub_user_redirect", False
        )
        url = "/user-redirect/" if append_prefix else "/"
        url += f"?template-preview={urllib.parse.quote(base64.b64encode(path.encode('utf-8')))}"
        self.finish(json.dumps({"path": url}))


class DecodePathHandler(APIHandler):
    def put(self):
        data = json.loads(self.request.body)
        path = data.get("path")
        decoded_path = base64.b64decode(path).decode("utf-8")
        self.finish(json.dumps({"path": decoded_path}))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = url_path_join(
        web_app.settings["base_url"], "jupyterlab_multicontents_templates"
    )
    route_to_handler = {
        "list": ListHandler,
        "preview": PreviewHandler,
        "content": ContentHandler,
        "publish": PublishHandler,
        "share-link": ShareURLHandler,
        "decode-link": DecodePathHandler,
    }
    handlers = [
        (url_path_join(base_url, route), handler)
        for route, handler in route_to_handler.items()
    ]
    web_app.add_handlers(host_pattern, handlers)
