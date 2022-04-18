export interface IEntityColumn {
  primarykey: boolean,
  name: string,
  displayName: string,
  type: string
}

export interface IEntityMeta {
  name: string,
  displayName: string,
  entityColumns: IEntityColumn[]
}

export interface IXRM {
  entityMeta: IEntityMeta,
  openQuickCreate?: (a: any) => void;
  openSubGrid?: (a: any) => void;
  getAllRecords?: (query : string, callback: any) => void;
}

const win : { [key: string] : any } = (window as { [key: string]: any });
const onReadyCallbacks : { (xrm: IXRM): void; } [] = [];
let _xrm: IXRM;

win['InitCRMAPI'] = (xrm: IXRM) => {
  _xrm = xrm;
  onReadyCallbacks.forEach((callback) => {
    callback(xrm);
  });
};

export const CRMAPI = {
  onReady : (callback: (xrm? : IXRM) => void) => {
    onReadyCallbacks.push(callback);
  },
  getEntityMeta : () : (IEntityMeta | undefined) => {
    return (_xrm !== undefined) ? _xrm.entityMeta : undefined;
  },
  openQuickCreate : (a: any) => {
    if(_xrm !== undefined && _xrm.openQuickCreate !== undefined) {
      _xrm.openQuickCreate(a);
    }
  },
  openSubGrid : (a: any) => {
    if(_xrm !== undefined && _xrm.openSubGrid !== undefined) {
      _xrm.openSubGrid(a);
    }
  },
  getAllRecords: (query : string, callback: any) => {
    if(_xrm !== undefined && _xrm.getAllRecords !== undefined) {
      _xrm.getAllRecords(query, callback);
    }
  }
};
