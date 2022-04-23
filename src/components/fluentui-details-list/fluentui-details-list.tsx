import * as React from 'react';

import { initializeIcons } from '@fluentui/react';
import { DetailsList, DetailsListLayoutMode, Selection, SelectionMode, IColumn } from '@fluentui/react/lib/DetailsList';
import { Link } from '@fluentui/react/lib/Link';
import { MarqueeSelection } from '@fluentui/react/lib/MarqueeSelection';

import { FluentUICommandBar } from '../fluentui-command-bar/fluentui-command-bar';
import { FluentUISearchBox } from '../fluentui-search-box/fluentui-search-box';

import { IDetailsListDocumentsProps, IDetailsListDocumentsState, IDetailsListItem } from './fluentui-details-list.types';

import { XrmHelper, IEntityColumn } from '../../api/crm-helper';

const ODATA_FORMATTED_POSTFIX = "@OData.Community.Display.V1.FormattedValue";
const ODATA_LOOKUPLOGICALNAME = "@Microsoft.Dynamics.CRM.lookuplogicalname";

initializeIcons();

export class FluentUIDetailsList extends React.Component<IDetailsListDocumentsProps, IDetailsListDocumentsState> {
  private _selection: Selection;
  private _allItems: { [key: string]: IDetailsListItem | string }[];
  private _columns: IColumn[];

  constructor(props: IDetailsListDocumentsProps) {
    super(props);

    this._allItems = [];
    this._columns = [];

    XrmHelper.onReady(() => {
      this.refreshColumns();
      this.refreshContent();
    });

    this._selection = new Selection({
      onSelectionChanged: () => {
        const selectionKeys : string[] = this._getSelectionKeys();
        const selectionDetails : string = selectionKeys.join(',');
        this.props.getSelectedItemIdsCallback(selectionKeys);
        this.setState({
          selectionDetails: selectionDetails,
        });
      },
    });

    this.state = {
      items: this._allItems,
      columns: this._columns,
      selectionDetails: this._getSelectionKeys().join(','),
      searchValue: '',
      isModalSelection: true,
      isCompactMode: true,
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

    const margin = 44; // gridCell { margin-left: 12px, margin-right: 32px }

    this._columns = meta.columns
      .filter((entityColumn: IEntityColumn) => entityColumn.isHidden !== true)
      .map((entityColumn: IEntityColumn) => {
        return {
            key: entityColumn.name,
            name: entityColumn.displayName,
            fieldName: entityColumn.fieldName,
            minWidth: 10,
            maxWidth: Math.abs(entityColumn.width - margin),
            currentWidth: Math.abs(entityColumn.width - margin),
            isRowHeader: true,
            isResizable: true,
            isSorted: entityColumn.isPrimary === true,
            isSortedDescending: false,
            sortAscendingAriaLabel: 'Sorted A to Z',
            sortDescendingAriaLabel: 'Sorted Z to A',
            data: 'string',
            isPadded: true,
            onColumnClick: this._onColumnClick,
            onRender: (item, index, column) => (
              <div>
                {
                  entityColumn.hasLink
                    ? <Link key={item} onClick={() => { const linkItem = item[column?.fieldName ?? '']; XrmHelper.openForm(linkItem.entityName, linkItem.value); } }>{item[column?.fieldName || ''].text}</Link>
                    : item[column?.fieldName || ''].text
                }
              </div>
            ),
          } as IColumn;
      });

    this.setState({
      columns: this._columns
    });
  }

  private refreshContent() {
    this._allItems = [];

    XrmHelper.getDataByFetchXml((data: any) => {
      if(data === undefined)
        return;

      const meta = XrmHelper.getEntityMeta();
      if(meta?.columns === undefined)
        return;

      data.entities.forEach((data : any) => {
        const entityId = data[meta.columns.find((entityColumn) => entityColumn.isPrimary === true)?.fieldName ?? ''];

        const item : { [key: string]: IDetailsListItem | string } = {
          key: entityId
        };

        this._columns.forEach((column : IColumn) => {
          const metaColumn = meta.columns.find((entityColumn) => entityColumn.fieldName === column.fieldName);
          if(!metaColumn) { throw new Error('meta column not found'); }

          const fieldName = column.fieldName ?? column.name;
          const fieldText = data[column.fieldName + ODATA_FORMATTED_POSTFIX] ?? data[fieldName];
          let fieldValue = fieldText;
          let entityName;
          // const entityId = data[meta.columns.find((entityColumn) => entityColumn.isPrimary === true)?.fieldName ?? column.name];

          if(metaColumn.hasLink) {
            fieldValue = (metaColumn.isLookup === true) ? data[metaColumn.fieldName] : entityId;
            entityName = (metaColumn.isLookup === true) ? data[column.fieldName + ODATA_LOOKUPLOGICALNAME] : meta.name;
          }

          item[fieldName] = {
            text: fieldText,
            value: fieldValue,
            entityName: entityName
          } as IDetailsListItem;
        });

        if(this.state.searchValue.length > 0) {
          let add = false;
          for(const name in item) {
            add = add || (item[name] as IDetailsListItem).text?.toLowerCase().includes(this.state.searchValue.toLowerCase()) || false;
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

  private _getSelectionKeys(): string[] {
    const keys : (string | number | undefined)[] = [];
    this._selection.getSelection().forEach((item) => { keys.push(item.key); });
    return keys as string[];
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
