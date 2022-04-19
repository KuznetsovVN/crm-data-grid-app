import * as React from 'react';
import { SearchBox } from '@fluentui/react/lib/SearchBox';

interface IFluentUISearchBox {
  onSearch: (newValue: string) => void
}

export class FluentUISearchBox extends React.Component<React.PropsWithChildren<IFluentUISearchBox>>{
  public render() {
    return (
      <SearchBox placeholder="Search" onSearch={this.props.onSearch} />
    );
  }
}
