import React from 'react';
import { RenameInput } from './RenameInput';

export interface ISelectedTemplate {
  name: string;
  path: string;
  type: string;
}

interface IProperties {
  name: string;
  path: string;
  type: string;
  lastModified?: string;
  showModifiedTime?: boolean;
  editMode: boolean;
  expanded?: boolean;
  onFinishEdit: () => void;
  onSelect?: (selected: ISelectedTemplate) => void;
  onToggle?: () => void;
  onContextMenu?: (selected: ISelectedTemplate) => void;
}
export class TemplateItem extends React.Component<IProperties> {
  constructor(props: Readonly<IProperties>) {
    super(props);
  }

  toReadableTime(): string {
    const modified = new Date(this.props.lastModified);
    const delta = Math.round(+new Date() - +modified) / 1000;

    const minute = 60,
      hour = minute * 60,
      day = hour * 24,
      week = day * 7;

    let fuzzy;

    if (delta < 30) {
      fuzzy = 'just then.';
    } else if (delta < minute) {
      fuzzy = delta + ' seconds ago.';
    } else if (delta < 2 * minute) {
      fuzzy = 'a minute ago.';
    } else if (delta < hour) {
      fuzzy = Math.floor(delta / minute) + ' minutes ago.';
    } else if (Math.floor(delta / hour) === 1) {
      fuzzy = '1 hour ago.';
    } else if (delta < day) {
      fuzzy = Math.floor(delta / hour) + ' hours ago.';
    } else if (delta < day * 2) {
      fuzzy = 'yesterday';
    } else if (delta < week) {
      fuzzy = Math.floor(delta / day) + ' days ago';
    } else {
      fuzzy = modified.toISOString().split('T')[0];
    }
    return fuzzy;
  }

  render(): JSX.Element {
    const { name, path, type, editMode, onFinishEdit } = this.props;
    const editProps = { name, path, type, onFinishEdit };
    const selectedItem = { name, path, type };
    const editElem = <RenameInput {...editProps} />;
    if (type === 'notebook') {
      const iconElem = (
        <span className="jp-multicontents-templates-item-icon"></span>
      );
      if (editMode) {
        return (
          <div>
            {iconElem}
            {editElem}
          </div>
        );
      }
      const timeStr = this.props.showModifiedTime ? (
        <span className="modified-time">({this.toReadableTime()})</span>
      ) : (
        ''
      );
      return (
        <a
          onClick={() => this.props.onSelect(selectedItem)}
          onContextMenu={() => this.props.onContextMenu(selectedItem)}
          title={`${this.props.name}\nlast modified: ${this.toReadableTime()}`}
        >
          <div>
            {iconElem}
            <span>{this.props.name}</span>
            {timeStr}
          </div>
        </a>
      );
    }
    if (type === 'directory') {
      const className = this.props.expanded
        ? 'jp-multicontents-templates-expanded-folder-icon'
        : 'jp-multicontents-templates-folded-folder-icon';
      const iconElem = <span className={className}></span>;
      if (editMode) {
        return (
          <div>
            {iconElem}
            {editElem}
          </div>
        );
      }
      return (
        <a
          onClick={() => this.props.onToggle()}
          onContextMenu={() => this.props.onContextMenu(selectedItem)}
        >
          <div>
            {iconElem}
            <span>{this.props.name}</span>
          </div>
        </a>
      );
    }
  }
}
