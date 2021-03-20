import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { TemplateFolder, ISelectedTemplate } from './templateList';

interface IProperties {
  srcNotebook: { name: string; path: string };
  valueFunc: (value: string) => void;
}
interface IState {
  targetPath: string | null;
}

class PublishSelector extends React.Component<IProperties, IState> {
  constructor(props: Readonly<IProperties>) {
    super(props);
    this.state = { targetPath: null };
  }

  render(): JSX.Element {
    return (
      <div>
        <label>Save to:</label>
        <input
          value={this.state.targetPath}
          onChange={this.handleChange.bind(this)}
          className="multicontents-save-input"
        />
        <TemplateFolder isRoot={true} onSelect={this.onSelect.bind(this)} />
      </div>
    );
  }

  change(value: string): void {
    this.setState({ targetPath: value });
    this.props.valueFunc(value);
  }

  onSelect(selected: ISelectedTemplate): void {
    let targetPath: string;
    if (selected.type === 'directory') {
      targetPath = selected.path + '/' + this.props.srcNotebook.name;
    } else {
      targetPath = selected.path;
    }
    this.change(targetPath);
  }
  handleChange(event: any) {
    this.change(event.target.value);
  }
}

export class PublishDialog extends ReactWidget {
  srcNotebook: { name: string; path: string };
  static value?: string;
  constructor(srcNotebook: { name: string; path: string }) {
    super();
    this.srcNotebook = srcNotebook;
  }
  render(): JSX.Element {
    return (
      <div>
        <PublishSelector
          srcNotebook={this.srcNotebook}
          valueFunc={this.setValue}
        ></PublishSelector>
      </div>
    );
  }
  setValue(value: string): void {
    console.log(`Updated value: ${value}`);
    PublishDialog.value = value;
  }
  public getValue(): string {
    return PublishDialog.value;
  }
}
