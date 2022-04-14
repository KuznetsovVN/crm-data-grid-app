import * as React from 'react';

import { initializeIcons } from '@fluentui/react';
import { CommandBar, ICommandBarItemProps, ICommandBarStyles } from '@fluentui/react/lib/CommandBar';
import { IButtonStyles } from '@fluentui/react/lib/Button';

initializeIcons();

export const FluentUICommandBar: React.FunctionComponent = () => {
  return (
    <CommandBar
      styles={_styles}
      items={_items}
      farItems={_farItems}
    />
  );
};

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
    text: 'Контакт',
    ariaLabel: 'Контакт',
    disabled: true,
    buttonStyles: _buttonStyles,
  }
];

const _farItems: ICommandBarItemProps[] = [
  {
    key: 'add',
    text: 'Добавить запись Контакт.',
    ariaLabel: 'Add',
    iconOnly: true,
    iconProps: { iconName: 'Add' },
    onClick: () => console.log('Add'),
    buttonStyles: _buttonStyles,
  },
  {
    key: 'table',
    text: 'Просмотрите записи, связанные с этим представлением.',
    ariaLabel: 'Table',
    iconOnly: true,
    iconProps: { iconName: 'Table' },
    onClick: () => console.log('Table'),
    buttonStyles: _buttonStyles,
  },
];
