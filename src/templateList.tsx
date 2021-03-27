import React from 'react';

import { ReactWidget } from '@jupyterlab/apputils';
import { requestAPI } from './handler';

interface IProperties {
  onSelect: (selected: ISelectedTemplate) => void;
  onContextMenu?: (selected: ISelectedTemplate) => void;
  name?: string;
  path?: string;
  isRoot?: boolean;
}

interface IState {
  expandChild: boolean;
  loading: boolean;
  items?: { type: string; name: string; path: string }[];
}

interface ISelectedTemplate {
  name: string;
  path: string;
  type: string;
}

class TemplateFolder extends React.Component<IProperties, IState> {
  constructor(props: Readonly<IProperties>) {
    super(props);
    this.state = { items: null, expandChild: false, loading: false };
  }
  render(): JSX.Element {
    let items: JSX.Element[] = (this.state.items || []).map(item => {
      if (item.type === 'directory') {
        return (
          <TemplateFolder
            name={item.name}
            path={item.path}
            isRoot={false}
            onSelect={this.props.onSelect}
            onContextMenu={this.props.onContextMenu}
          />
        );
      } else if (item.type === 'notebook') {
        return (
          <li className="template-item template-notebook">
            <a
              onClick={() => this.props.onSelect(item)}
              onContextMenu={() => this.props.onContextMenu(item)}
            >
              <div>
                <span className="jp-multicontents-templates-item-icon"></span>
                <span>{item.name}</span>
              </div>
            </a>
          </li>
        );
      }
    });
    if (this.state.loading) {
      items = [
        <li>
          <div className="loader"></div>
        </li>
      ];
    }
    if (this.props.isRoot) {
      return (
        <ul className="template-folder multicontents-templates-ul">
          {' '}
          {items}{' '}
        </ul>
      );
    }
    return (
      <li className="template-item">
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
        <ul className="multicontents-templates-ul">{items} </ul>
      </li>
    );
  }

  componentDidMount(): void {
    if (this.props.isRoot) {
      this.expand();
    }
  }

  toggle(): void {
    const shouldExpand = !this.state.expandChild;
    this.props.onSelect({
      name: this.props.path,
      path: this.props.path,
      type: 'directory'
    });
    this.setState({ expandChild: shouldExpand });
    if (shouldExpand) {
      this.expand();
    } else {
      this.setState({ items: null });
    }
  }

  expand(): void {
    if (this.state.items !== null) {
      return;
    }
    this.setState({ loading: true });
    requestAPI<any>('list', {
      method: 'PUT',
      body: JSON.stringify({ path: this.props.path })
    })
      .then(data => {
        this.setState({ items: data.content, loading: false });
      })
      .catch(reason => {
        console.error(`Error: ${reason}`);
        this.setState({ loading: false });
      });
  }
}

class TemplateListWidget extends ReactWidget {
  onSelect: (selected: ISelectedTemplate) => void;
  onContextMenu: (selected: ISelectedTemplate) => void;

  constructor(
    onSelect: (selected: ISelectedTemplate) => void,
    onContextMenu?: (selected: ISelectedTemplate) => void
  ) {
    super();
    this.addClass('jp-ReactWidget');
    this.title.iconClass = 'jp-multicontents-templates-icon';
    this.title.caption = 'Templates';
    this.title.closable = true;
    this.onSelect = onSelect;
    this.onContextMenu = onContextMenu;
  }

  render(): JSX.Element {
    return (
      <div className="multicontents-templates">
        <h1> Templates </h1>
        <TemplateFolder
          isRoot={true}
          onSelect={this.onSelect}
          onContextMenu={this.onContextMenu}
        />
      </div>
    );
  }
}

export { ISelectedTemplate, TemplateListWidget, TemplateFolder };
