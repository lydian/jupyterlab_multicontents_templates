import React from 'react';

import { requestAPI } from './handler';
import { ISelectedTemplate, TemplateItem } from './templateItem';

interface ITemplateFolderProperties {
  onSelect: (selected: ISelectedTemplate) => void;
  onContextMenu?: (selected: ISelectedTemplate) => void;
  onFinishEdit?: () => void;
  name?: string;
  path?: string;
  level: number;
  renamePath?: string;
  showModifiedTime?: boolean;
  setRenameState?: (func: any) => void;
}

interface ITemplateFolderState {
  expandChild: boolean;
  loading: boolean;
  items?: { type: string; name: string; path: string; last_modified: string }[];
  renamePath?: string;
}

class TemplateFolder<
  T extends ITemplateFolderProperties,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  S extends ITemplateFolderState
> extends React.Component<ITemplateFolderProperties, ITemplateFolderState> {
  interval: number;

  constructor(props: Readonly<T>) {
    super(props);
    this.state = { items: null, expandChild: false, loading: false };
    if (this.props.setRenameState) {
      this.props.setRenameState((val: string) => {
        this.setState({ renamePath: val });
      });
    }
  }
  render(): JSX.Element {
    let items: JSX.Element[] = (this.state.items || []).map(item => {
      if (item.type === 'directory') {
        return (
          <TemplateFolder
            name={item.name}
            path={item.path}
            level={this.props.level + 1}
            onSelect={this.props.onSelect}
            onContextMenu={this.props.onContextMenu}
            renamePath={this.props.renamePath}
            onFinishEdit={this.props.onFinishEdit}
            showModifiedTime={this.props.showModifiedTime}
          />
        );
      } else if (item.type === 'notebook') {
        const editMode = item.path === this.props.renamePath;
        return (
          <li className="template-item configurable-item template-notebook">
            <TemplateItem
              name={item.name}
              type={item.type}
              path={item.path}
              lastModified={item.last_modified}
              showModifiedTime={this.props.showModifiedTime}
              editMode={editMode}
              onFinishEdit={this.props.onFinishEdit}
              onSelect={this.props.onSelect}
              onContextMenu={this.props.onContextMenu}
            />
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
    if (this.props.level === 0) {
      return (
        <ul className="template-folder multicontents-templates-ul">
          {' '}
          {items}{' '}
        </ul>
      );
    }
    const editeMode = this.props.path === this.props.renamePath;
    const classNames = ['template-item'];
    if (this.props.level > 1) {
      classNames.push('configurable-item');
    }
    return (
      <li className={classNames.join(' ')}>
        <TemplateItem
          name={this.props.name}
          path={this.props.path}
          type="directory"
          editMode={editeMode}
          expanded={this.state.items !== null}
          onToggle={this.toggle.bind(this)}
          onFinishEdit={this.props.onFinishEdit}
          onContextMenu={this.props.onContextMenu}
        />
        <ul className="multicontents-templates-ul">{items} </ul>
      </li>
    );
  }
  componentDidUpdate(): void {
    if (this.state.items && !this.interval) {
      this.interval = setInterval(() => this.updateItems(false), 3000);
    }
  }

  componentWillUnmount(): void {
    clearInterval(this.interval);
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
      if (this.state.items !== null) {
        return;
      }
      this.updateItems(true);
      this.setState({ loading: true });
    } else {
      this.setState({ items: null });
      clearInterval(this.interval);
    }
  }

  updateItems(setLoading: boolean): void {
    if (setLoading) {
      this.setState({ loading: true });
    }
    requestAPI<any>('list', {
      method: 'PUT',
      body: JSON.stringify({ path: this.props.path })
    })
      .then(data => {
        this.setState({ items: data.content, loading: false });
      })
      .catch(reason => {
        console.error(`Error: ${reason}`);
        if (setLoading) {
          this.setState({ loading: false });
        }
      });
  }
  onFinishEdit(): void {
    this.setState({ renamePath: null });
  }
}

export { TemplateFolder, ITemplateFolderProperties, ITemplateFolderState };
