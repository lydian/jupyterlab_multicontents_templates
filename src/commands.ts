import { JupyterFrontEnd } from '@jupyterlab/application';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { requestAPI } from './handler';
import { MainAreaPreviewWidget } from './preview';
import { PublishDialog } from './publishDialog';
import { ShareDialog } from './shareDialog';
import { TemplateListWidget } from './templateRoot';
import { ISelectedTemplate } from './templateItem';

const BASE_NAME = 'multicontentsTemplates';

function addCommands(
  app: JupyterFrontEnd,
  browser: IFileBrowserFactory,
  templateListWidget: TemplateListWidget,
  renamePathStateFunc: (path: string) => void
): void {
  /**
   * Publish Template
   */
  app.commands.addCommand(`${BASE_NAME}:publish`, {
    label: 'Publish Notebook',
    iconClass: 'jp-multicontents-templates-icon',
    execute: args => {
      const { tracker } = browser;
      const selectedItem = tracker.currentWidget.selectedItems().next();
      showDialog({
        title: 'Publish Location',
        body: new PublishDialog(selectedItem),
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Publish' })]
      }).then((value: any) => {
        if (value.button.label === 'Publish') {
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
      });
    }
  });
  /**
   * Import Tempalte
   */
  app.commands.addCommand(`${BASE_NAME}:import`, {
    caption: 'import notebook',
    execute: args => {
      const path = String(args.path);
      const mainAreaWidget = MainAreaPreviewWidget.Instance;
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
            .then((model: any) => {
              mainAreaWidget.close();
              return app.commands.execute('docmanager:open', {
                factory: 'Notebook',
                path: model.path
              });
            })
            .then((widget: any) => {
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

  /**
   * Preview Method
   */
  app.commands.addCommand(`${BASE_NAME}:preview`, {
    caption: 'Preview Template Notebook',
    execute: args => {
      const mainAreaWidget = MainAreaPreviewWidget.makeNewInstance(
        String(args.path),
        String(args.name),
        (path: string) => {
          app.commands.execute(`${BASE_NAME}:import`, { path });
        }
      );
      if (!mainAreaWidget.isAttached) {
        app.shell.add(mainAreaWidget, 'main');
      }
      app.shell.activateById(mainAreaWidget.id);
    }
  });

  /**
   * Set Context
   */
  let contextItem: ISelectedTemplate;
  app.commands.addCommand(`${BASE_NAME}:set-context`, {
    label: 'set context',
    execute: args => {
      contextItem = {
        path: String(args.path),
        name: String(args.name)
      } as ISelectedTemplate;
    }
  });

  /**
   * Share Template
   */
  app.commands.addCommand(`${BASE_NAME}:share-templates`, {
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

  /**
   * Rename Input Template
   */
  app.commands.addCommand(`${BASE_NAME}:rename-input`, {
    label: 'Rename',
    execute: args => {
      console.log('rename');
      renamePathStateFunc(contextItem.path);
    }
  });
}

export { BASE_NAME, addCommands };
