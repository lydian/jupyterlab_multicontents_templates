import React from 'react';

import { MainAreaWidget, ReactWidget } from '@jupyterlab/apputils';
import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';
/**
 * Interface describing component properties.
 *
 * @private
 */

class PreviewWidget extends ReactWidget {
  importFunc: any;
  name: string;
  path: string;

  constructor(path: string, name: string, importFunc: any) {
    super();
    this.name = name;
    this.path = path;
    this.importFunc = importFunc;
  }
  render(): JSX.Element {
    const settings = ServerConnection.makeSettings();
    const encodedPath = encodeURIComponent(this.path);
    const requestUrl = URLExt.join(
      settings.baseUrl,
      'jupyterlab_multicontents_templates',
      `preview?path=${encodedPath}`
    );
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <div>
          <input
            type="button"
            value="Import"
            onClick={() => this.importFunc(this.path)}
          />
        </div>
        <iframe style={{ width: '100%', height: '100%' }} src={requestUrl} />
      </div>
    );
  }
}

export class MainAreaPreviewWidget extends MainAreaWidget {
  path: string;
  name: string;
  static _instance?: MainAreaPreviewWidget = null;

  constructor(path: string, name: string, importFunc: (path: string) => void) {
    super({ content: new PreviewWidget(path, name, importFunc) });
    this.id = 'MulticontentsTemplates-preview';
    this.title.label = `Preview: ${name}`;
    this.title.closable = true;
  }

  static makeNewInstance(
    path: string,
    name: string,
    importFunc: (path: string) => void
  ): MainAreaPreviewWidget {
    if (this._instance) {
      this._instance.close();
    }
    this._instance = new MainAreaPreviewWidget(path, name, importFunc);
    return this._instance;
  }

  static get Instance(): MainAreaPreviewWidget {
    return this._instance;
  }
}
