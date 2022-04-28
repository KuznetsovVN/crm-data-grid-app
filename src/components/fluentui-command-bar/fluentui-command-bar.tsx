import * as React from 'react';

import { initializeIcons } from '@fluentui/react';
import { CommandBar, ICommandBarItemProps, ICommandBarStyles } from '@fluentui/react/lib/CommandBar';
import { IButtonStyles } from '@fluentui/react/lib/Button';

import { XrmHelper } from '../../api/crm-helper';

initializeIcons();

export interface IFluentUICommandBarProps {
  onRefreshGrid: () => void,
  onOpenInNewWindow: () => void,
}

export const FluentUICommandBar: React.FunctionComponent<React.PropsWithChildren<IFluentUICommandBarProps>> = (props: React.PropsWithChildren<IFluentUICommandBarProps>) => {
  const [ state, setState ] = React.useState({
    uiConfig: XrmHelper.getUIConfig(),
    name: XrmHelper.getEntityMeta()?.name || '',
    displayName: XrmHelper.getEntityMeta()?.displayName || '',
    displayNameCollection: XrmHelper.getEntityMeta()?.displayCollectionName || '',
  });

  XrmHelper.onReady(() => {
    setState({
      uiConfig: XrmHelper.getUIConfig(),
      name: XrmHelper.getEntityMeta()?.name || '',
      displayName: XrmHelper.getEntityMeta()?.displayName || '',
      displayNameCollection: XrmHelper.getEntityMeta()?.displayCollectionName || '',
    });
  });

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

  const _items: ICommandBarItemProps[] = [
    {
      key: 'caption',
      text: state.displayNameCollection,
      ariaLabel: state.displayNameCollection,
      disabled: true,
      buttonStyles: _buttonStyles,
    }
  ];

  const _farItems: ICommandBarItemProps[] = [];
  if(state.uiConfig.allowAddButton === true) {
    _farItems.push({
      key: 'add',
      text: 'Добавить запись ' + state.displayName + '.',
      ariaLabel: 'Add',
      iconOnly: true,
      iconProps: { iconName: 'Add' },
      onClick: () => { XrmHelper.openQuickCreate(state.name); },
      buttonStyles: _buttonStyles,
    });
  }
  if(state.uiConfig.allowOpenAssociatedRecordsButton) {
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
  if(state.uiConfig.allowRefreshGridViewButton) {
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
  if(state.uiConfig.allowOpenInNewWindowButton) {
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
