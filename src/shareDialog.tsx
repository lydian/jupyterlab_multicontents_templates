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
    requestAPI<{ path: string }>('share-link', {
      method: 'PUT',
      body: JSON.stringify({ path: this.props.path })
    }).then(data => {
      this.setState({
        shareURL: new URL(data.path, window.location.href).href
      });
    });
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
