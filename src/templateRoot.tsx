import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { ISelectedTemplate } from './templateItem';
import {
  TemplateFolder,
  ITemplateFolderProperties,
  ITemplateFolderState
} from './templateList';

interface IProperties extends ITemplateFolderProperties {
  test: number;
}

interface IState extends ITemplateFolderState {
  renamePath?: string;
}

export class TemplateRoot extends TemplateFolder<IProperties, IState> {
  constructor(props: Readonly<IProperties>) {
    super(props);
    if (this.props.setRenameState) {
      this.props.setRenameState((val: string) => {
        this.setState({ renamePath: val });
      });
    }
  }

  render(): JSX.Element {
    const items: JSX.Element[] = (this.state.items || []).map(item => {
      return (
        <TemplateFolder
          name={item.name}
          path={item.path}
          onSelect={this.props.onSelect}
          onContextMenu={this.props.onContextMenu}
          renamePath={this.state.renamePath}
          level={1}
          onFinishEdit={this.onFinishEdit.bind(this)}
          showModifiedTime={this.props.showModifiedTime}
        />
      );
    });
    return (
      <ul className="template-folder multicontents-templates-ul">{items}</ul>
    );
  }

  onFinishEdit(): void {
    this.setState({ renamePath: null });
  }

  componentDidMount(): void {
    this.updateItems(true);
  }

  componentDidUpdate(): void {
    // overwrite and do nothing
  }

  componentWillUnmount(): void {
    // overwrite and do nothing
  }
}

class TemplateListWidget extends ReactWidget {
  onSelect: (selected: ISelectedTemplate) => void;
  onContextMenu: (selected: ISelectedTemplate) => void;
  setRenameState?: (func: any) => void;

  constructor(
    onSelect: (selected: ISelectedTemplate) => void,
    onContextMenu?: (selected: ISelectedTemplate) => void,
    setRenameStateFunc?: (func: any) => void
  ) {
    super();
    this.addClass('jp-ReactWidget');
    this.title.iconClass = 'jp-multicontents-templates-icon';
    this.title.caption = 'Templates';
    this.title.closable = true;
    this.onSelect = onSelect;
    this.onContextMenu = onContextMenu;
    this.setRenameState = setRenameStateFunc;
  }

  render(): JSX.Element {
    return (
      <div className="multicontents-templates">
        <h1> Templates </h1>
        <TemplateRoot
          level={0}
          onSelect={this.onSelect}
          onContextMenu={this.onContextMenu}
          setRenameState={this.setRenameState}
          showModifiedTime={true}
        />
      </div>
    );
  }
}

export { TemplateListWidget };
