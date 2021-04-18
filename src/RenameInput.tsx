import React from 'react';
import { requestAPI } from './handler';

interface IProperties {
  name: string;
  path: string;
  type: string;
  onFinishEdit: () => void;
}

interface IState {
  value?: string;
}

export class RenameInput extends React.Component<IProperties, IState> {
  inputElem?: HTMLInputElement;

  constructor(props: Readonly<IProperties>) {
    super(props);
    this.state = { value: null };
  }

  componentDidMount(): void {
    this.inputElem.focus();
  }

  rename(targetName: string): void {
    const newPath = this.props.path
      .split('/')
      .slice(0, -1)
      .concat([targetName])
      .join('/');
    if (this.props.path === newPath) {
      return this.props.onFinishEdit();
    }
    console.log(`rename ${this.props.path} to ${newPath}`);
    requestAPI<any>('rename', {
      method: 'PUT',
      body: JSON.stringify({ src_path: this.props.path, dst_path: newPath })
    })
      .then(data => {
        console.log(data);
        this.props.onFinishEdit();
      })
      .catch(reason => {
        console.log(reason);
        this.props.onFinishEdit();
      });
  }

  render(): JSX.Element {
    return (
      <input
        defaultValue={this.props.name}
        ref={inputEL => (this.inputElem = inputEL)}
        onBlur={event => this.rename((event.target as HTMLInputElement).value)}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            this.rename((event.target as HTMLInputElement).value);
          }
        }}
      />
    );
  }
}
