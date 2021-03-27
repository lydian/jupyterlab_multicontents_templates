# jupyterlab_multicontents_templates

![Github Actions Status](https://github.com/lydian/jupyterlab_multicontents_templates/workflows/Build/badge.svg)

Inspired by [Jupyterlab-templates](https://pypi.org/project/jupyterlab-templates/) but added extra functions:
1. Allow templates from any location, including S3, GCS, psql, etc., just installed the required jupyter contents manager.
2. Preview notebook before import the template
3. Directly publish notebook as templates into the selected folder with name
4. Share Template URL and directly opened preview

This extension is composed of a Python package named `jupyterlab_multicontents_templates`
for the server extension and a NPM package named `jupyterlab_multicontents_templates`
for the frontend extension.


## Screenshots
- Use Template with preview
![JupyterLab-template-demo](https://user-images.githubusercontent.com/678485/111886962-014bb700-898f-11eb-9a61-ffe86ff7be36.gif)

- Publish notebook to Templates
![JupyterLab-publish-demo](https://user-images.githubusercontent.com/678485/111886966-07419800-898f-11eb-83dd-a83a5b0c5f3b.gif)

- Share Templates
![jupyterlab-share-demo](https://user-images.githubusercontent.com/678485/112735948-5302bd00-8f0c-11eb-97b3-4eac2d74ed41.gif)


## Requirements

* JupyterLab >= 3.0

## Install

```bash
pip install jupyterlab_multicontents_templates
```

## Config

configure `jupyter_notebook_config.py` with the following settings:

```python
import os
from IPython.html.services.contents.filemanager import FileContentsManager
from s3contents import S3ContentsManager

c.JupyterLabMultiContentsTemplates.template_folders = {
    "templates from Local File": {
        "manager_class": FileContentsManager,
        "kwargs": {
            "root_dir": os.environ["HOME"]
        },
    },
    "templates from S3 prefix1": {
        "manager_class": S3ContentsManager,
        "kwargs": {
            "bucket": "example-bucket",
            "prefix": "path/to/notebooks",
        },
    },
    "templates from S3 prefix2": {
        "manager_class": S3ContentsManager,
        "kwargs": {
            "bucket": "another-example-bucket",
            "prefix": "path/to/notebooks",
        },
    },
}

# If you're using jupyterhub please set this value to True to enable sharing:
c.JupyterLabMultiContentsTemplates.append_hub_user_redirect = True
```

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```


## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_multicontents_templates directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Uninstall

```bash
pip uninstall jupyterlab_multicontents_templates
```
