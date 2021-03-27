import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { Clipboard } from '@jupyterlab/apputils';
import { ISelectedTemplate } from './templateList';
import { requestAPI } from './handler';

interface IProperties {
  path: string;
}
interface IState {
  shareURL: string;
}

class ShareDialogContent extends React.Component<IProperties, IState> {
  constructor(props: Readonly<IProperties>) {
    super(props);
    this.state = { shareURL: null };
    const encodedPath = encodeURIComponent(String(this.props.path));
    requestAPI<{ append_hub_user_redirect: boolean }>('server-info').then(
      data => {
        let path = `/?from=multicontentsTemplates&preview=${encodedPath}`;
        if (data.append_hub_user_redirect) {
          path = '/user-redirect' + path;
        }
        this.setState({ shareURL: new URL(path, window.location.href).href });
      }
    );
  }
  render(): JSX.Element {
    if (this.state.shareURL) {
      Clipboard.copyToSystem(this.state.shareURL);
    }
    return (
      <div className="share-link">
        <div>Share with this link: (Already copied to clipboard)</div>
        <div className="share-link-url">
          <input
            onClick={e => {
              (e.target as HTMLInputElement).select();
            }}
            className="share-link-input"
            value={this.state.shareURL}
          />
        </div>
      </div>
    );
  }
}
export class ShareDialog extends ReactWidget {
  path: string;

  constructor(contextItem: ISelectedTemplate) {
    super();
    this.path = contextItem.path;
  }
  render(): JSX.Element {
    return <ShareDialogContent path={this.path}></ShareDialogContent>;
  }
}
