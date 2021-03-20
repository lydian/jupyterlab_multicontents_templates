import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { TemplateListWidget, ISelectedTemplate } from './templateList';
import { MainAreaPreviewWidget } from './preview';
import { requestAPI } from './handler';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { PublishDialog } from './publishDialog';

/**
 * Initialization data for the jupyterlab_multicontents_templates extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_multicontents_templates:plugin',
  autoStart: true,
  requires: [IFileBrowserFactory],
  activate: (app: JupyterFrontEnd, browser: IFileBrowserFactory) => {
    const previewFunc = (selected: ISelectedTemplate) => {
      if (selected.type === 'notebook') {
        app.commands.execute('multicontentTemplates:preview', {
          path: selected.path,
          name: selected.name
        });
      }
    };

    const widget = new TemplateListWidget(previewFunc);
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
        requestAPI<any>('content', {
          method: 'PUT',
          body: JSON.stringify({ path })
        }).then(data => {
          const browserPath = browser.defaultBrowser.model.path;
          return new Promise(resolve => {
            app.commands
              .execute('docmanager:new-untitled', {
                path: browserPath,
                type: 'notebook'
              })
              .then(model => {
                mainAreaWidget.close();
                return app.commands.execute('docmanager:open', {
                  factory: 'Notebook',
                  path: model.path
                });
              })
              .then(widget => {
                return widget.context.ready.then(() => {
                  widget.model.fromJSON(data.content);
                  resolve(widget);
                });
              })
              .then(() => {
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
        console.log(args);
        const selectedItem = tracker.currentWidget.selectedItems().next();
        showDialog({
          title: 'Publish Location',
          body: new PublishDialog(selectedItem),
          buttons: [
            Dialog.cancelButton(),
            Dialog.okButton({ label: 'Publish' })
          ]
        }).then((value: any) => {
          if (value.button.label === 'Publish') {
            console.log(selectedItem, value);
            requestAPI<any>('publish', {
              method: 'PUT',
              body: JSON.stringify({
                source_path: selectedItem.path,
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

          console.log({ selectedItem, value });
        });
      }
    });

    app.contextMenu.addItem({
      command: 'multicontentTemplates:publish',
      selector: '.jp-DirListing-item[data-file-type="notebook"]',
      rank: 3
    });

    console.log(
      'JupyterLab extension jupyterlab_multicontents_templates is activated!'
    );
  }
};

export default extension;
