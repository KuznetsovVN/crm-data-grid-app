import * as React from 'react';

import { initializeIcons } from '@fluentui/react';
import { TooltipHost, TooltipOverflowMode, ITooltipHostStyles } from '@fluentui/react/lib/Tooltip';
import { DetailsList, DetailsListLayoutMode, Selection, SelectionMode, IColumn, ConstrainMode, IDetailsListStyles } from '@fluentui/react/lib/DetailsList';
import { Link } from '@fluentui/react/lib/Link';

import { FluentUIContextualMenu } from '../fluentui-context-menu/fluentui-context-menu';
import { FluentUICommandBar } from '../fluentui-command-bar/fluentui-command-bar';
import { FluentUISearchBox } from '../fluentui-search-box/fluentui-search-box';

import { IDetailsListDocumentsProps, IDetailsListDocumentsState, IDetailsListItem } from './fluentui-details-list.types';
import noDataImg from './no-data.png';

import { XrmHelper, IEntityColumn } from '../../api/crm-helper';

const ODATA_FORMATTED_POSTFIX = "@OData.Community.Display.V1.FormattedValue";
const ODATA_LOOKUPLOGICALNAME = "@Microsoft.Dynamics.CRM.lookuplogicalname";

initializeIcons();

export const GridStyles: Partial<IDetailsListStyles> = {
  root: {
    selectors: {
      '& [role=grid]': {
        fontSize: 12,
      },
      '& [role=rowheader]': {
        fontSize: 12,
      },
      '& [role=button] > span': {
        fontSize: 12,
      },
    },
  },
};

export class FluentUIDetailsList extends React.Component<IDetailsListDocumentsProps, IDetailsListDocumentsState> {
  private _selection: Selection;
  private _allItems: { [key: string]: IDetailsListItem | string }[];
  private _columns: IColumn[];

  constructor(props: IDetailsListDocumentsProps) {
    super(props);

    this._allItems = [];
    this._columns = [];
    this._selection = new Selection({
      onSelectionChanged: () => {
        const selectionKeys : string[] = this._getSelectionKeys();
        const selectionDetails : string = selectionKeys.join(',');
        this.props.getSelectedItemIDsCallback(selectionKeys);
        this.setState({
          selectionDetails: selectionDetails,
        });
      },
    });

    this.state = {
      config: XrmHelper.getConfig(),
      items: this._allItems,
      columns: this._columns,
      selectionDetails: this._getSelectionKeys().join(','),
      searchValue: '',
    };

    XrmHelper.onReady(() => {
      this.setState({
        config: XrmHelper.getConfig(),
      });

      this.refreshColumns();
      this.refreshContent();
    });
  }

  private cmdGetSelectedCount() {
    return this._getSelectionKeys().length;
  }

  private cmdOpen() {
    const selectionKeys = this._getSelectionKeys();
    if(selectionKeys.length > 0) {
      const entityName = this.state.config.entityName;
      if(entityName) {
        const entityId = selectionKeys[0];
        XrmHelper.openForm(entityName, entityId);
      }
    }
  }

  private cmdOpenInNewWindow() {
    const selectionKeys = this._getSelectionKeys();
    if(selectionKeys.length > 0) {
      const entityName = this.state.config.entityName;
      if(entityName) {
        for(let i = 0; i < selectionKeys.length; i++) {
          const entityId = selectionKeys[i];
          XrmHelper.openForm(entityName, entityId, true);
        }
      }
    } else {
      alert('Элементы таблицы не выбраны');
    }
  }

  private cmdRefreshContent() {
    this.refreshContent();
  }

  public render() {
    const { columns, items } = this.state;

    return (
      <div>
        <FluentUIContextualMenu getSelectedCount={this.cmdGetSelectedCount.bind(this)} onOpen={this.cmdOpen.bind(this)} onOpenInNewWindow={this.cmdOpenInNewWindow.bind(this)} onRefreshGrid={this.cmdRefreshContent.bind(this)} />
        <FluentUICommandBar onOpenInNewWindow={this.cmdOpenInNewWindow.bind(this)} onRefreshGrid={this.cmdRefreshContent.bind(this)} />
        {this.state.config.allowSearchBox ? <FluentUISearchBox onSearch={this._onSearch.bind(this)} /> : ''}

        <div style={{ 'height': `${this.getAvailableGridHeight()}px`, 'overflowY' : 'auto' }}>
          { items.length > 0 ? (
            <DetailsList
              items={items}
              compact={true}
              columns={columns}
              selectionMode={SelectionMode.multiple}
              setKey="multiple"
              getKey={this._getKey}
              layoutMode={DetailsListLayoutMode.justified}
              constrainMode={ConstrainMode.unconstrained}
              isHeaderVisible={true}
              selection={this._selection}
              selectionPreservedOnEmptyClick={true}
              styles={GridStyles}
              onItemInvoked={this._onItemInvoked}
              enterModalSelectionOnTouch={true}
              ariaLabelForSelectionColumn="Toggle selection"
              ariaLabelForSelectAllCheckbox="Toggle selection for all items"
              checkButtonAriaLabel="select row"
            />
          ) : (
            <div style={{ 'textAlign' : 'center', 'padding' : '15px' }}>
              <img src={noDataImg} />
              <p>Записи не найдены для этой сущности.</p>
            </div>
          ) }
        </div>
      </div>
    );
  }

