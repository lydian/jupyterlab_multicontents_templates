import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { TemplateListWidget } from './templateList';
import { MainAreaPreviewWidget } from './preview';
import { requestAPI } from './handler';

/**
 * Initialization data for the jupyterlab_multicontents_templates extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_multicontents_templates:plugin',
  autoStart: true,
  requires: [IFileBrowserFactory],
  activate: (app: JupyterFrontEnd, browser: IFileBrowserFactory) => {
    const widget = new TemplateListWidget((path: string, name: string) => {
      app.commands.execute('multicontentTemplates:preview', { path, name });
    });
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

    console.log(
      'JupyterLab extension jupyterlab_multicontents_templates is activated!'
    );
  }
};

export default extension;
