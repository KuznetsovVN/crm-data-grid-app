import { DetailsListLayoutMode, IColumn } from '@fluentui/react/lib/DetailsList';

export interface IDetailsListDocumentsProps {
  getSelectedItemIDsCallback: (ids : string[]) => string[];
}

export interface IDetailsListDocumentsState {
  columns: IColumn[];
  items: { [key: string]: any }[];
  selectionDetails: string;
  searchValue: string;
}

export interface IDetailsListItem {
  text: string;
  value: string;
  entityName: string;
}