  private getAvailableGridHeight() : number {
    const body = document.body;
    const html = document.documentElement;
    const heightOfOtherControls = this.state.config.allowSearchBox ? 80 : 40; // CommandBar & SearchBox
    return Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight ) - heightOfOtherControls;
  }

  private refreshColumns() {
    const margin = 44; // gridCell { margin-left: 12px, margin-right: 32px }
    const columns = this.state.config.columns;

    this._columns = columns
      .filter((entityColumn: IEntityColumn) => entityColumn.isHidden !== true)
      .map((entityColumn: IEntityColumn) => {
        return {
            key: entityColumn.name,
            name: entityColumn.displayName,
            fieldName: entityColumn.fieldName,
            minWidth: Math.abs(entityColumn.width - margin),
            maxWidth: Math.abs(entityColumn.width - margin),
            isRowHeader: true,
            isResizable: true,
            isSorted: entityColumn.isSorted,
            isSortedDescending: entityColumn.isSortedDescending,
            sortAscendingAriaLabel: 'Sorted A to Z',
            sortDescendingAriaLabel: 'Sorted Z to A',
            data: 'string',
            isPadded: true,
            onColumnClick: this._onColumnClick,
            onRender: (item, index, column) => (
              <TooltipHost id={column?.name + '_tooltip'} content={item[column?.fieldName || '']?.text} overflowMode={TooltipOverflowMode.Parent}>
                <span aria-describedby={column?.name + '_tooltip'}>
                <div>
                  {
                    entityColumn.hasLink
                      ? <Link key={item} onClick={() => { const linkItem = item[column?.fieldName ?? '']; XrmHelper.openForm(linkItem.entityName, linkItem.value); } }>{item[column?.fieldName || '']?.text}</Link>
                      : item[column?.fieldName || '']?.text
                  }
                </div>
                </span>
              </TooltipHost>
            ),
          } as IColumn;
      });

    this.setState({
      columns: this._columns
    });
  }

  private refreshContent() {
    XrmHelper.getDataByFetchXml((data: any) => {
      this._allItems = [];
      this.setState({
        items: this._allItems
      });

      if(data === undefined)
        return;

      const columns = this.state.config.columns;

      data.entities.forEach((data : any) => {
        const entityId = data[columns.find((entityColumn) => entityColumn.isPrimary === true)?.fieldName ?? ''];

        const item : { [key: string]: IDetailsListItem | string } = {
          key: entityId
        };

        this._columns.forEach((column : IColumn) => {
          const metaColumn = columns.find((entityColumn) => entityColumn.fieldName === column.fieldName);
          if(!metaColumn) { throw new Error('meta column not found'); }

          const fieldName = column.fieldName ?? column.name;
          const fieldText = data[column.fieldName + ODATA_FORMATTED_POSTFIX] ?? data[fieldName];
          let fieldValue = fieldText;
          let entityName;

          if(metaColumn.hasLink) {
            fieldValue = (metaColumn.isLookup === true) ? data[metaColumn.fieldName] : entityId;
            entityName = (metaColumn.isLookup === true) ? data[column.fieldName + ODATA_LOOKUPLOGICALNAME] : this.state.config.entityName;
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
    const entityName = this.state.config.entityName;
    if(entityName) {
      XrmHelper.openForm(entityName, item.key);
    }
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
    this._columns = this._columns.slice();
    const currColumn: IColumn = this._columns.filter(currCol => column.key === currCol.key)[0];
    this._columns.forEach((newCol: IColumn) => {
      if (newCol === currColumn) {
        currColumn.isSortedDescending = !currColumn.isSortedDescending;
        currColumn.isSorted = true;
      } else {
        newCol.isSorted = false;
        newCol.isSortedDescending = true;
      }
    });

    this._allItems = _copyAndSort(this._allItems, currColumn.fieldName || currColumn.name, currColumn.isSortedDescending);
    this.setState({
      columns: this._columns,
      items: this._allItems,
    });
  };
}

function _copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
  const key = columnKey as keyof T;
  return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
}
