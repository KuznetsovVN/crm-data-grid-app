import * as React from 'react';
import { initializeIcons } from '@fluentui/react';
import { ContextualMenuItemType, IContextualMenuItem, ContextualMenu, DirectionalHint } from '@fluentui/react/lib/ContextualMenu';

export interface IFluentUIContextualMenuProps {
  getSelectedCount: () => number,
  onOpen: () => void,
  onOpenInNewWindow: () => void,
  onRefreshGrid: () => void,
}

interface IFluentUIContextualMenuState {
  showContextMenu: boolean,
  targetPoint: { x: number, y: number },
  items: { key: string, text?: string, iconProps?: { iconName: string }, itemType?: ContextualMenuItemType }[],
}

initializeIcons();

export class FluentUIContextualMenu extends React.Component<React.PropsWithChildren<IFluentUIContextualMenuProps>, IFluentUIContextualMenuState> {
  constructor(props: React.PropsWithChildren<IFluentUIContextualMenuProps>) {
    super(props);

    this.state = {
      showContextMenu: false,
      targetPoint: { x: 0, y: 0 },
      items: [
        { key: 'open', iconProps: { iconName: 'OpenFile' }, text: 'Открыть' },
        { key: 'openInNewWindow', iconProps: { iconName: 'OpenInNewWindow' }, text: 'Открыть в новом окне' },
        { key: 'divider_1', itemType: ContextualMenuItemType.Divider },
        { key: 'refreshContent', iconProps: { iconName: 'Refresh' }, text: 'Обновить список' },
      ]
    };
  }

  handleContextMenu(event: MouseEvent) {
    event.preventDefault();

    const count = this.props.getSelectedCount();
    const items = [];

    if (count > 0) {
      if (count === 1) {
        items.push({ key: 'open', iconProps: { iconName: 'OpenFile' }, text: 'Открыть' });
      }
      items.push({ key: 'openInNewWindow', iconProps: { iconName: 'OpenInNewWindow' }, text: 'Открыть в новом окне' });
    }

    if (items.length > 0) {
      items.push({ key: 'divider_1', itemType: ContextualMenuItemType.Divider });
    }

    items.push({ key: 'refreshContent', iconProps: { iconName: 'Refresh' }, text: 'Обновить список' });

    this.setState({
      showContextMenu: true,
      targetPoint: {
        x: event.clientX,
        y: event.clientY
      },
      items: items
    });
  }

  componentDidMount() {
    document.addEventListener("contextmenu", this.handleContextMenu.bind(this));
    document.addEventListener("mouseleave", this.onDismissMenu.bind(this));
  }

  componentWillUnmount() {
    document.removeEventListener("contextmenu", this.handleContextMenu.bind(this));
    document.removeEventListener("mouseleave", this.onDismissMenu.bind(this));
  }

  onItemClick = (ev: React.MouseEvent<HTMLElement | MouseEvent> | React.KeyboardEvent<HTMLElement> | undefined, item?: IContextualMenuItem | undefined): boolean | void => {
    ev?.preventDefault();

    switch (item?.key) {
      case 'open':
        this.props.onOpen();
        break;
      case 'openInNewWindow':
        this.props.onOpenInNewWindow();
        break;
      case 'refreshContent':
        this.props.onRefreshGrid();
        break;
    }

    this.onDismissMenu();
  };

  onDismissMenu() {
    this.setState({
      showContextMenu: false
    });
  }

  render() {
    return (
      <div>
        {this.state.showContextMenu && <ContextualMenu
          target={this.state.targetPoint}
          items={this.state.items}
          onItemClick={this.onItemClick}
          onDismiss={this.onDismissMenu.bind(this)}
          hidden={!this.state.showContextMenu}
          directionalHint={DirectionalHint.bottomLeftEdge} />}
      </div>
    );
  }
}

