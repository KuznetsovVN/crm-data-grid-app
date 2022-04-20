export interface IEntityColumn {
  name: string,
  relatedEntityName: string,
  displayName: string,
  width: number;
  primarykey: boolean,
  isLookup: boolean
}

export interface IEntityMeta {
  name: string,
  object: number,
  displayName: string,
  viewName: string,
  columns: IEntityColumn[]
}

export interface IXrmAPI {
  entityViewGuid: string,
  lookupFields: string[],
  displayNameDict: { [key: string]: string },
  retrieveRecord: (entityLogicalName: string, id: string, options: string) => Promise<any>;
  retrieveMultipleRecords: (entityName : string, query : string) => Promise<any>;
  openQuickCreate: (entityName: string) => any;
  openSubGrid: (query: string) => void; // "/main.aspx" + query
}

const win : { [key: string] : any } = (window as { [key: string]: any });

win['InitXrmAPI'] = (xrmAPI: IXrmAPI) => {
  XrmHelper.init(xrmAPI);
};

export const XrmHelper = (function() {
  let _xrmAPI: IXrmAPI;
  const onReadyCallbacks : { (xrm: IXrmAPI): void; } [] = [];

  let _viewName: string;
  let _entityName: string;
  let _entityViewGuid: string;
  let _entityDisplayName: string;
  let _entityObject: number;
  let _columns: IEntityColumn[];

  // returnedtypecode@OData.Community.Display.V1.FormattedValue

  return {
    init: (xrmAPI: IXrmAPI) => {
      _xrmAPI = xrmAPI;
      _entityViewGuid = _xrmAPI.entityViewGuid;

      _xrmAPI.retrieveRecord('savedquery', _xrmAPI.entityViewGuid, '$select=name,fetchxml,layoutjson,returnedtypecode')
        .then(function(data: any) {
          _viewName = data.name;
          _entityName = data.returnedtypecode;
          _entityDisplayName = data['returnedtypecode@OData.Community.Display.V1.FormattedValue'];
          _columns = [];

          // const fetch : Document = (new DOMParser()).parseFromString(data.fetchxml, 'text/xml');
          // const entityElem = fetch.getElementsByTagName("fetch")[0].getElementsByTagName("entity")[0];

          const layout = JSON.parse(data.layoutjson);
          _entityObject = layout.Object;
          const primary = layout.Rows[0].Id;

          const cells = layout.Rows[0].Cells;
          for (let i = 0; i < cells.length; i++) {
            const name = cells[i].Name;
            if(name.split('.').length > 1) {
              continue; // TODO: link-entity
            }

            const column = {
              name: name,
              relatedEntityName: cells[i].RelatedEntityName,
              displayName: _xrmAPI.displayNameDict[name] || name,
              width: cells[i].Width,
              primarykey: name === primary,
              isLookup: _xrmAPI.lookupFields.indexOf(name) !== -1
            };

            _columns.push(column);
          }

          // It need call after initialization metadata
          onReadyCallbacks.forEach((callback) => {
            callback(_xrmAPI);
          });
      });
    },
    onReady : (callback: () => void) => {
      onReadyCallbacks.push(callback);
    },
    getEntityMeta : () : (IEntityMeta | undefined) => {
      if(_xrmAPI === undefined)
        return undefined;

      return {
        name: _entityName,
        object: _entityObject,
        displayName: _entityDisplayName,
        viewName: _viewName,
        columns: _columns
      };
    },
    openQuickCreate : (entityName: string) => {
      if(_xrmAPI === undefined)
        return;

      _xrmAPI.openQuickCreate(entityName);
    },
    openSubGrid : () => {
      if(_xrmAPI === undefined)
        return;

      const query = `?etc=${_entityObject}&pagetype=ENTITYLIST&viewid=%7b${_entityViewGuid}%7d`;
      _xrmAPI.openSubGrid("/main.aspx" + query);
    },
    getData: (query : string, callback: any) => {
      if(_xrmAPI === undefined) {
        callback(undefined);
        return;
      }

      _xrmAPI.retrieveMultipleRecords(_entityName, query).then(callback);
    }
  };
})();
