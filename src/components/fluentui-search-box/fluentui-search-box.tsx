import * as React from 'react';
import { SearchBox } from '@fluentui/react/lib/SearchBox';

export class FluentUISearchBox extends React.Component{
  public render() {
    return (
      <SearchBox placeholder="Search" onSearch={newValue => console.log('value is ' + newValue)} />
    );
  }
}
