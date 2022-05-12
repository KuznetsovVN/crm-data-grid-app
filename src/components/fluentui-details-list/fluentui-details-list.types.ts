import { IColumn } from '@fluentui/react/lib/DetailsList';
import { IConfig } from '../../api/crm-helper';

export interface IDetailsListDocumentsProps {
  getSelectedItemIDsCallback: (ids : string[]) => string[];
}

export interface IDetailsListDocumentsState {
  config: IConfig,
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
