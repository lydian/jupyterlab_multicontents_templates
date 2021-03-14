import os

c.JupyterLabMultiContentsTemplates.template_folders = {
    "template 1": {
        "manager_class": "IPython.html.services.contents.filemanager.FileContentsManager",
        "kwargs": {"root_dir": os.path.join(os.getcwd(), "examples", "1st template")},
    },
    "template 2": {
        "manager_class": "IPython.html.services.contents.filemanager.FileContentsManager",
        "kwargs": {"root_dir": os.path.join(os.getcwd(), "examples", "2nd template")},
    },
}
