import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { ServerConnection } from '@jupyterlab/services';
import { PublishDialog } from './publishDialog';
import { MainAreaPreviewWidget } from './preview';
import { TemplateListWidget, ISelectedTemplate } from './templateList';
import { requestAPI } from './handler';
import { ShareDialog } from './shareDialog';

/**
 *
 */
function singularizeAndLowercaseTemplateDirectoryName(text: string): string {
  const firstUnderscoreIndex = text.indexOf('_');
  if (firstUnderscoreIndex === -1) {
    return text.toLowerCase();
  }

  let prefix = text.slice(0, firstUnderscoreIndex);
  const rest = text.slice(firstUnderscoreIndex);
  prefix = prefix.toLowerCase();

  // replace 'ies' with 'y'. utilities -> utility
  if (prefix.endsWith('ies')) {
    prefix = prefix.slice(0, -3) + 'y';
  }

  // singularize
  if (prefix.endsWith('s')) {
    prefix = prefix.slice(0, -1);
  }

  return prefix + rest;
}

/**
 * Initialization data for the jupyterlab_multicontents_templates extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_multicontents_templates:plugin',
  autoStart: true,
  requires: [IFileBrowserFactory, IDefaultFileBrowser],
  activate: (
    app: JupyterFrontEnd,
    browser: IFileBrowserFactory,
    defaultFileBrowser: IDefaultFileBrowser
  ) => {
    const previewFunc = (selected: ISelectedTemplate) => {
      if (selected.type === 'notebook') {
        app.commands.execute('multicontentTemplates:preview', {
          path: selected.path,
          name: selected.name
        });
      }
    };
    const onContextMenuFunc = (selected: ISelectedTemplate) => {
      app.commands.execute('multicontentTemplates:set-context', {
        path: selected.path,
        name: selected.name
      });
    };

    const widget = new TemplateListWidget(previewFunc, onContextMenuFunc);
    const { tracker } = browser;
    let mainAreaWidget: MainAreaPreviewWidget | null = null;
    widget.id = 'template:list';
    app.shell.add(widget, 'left');

    app.commands.addCommand('multicontentTemplates:preview', {
      caption: 'Preview Template Notebook',
      execute: args => {
        if (mainAreaWidget !== null) {
          mainAreaWidget.close();
        }
        mainAreaWidget = new MainAreaPreviewWidget(
          String(args.path),
          String(args.name),
          (path: string) => {
            app.commands.execute('multicontentTemplates:import', { path });
          }
        );
        if (!mainAreaWidget.isAttached) {
          app.shell.add(mainAreaWidget, 'main');
        }
        app.shell.activateById(mainAreaWidget.id);
      }
    });

    app.commands.addCommand('multicontentTemplates:import', {
      caption: 'import notebook',
      execute: args => {
        const path = String(args.path);
        const settings = ServerConnection.makeSettings();
        let untitledNotebookFilename = '';
        let newNotebookName = singularizeAndLowercaseTemplateDirectoryName(
          path.replace('/', '_')
        );

        requestAPI<any>('content', {
          method: 'PUT',
          body: JSON.stringify({ path })
        }).then(data => {
          const browserPath = defaultFileBrowser.model.path;
          return new Promise(resolve => {
            app.commands
              .execute('docmanager:new-untitled', {
                // -- create new blank notebook
                path: browserPath,
                type: 'notebook'
              })
              .then(async model => {
                // -- generate filename for the Untitled notebook that is about to be renamed
                untitledNotebookFilename = model.path;
                const namesOfAllNotebooks: string[] = [];
                const requestUrl = browserPath
                  ? `${settings.baseUrl}api/contents/${browserPath}`
                  : `${settings.baseUrl}api/contents`;
                const requestOptions: RequestInit = { method: 'GET' };
                // list all files in workspace
                const response = await ServerConnection.makeRequest(
                  requestUrl,
                  requestOptions,
                  settings
                );
                const responseData = JSON.parse(await response.text());
                responseData.content.forEach((item: any) => {
                  if (item.type === 'notebook') {
                    namesOfAllNotebooks.push(item.name);
                  }
                });
                // calculate what the name of the next notebook will need to be based on existing notebooks
                const baseName = newNotebookName.split('.')[0];
                let counter = 1;
                let candidateName = newNotebookName;
                // find unique name for new notebook
                while (namesOfAllNotebooks.includes(candidateName)) {
                  const suffix = baseName.match(/_\d+$/) ? '' : '_';
                  candidateName = `${baseName.replace(/_\d+$/, '')}${suffix}${counter}.ipynb`;
                  counter++;
                }

                if (browserPath.length > 0) {
                  // include subfolder path if not in the root jupyterlab directory
                  newNotebookName = `${browserPath}/${candidateName}`;
                } else {
                  newNotebookName = candidateName;
                }

                return model;
              })
              .then(async model => {
                // -- rename the notebook
                const requestUrl = `${settings.baseUrl}api/contents/${untitledNotebookFilename}`;
                const requestOptions: RequestInit = {
                  method: 'PATCH',
                  body: JSON.stringify({
                    path: `${newNotebookName}`
                  })
                };
                await ServerConnection.makeRequest(
                  requestUrl,
                  requestOptions,
                  settings
                );
                return model;
              })
              .then(() => {
                // -- open the new notebook
                mainAreaWidget.close();
                return app.commands.execute('docmanager:open', {
                  factory: 'Notebook',
                  path: newNotebookName
                });
              })
              .then(widget => {
                return widget.context.ready.then(() => {
                  widget.model.fromJSON(data.content);
                  resolve(widget);
                });
              })
              .then(() => {
                // -- save the notebook to disk
                return app.commands.execute('docmanager:save');
              });
          });
        });
      }
    });
    app.commands.addCommand('multicontentTemplates:publish', {
      label: 'Publish Notebook',
      iconClass: 'jp-multicontents-templates-icon',
      execute: args => {
        const selectedItem = tracker.currentWidget.selectedItems().next();
        showDialog({
          title: 'Publish Location',
          body: new PublishDialog(selectedItem.value),
          buttons: [
            Dialog.cancelButton(),
            Dialog.okButton({ label: 'Publish' })
          ]
        }).then((value: any) => {
          if (value.button.label === 'Publish') {
            requestAPI<any>('publish', {
              method: 'PUT',
              body: JSON.stringify({
                source_path: selectedItem.value['path'],
                target_path: value.value
              })
            })
              .then(data => {
                showDialog({
                  title: 'Success!',
                  body: `successfully saved template to: ${data.path}`,
                  buttons: [Dialog.okButton()]
                });
              })
              .catch(data => {
                showDialog({
                  title: 'Error',
                  body: data.message,
                  buttons: [Dialog.okButton()]
                });
              });
          }
        });
      }
    });

    app.contextMenu.addItem({
      command: 'multicontentTemplates:publish',
      selector: '.jp-DirListing-item[data-file-type="notebook"]',
      rank: 3
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('template-preview')) {
      const path = params.get('template-preview');
      requestAPI<{ path: string }>('decode-link', {
        method: 'PUT',
        body: JSON.stringify({ path })
      }).then(data => {
        const path = data.path;
        const name = data.path.split('/').pop();
        console.log(`Found preview path: ${path}`);
        Promise.all([app.restored]).then(() => {
          app.commands.execute('multicontentTemplates:preview', { path, name });
        });
      });
    }
    let contextItem: ISelectedTemplate;
    app.commands.addCommand('multicontentTemplates:set-context', {
      label: 'set context',
      execute: args => {
        contextItem = {
          path: String(args.path),
          name: String(args.name)
        } as ISelectedTemplate;
      }
    });
    app.commands.addCommand('multicontentTemplates:share-templates', {
      label: 'Share Template',
      execute: args => {
        showDialog({
          title: 'Share URL',
          body: new ShareDialog({
            path: String(contextItem.path),
            name: String(contextItem.name),
            type: 'notebook'
          }),
          buttons: [Dialog.okButton()]
        });
      }
    });

    app.contextMenu.addItem({
      command: 'multicontentTemplates:share-templates',
      selector: '.template-notebook'
    });

    console.log(
      'JupyterLab extension jupyterlab_multicontents_templates is activated!'
    );
  }
};

export default extension;
