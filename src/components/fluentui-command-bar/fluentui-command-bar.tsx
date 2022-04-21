import * as React from 'react';

import { initializeIcons } from '@fluentui/react';
import { CommandBar, ICommandBarItemProps, ICommandBarStyles } from '@fluentui/react/lib/CommandBar';
import { IButtonStyles } from '@fluentui/react/lib/Button';

import { XrmHelper } from '../../api/crm-helper';

initializeIcons();

export const FluentUICommandBar: React.FunctionComponent = () => {
  const [ state, setState ] = React.useState({
    name: XrmHelper.getEntityMeta()?.name || '',
    displayName: XrmHelper.getEntityMeta()?.displayName || '',
    displayNameCollection: XrmHelper.getEntityMeta()?.displayCollectionName || '',
  });

  XrmHelper.onReady(() => {
    setState({
      name: XrmHelper.getEntityMeta()?.name || '',
      displayName: XrmHelper.getEntityMeta()?.displayName || '',
      displayNameCollection: XrmHelper.getEntityMeta()?.displayCollectionName || '',
    });
  });

  const _styles: ICommandBarStyles = {
    root: {
      color: '#505050',
      backgroundColor: '#F3F3F3',
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

  const _farItems: ICommandBarItemProps[] = [
    {
      key: 'add',
      text: 'Добавить запись ' + state.displayName + '.',
      ariaLabel: 'Add',
      iconOnly: true,
      iconProps: { iconName: 'Add' },
      onClick: () => { XrmHelper.openQuickCreate(state.name); },
      buttonStyles: _buttonStyles,
    },
    {
      key: 'table',
      text: 'Просмотрите записи, связанные с этим представлением.',
      ariaLabel: 'Table',
      iconOnly: true,
      iconProps: { iconName: 'Table' },
      onClick: () => { XrmHelper.openSubGrid(); },
      buttonStyles: _buttonStyles,
    },
  ];

  return (
    <CommandBar
      styles={_styles}
      items={_items}
      farItems={_farItems}
    />
  );
};
