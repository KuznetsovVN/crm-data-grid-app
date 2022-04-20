import * as React from 'react';

import { initializeIcons } from '@fluentui/react';
import { DetailsList, DetailsListLayoutMode, Selection, SelectionMode, IColumn } from '@fluentui/react/lib/DetailsList';
import { MarqueeSelection } from '@fluentui/react/lib/MarqueeSelection';

import { FluentUICommandBar } from '../fluentui-command-bar/fluentui-command-bar';
import { FluentUISearchBox } from '../fluentui-search-box/fluentui-search-box';

import { IDetailsListDocumentsState } from './fluentui-details-list.types';

import { XrmHelper, IEntityMeta, IEntityColumn } from '../../api/crm-helper';

initializeIcons();

export class FluentUIDetailsList extends React.Component<{}, IDetailsListDocumentsState> {
  private _selection: Selection;
  private _allItems: { [key: string]: any }[];
  private _columns: IColumn[];

  constructor(props: {}) {
    super(props);

    this._allItems = [];
    this._columns = [];

    XrmHelper.onReady(() => {
      this.refreshColumns();
      this.refreshContent();
    });

    this._selection = new Selection({
      onSelectionChanged: () => {
        this.setState({
          selectionDetails: this._getSelectionDetails(),
        });
      },
    });

    this.state = {
      items: this._allItems,
      columns: this._columns,
      selectionDetails: this._getSelectionDetails(),
      searchValue: '',
      isModalSelection: true,
      isCompactMode: false,
      announcedMessage: undefined,
    };
  }

  public render() {
    const { columns, isCompactMode, items, selectionDetails } = this.state;

    return (
      <div>
        {/* <Announced message={selectionDetails} />
        {announcedMessage ? <Announced message={announcedMessage} /> : undefined} */}
          <FluentUICommandBar />
          <FluentUISearchBox onSearch={this._onSearch.bind(this)} />

          <MarqueeSelection selection={this._selection}>
            <DetailsList
              items={items}
              compact={isCompactMode}
              columns={columns}
              selectionMode={SelectionMode.multiple}
              getKey={this._getKey}
              setKey="multiple"
              layoutMode={DetailsListLayoutMode.justified}
              isHeaderVisible={true}
              selection={this._selection}
              selectionPreservedOnEmptyClick={true}
              onItemInvoked={this._onItemInvoked}
              enterModalSelectionOnTouch={true}
              ariaLabelForSelectionColumn="Toggle selection"
              ariaLabelForSelectAllCheckbox="Toggle selection for all items"
              checkButtonAriaLabel="select row"
            />
          </MarqueeSelection>
      </div>
    );
  }

  public componentDidUpdate(previousProps: {}, previousState: IDetailsListDocumentsState) {
    if (previousState.isModalSelection !== this.state.isModalSelection && !this.state.isModalSelection) {
      this._selection.setAllSelected(false);
    }
  }

  private refreshColumns() {
    const meta = XrmHelper.getEntityMeta();

    if(meta === undefined)
      return;

    this._columns = meta.columns
      // .filter((entityColumn: IEntityColumn) => entityColumn.visible !== false)
      .map((entityColumn: IEntityColumn) => {
        return {
            key: entityColumn.name,
            name: entityColumn.displayName,
            fieldName: entityColumn.isLookup === true ? `_${entityColumn.name}_value` : entityColumn.name,
            minWidth: 10,
            maxWidth: entityColumn.width,
            isRowHeader: true,
            isResizable: true,
            isSorted: entityColumn.primarykey === true,
            isSortedDescending: false,
            sortAscendingAriaLabel: 'Sorted A to Z',
            sortDescendingAriaLabel: 'Sorted Z to A',
            data: 'string',
            isPadded: true,
            onColumnClick: this._onColumnClick
          };
      });

    this.setState({
      columns: this._columns
    });
  }

  private refreshContent() {
    this._allItems = [];
    const fieldNames = this._columns.map(column => column.fieldName ).join(",");
    XrmHelper.getData('?$select=' + fieldNames, (data: any) => {
      if(data === undefined)
        return;

      data.entities.forEach((value:any) => {
        const item : { [key: string]: string } = {};
        this._columns.forEach((column) => {
          const ODATA_FORMATTED_POSTFIX = "@OData.Community.Display.V1.FormattedValue";
          const fieldValue = value[column.fieldName + ODATA_FORMATTED_POSTFIX] || value[column.fieldName || column.key];
          item[column.fieldName || column.key] = fieldValue;
        });

        if(this.state.searchValue.length > 0) {
          let add = false;
          for(const name in item) {
            add = add || item[name]?.toLowerCase().includes(this.state.searchValue.toLowerCase()) || false;
          }
          if(add === true) {
            this._allItems.push(item);
          }
        } else {
          this._allItems.push(item);
        }
      });

      this.setState({
        items: this._allItems
      });
    });
  }

  private _getKey(item: { [key: string]: any }): string {
    return item.key;
  }

  private _onItemInvoked(item: { [key: string]: any }): void {
    alert(`Item invoked: ${item.name}`);
  }

  private _onSearch(newValue: string) : void {
    this.setState({
      searchValue : newValue
    });

    this.refreshContent();
  }

  private _getSelectionDetails(): string {
    const selectionCount = this._selection.getSelectedCount();

    switch (selectionCount) {
      case 0:
        return 'No items selected';
      case 1:
        return '1 item selected: ' + (this._selection.getSelection()[0] as { [key: string]: any }).name;
      default:
        return `${selectionCount} items selected`;
    }
  }

  private _onColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    const { columns, items } = this.state;
    const newColumns: IColumn[] = columns.slice();
    const currColumn: IColumn = newColumns.filter(currCol => column.key === currCol.key)[0];
    newColumns.forEach((newCol: IColumn) => {
      if (newCol === currColumn) {
        currColumn.isSortedDescending = !currColumn.isSortedDescending;
        currColumn.isSorted = true;
        this.setState({
          announcedMessage: `${currColumn.name} is sorted ${
            currColumn.isSortedDescending ? 'descending' : 'ascending'
          }`,
        });
      } else {
        newCol.isSorted = false;
        newCol.isSortedDescending = true;
      }
    });
    const newItems = _copyAndSort(items, currColumn.fieldName || currColumn.name, currColumn.isSortedDescending);
    this.setState({
      columns: newColumns,
      items: newItems,
    });
  };
}

function _copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
  const key = columnKey as keyof T;
  return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
}
