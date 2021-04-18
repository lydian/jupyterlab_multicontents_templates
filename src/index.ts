import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { TemplateListWidget } from './templateRoot';
import { ISelectedTemplate } from './templateItem';
import { requestAPI } from './handler';
import { BASE_NAME, addCommands } from './commands';

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
        app.commands.execute(`${BASE_NAME}:preview`, {
          path: selected.path,
          name: selected.name
        });
      }
    };
    const onContextMenuFunc = (selected: ISelectedTemplate) => {
      app.commands.execute(`${BASE_NAME}:set-context`, {
        path: selected.path,
        name: selected.name
      });
    };
    let renamePathStateFunc: (val: string) => void;
    const setRenamePathStateFunc = (func: (val: string) => void) => {
      renamePathStateFunc = func;
    };
    const templateListWidget = new TemplateListWidget(
      previewFunc,
      onContextMenuFunc,
      setRenamePathStateFunc
    );
    templateListWidget.id = 'template:list';
    app.shell.add(templateListWidget, 'left');
    Promise.all([app.restored]).then(() => {
      addCommands(app, browser, templateListWidget, renamePathStateFunc);
    });

    app.contextMenu.addItem({
      command: `${BASE_NAME}:publish`,
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
          app.commands.execute(`${BASE_NAME}:preview`, { path, name });
        });
      });
    }

    app.contextMenu.addItem({
      command: `${BASE_NAME}:share-templates`,
      selector: '.template-notebook'
    });

    app.contextMenu.addItem({
      command: `${BASE_NAME}:rename-input`,
      selector: '.configurable-item'
    });

    console.log(
      'JupyterLab extension jupyterlab_multicontents_templates is activated!'
    );
  }
};

export default extension;
