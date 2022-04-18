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

const XRM_NAME = 'XRM';
const XRM_INIT_HANDLER = 'XRM_InitHandler';
const win : { [key: string] : any } = (window as { [key: string]: any });

win['InitCRM'] = (xrm: IXRM) => {
  // const win = (window as { [key: string]: any });
  win[XRM_NAME] = xrm;
  if(win[XRM_INIT_HANDLER] !== undefined) {
      win[XRM_INIT_HANDLER](xrm);
  }
};

function getCRMAPI() {
  return (window as { [key: string]: any })[XRM_NAME] as IXRM;
}

export const CRMAPI = {
  onReady : (callback: (xrm? : IXRM) => void) => {
    win[XRM_INIT_HANDLER] = callback;
  },
  getEntityMeta : () : (IEntityMeta | undefined) => {
    const api = getCRMAPI();
    return (api !== undefined) ? api.entityMeta : undefined;
  },
  openQuickCreate : (a: any) => {
    const api = getCRMAPI();
    if(api !== undefined && api.openQuickCreate !== undefined) {
      api.openQuickCreate(a);
    }
  },
  openSubGrid : (a: any) => {
    const api = getCRMAPI();
    if(api !== undefined && api.openSubGrid !== undefined) {
      api.openSubGrid(a);
    }
  },
  getAllRecords: (query : string, callback: any) => {
    const api = getCRMAPI();
    if(api !== undefined && api.getAllRecords !== undefined) {
      api.getAllRecords(query, callback);
    }
  }
};
