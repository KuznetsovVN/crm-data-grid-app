import * as React from 'react';
import { SearchBox, ISearchBoxStyles } from '@fluentui/react/lib/SearchBox';

interface IFluentUISearchBox {
  onSearch: (newValue: string) => void
}

const searchBoxStyles: Partial<ISearchBoxStyles> = {
  root: {
    selectors: {
      '& [role=searchbox]': {
        fontSize: 12,
      },
    }
  }
};

export class FluentUISearchBox extends React.Component<React.PropsWithChildren<IFluentUISearchBox>>{
  public render() {
    return (
      <SearchBox
        styles={searchBoxStyles}
        placeholder="Search"
        onSearch={this.props.onSearch}
      />
    );
  }
}
