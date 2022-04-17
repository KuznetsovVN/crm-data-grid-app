import { IColumn } from '@fluentui/react/lib/DetailsList';

export interface IDetailsListDocumentsState {
  columns: IColumn[];
  // items: IDocument[];
  items: IContactDocument[];
  selectionDetails: string;
  isModalSelection: boolean;
  isCompactMode: boolean;
  announcedMessage?: string;
}

export interface IDocument {
  key: string;
  name: string;
  value: string;
  iconName: string;
  fileType: string;
  modifiedBy: string;
  dateModified: string;
  dateModifiedValue: number;
  fileSize: string;
  fileSizeRaw: number;
}

export interface IContactDocument {
  contactid: string;
  fullname: string;
  emailaddress1: string;
  telephone1: string;
}
