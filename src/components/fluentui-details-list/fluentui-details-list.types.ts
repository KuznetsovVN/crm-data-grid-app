import { IColumn } from '@fluentui/react/lib/DetailsList';

export interface IDetailsListDocumentsState {
  columns: IColumn[];
  items: { [key: string]: any }[];
  selectionDetails: string;
  searchValue: string;
  isModalSelection: boolean;
  isCompactMode: boolean;
  announcedMessage?: string;
}
