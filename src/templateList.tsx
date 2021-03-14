import React from 'react';

import { ReactWidget } from '@jupyterlab/apputils';
import { requestAPI } from './handler';

interface IProperties {
  previewFunc: (path: string, name: string) => void;
  name?: string;
  path?: string;
  isRoot?: boolean;
}

interface IState {
  expandChild: boolean;
  items?: { type: string; name: string; path: string }[];
}

class TemplateFolder extends React.Component<IProperties, IState> {
  constructor(props: Readonly<IProperties>) {
    super(props);
    this.state = { items: null, expandChild: false };
  }
  render() {
    const items: JSX.Element[] = (this.state.items || []).map(item => {
      if (item.type === 'directory') {
        return (
          <TemplateFolder
            name={item.name}
            path={item.path}
            isRoot={false}
            previewFunc={this.props.previewFunc}
          />
        );
      } else if (item.type === 'notebook') {
        return (
          <li className="template-item">
            <a onClick={() => this.props.previewFunc(item.path, item.name)}>
              <div>
                <span className="jp-multicontents-templates-item-icon"></span>
                <span>{item.name}</span>
              </div>
            </a>
          </li>
        );
      }
    });
    if (this.props.isRoot) {
      return <ul className="template-folder"> {items} </ul>;
    }
    return (
      <li>
        <a onClick={() => this.toggle()}>
          <div>
            <span
              className={
                this.state.items === null
                  ? 'jp-multicontents-templates-folded-folder-icon'
                  : 'jp-multicontents-templates-expanded-folder-icon'
              }
            ></span>
            <span>{this.props.name}</span>
          </div>
        </a>
        <ul>{items} </ul>
      </li>
    );
  }

  componentDidMount() {
    if (this.props.isRoot) {
      this.expand();
    }
  }

  toggle() {
    const shouldExpand = !this.state.expandChild;
    this.setState({ expandChild: shouldExpand });
    if (shouldExpand) {
      this.expand();
    } else {
      this.setState({ items: null });
    }
  }

  expand() {
    if (this.state.items !== null) {
      return;
    }

    requestAPI<any>('list', {
      method: 'PUT',
      body: JSON.stringify({ path: this.props.path })
    })
      .then(data => {
        this.setState({ items: data.content });
      })
      .catch(reason => {
        console.error(`Error: ${reason}`);
      });
  }
}

export class TemplateListWidget extends ReactWidget {
  previewFunc: (path: string, name: string) => void;

  constructor(previewFunc: (path: string, name: string) => void) {
    super();
    this.addClass('jp-ReactWidget');
    this.title.iconClass = 'jp-multicontents-templates-icon';
    this.title.caption = 'Templates';
    this.title.closable = true;
    this.previewFunc = previewFunc;
  }

  render(): JSX.Element {
    return (
      <div className="jp-multicontents-templates">
        <h1> Templates </h1>
        <div className="jp-multicontents-templates-list">
          <TemplateFolder isRoot={true} previewFunc={this.previewFunc} />
        </div>
      </div>
    );
  }
}
