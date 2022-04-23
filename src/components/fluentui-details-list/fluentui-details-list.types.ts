import { IColumn } from '@fluentui/react/lib/DetailsList';

export interface IDetailsListDocumentsProps {
  getSelectedItemIdsCallback: (ids : string[]) => string[];
}

export interface IDetailsListDocumentsState {
  columns: IColumn[];
  items: { [key: string]: any }[];
  selectionDetails: string;
  searchValue: string;
  isModalSelection: boolean;
  isCompactMode: boolean;
  announcedMessage?: string;
}

export interface IDetailsListItem {
  text: string;
  value: string;
  entityName: string;
}
