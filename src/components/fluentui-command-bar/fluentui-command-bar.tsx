import * as React from 'react';

import { initializeIcons } from '@fluentui/react';
import { CommandBar, ICommandBarItemProps, ICommandBarStyles } from '@fluentui/react/lib/CommandBar';
import { IButtonStyles } from '@fluentui/react/lib/Button';

import { IEntityViewItem, XrmHelper } from '../../api/crm-helper';

initializeIcons();

export interface IFluentUICommandBarProps {
  onOpenInNewWindow: () => void,
  onRefreshGrid: () => void,
}

let subscribeOnReadyEvent = true;

export const FluentUICommandBar: React.FunctionComponent<React.PropsWithChildren<IFluentUICommandBarProps>> = (props: React.PropsWithChildren<IFluentUICommandBarProps>) => {
  const [ state, setState ] = React.useState({
    config: XrmHelper.getConfig(),
  });

  if(subscribeOnReadyEvent) {
    subscribeOnReadyEvent = false;

    XrmHelper.onReady(() => {
      setState({
        config: XrmHelper.getConfig(),
      });
    });
  }

  const _styles: ICommandBarStyles = {
    root: {
      backgroundColor: '#F3F3F3',
      color: '#505050',
      height: '38px',
      padding: '0px 10px 0px 10px',

      selectors: {
      '& [role=menuitem]': {
        fontSize: 12,
      },
    },
    }
  };

  const _buttonStyles: IButtonStyles = {
    textContainer: { color: '#505050' },
    label: { fontWeight: "bold" },
    icon: { color: '#505050' },
    root: { backgroundColor: 'transparent' },
    rootDisabled: { backgroundColor: 'transparent' },
  };

  const _buttonStylesActive: IButtonStyles = {
    textContainer: { color: '#505050' },
    label: { },
    labelHovered: { color: '#0078D4' },
    icon: { },
    root: { backgroundColor: 'transparent' },
    rootDisabled: { backgroundColor: 'transparent' },
    rootHovered: { backgroundColor: '#FEFEFE' }
  };

  const _items: ICommandBarItemProps[] = [];
  if(state.config.title) {
    _items.push({
      key: 'caption',
      text: state.config.title,
      ariaLabel: state.config.title,
      disabled: true,
      buttonStyles: _buttonStyles,
    });
  }

  /* entity view item list */

  if (state.config.entityViewItems) {
    const currentEntityViewItem : IEntityViewItem = state.config.entityViewItems.filter((item:IEntityViewItem) => item.active === true)[0];

    const subMenuitems : any[] = [];
    state.config.entityViewItems.forEach((item: IEntityViewItem) => {
      subMenuitems.push({
        key: item.guid,
        name: item.name,
        onClick: () => { state.config.onChangeEntityView && state.config.onChangeEntityView(item); },
      });
    });

    _items.push({
        key: 'activeEntityViewMenu',
        name: currentEntityViewItem?.name ?? '',
        subMenuProps: { items: subMenuitems },
        buttonStyles: _buttonStyles,
    });
  }

  /* custom command items */

  if (state.config?.commandBarItems) {
    state.config.commandBarItems.forEach((element: any) => {
      _items.push({
        key: element.key,
        text: element.text,
        disabled: typeof element.disabled === 'function' ? element.disabled() : element.disabled,
        iconProps: { iconName: element.iconName },
        onClick: () => { if (typeof element.clickHandler === 'function') { element.clickHandler(); } },
        buttonStyles: _buttonStylesActive
      });
    });
  }

  /* basic command items */

  const _farItems: ICommandBarItemProps[] = [];
  if(state.config.allowAddButton === true) {
    _farItems.push({
      key: 'add',
      text: 'Добавить запись ' + state.config.displayName + '.',
      ariaLabel: 'Add',
      iconOnly: true,
      iconProps: { iconName: 'Add' },
      onClick: () => { XrmHelper.openQuickCreate(state.config.entityName); },
      buttonStyles: _buttonStyles,
    });
  }
  if(state.config.allowOpenAssociatedRecordsButton) {
    _farItems.push({
      key: 'table',
      text: 'Просмотрите записи, связанные с этим представлением.',
      ariaLabel: 'Table',
      iconOnly: true,
      iconProps: { iconName: 'Table' },
      onClick: () => { XrmHelper.openSubGrid(); },
      buttonStyles: _buttonStyles,
    });
  }
  if(state.config.allowRefreshGridViewButton) {
    _farItems.push({
      key: 'refresh',
      text: 'Обновить содержимое таблицы.',
      ariaLabel: 'Refresh',
      iconOnly: true,
      iconProps: { iconName: 'Refresh' },
      onClick: () => { props.onRefreshGrid(); },
      buttonStyles: _buttonStyles,
    });
  }
  if(state.config.allowOpenInNewWindowButton) {
    _farItems.push({
      key: 'openInNewWindow',
      text: 'Открыть выбранные элементы таблицы.',
      ariaLabel: 'OpenInNewWindow',
      iconOnly: true,
      iconProps: { iconName: 'OpenInNewWindow' },
      onClick: () => { props.onOpenInNewWindow(); },
      buttonStyles: _buttonStyles,
    });
  }

  return (
    <CommandBar
      styles={_styles}
      items={_items}
      farItems={_farItems}
    />
  );
};
