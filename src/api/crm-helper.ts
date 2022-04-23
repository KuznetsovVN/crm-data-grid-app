export interface IEntityColumn {
  name: string,
  fieldName: string,
  displayName: string,
  width: number;
  isPrimary?: boolean,
  isLookup?: boolean,
  isHidden?: boolean,
  hasLink?: boolean,
}

export interface IEntityMeta {
  name: string,
  setName: string,
  object: number,
  displayName: string,
  displayCollectionName: string,
  viewName: string,
  columns: IEntityColumn[]
}

export interface IXrmAPI {
  entityViewGuid: string,
  lookupFields: string[],
  displayNameDict: { [key: string]: string },
  getEntityMetadata: (entityName : string, atributes : string[]) => Promise<any>;
  retrieveRecord: (entityLogicalName: string, id: string, options: string) => Promise<any>;
  retrieveMultipleRecords: (entityName : string, query : string) => Promise<any>;
  openQuickCreate: (entityName: string) => any;
  openSubGrid: (query: string) => void; // "/main.aspx" + query
  openForm: (options: { entityName : string, entityId : string}) => Promise<any>;
}

const win : { [key: string] : any } = (window as { [key: string]: any });

win['InitXrmAPI'] = (xrmAPI: IXrmAPI) => {
  XrmHelper.init(xrmAPI);
};

win['GetSelectedItemIDs'] = () => {
  return win['_selectedItemIds'];
};

win['_selectedItemIds'] = [];

win['_getSelectedItemKeysCallback'] = (ids : string[]) => {
  win['_selectedItemIds'] = ids;
};


export const XrmHelper = (function() {
  let _xrmAPI: IXrmAPI;
  const onReadyCallbacks : { (xrm: IXrmAPI): void; } [] = [];

  let _viewName: string;
  let _entityName: string;
  let _entitySetName: string;
  let _entityViewGuid: string;
  let _entityDisplayName: string;
  let _entityDisplayCollectionName: string;
  let _entityObject: number;
  let _columns: IEntityColumn[];

  // returnedtypecode@OData.Community.Display.V1.FormattedValue

  return {
    init: (xrmAPI: IXrmAPI) => {
      _xrmAPI = xrmAPI;
      _entityViewGuid = _xrmAPI.entityViewGuid;

      _xrmAPI.retrieveRecord('savedquery', _xrmAPI.entityViewGuid, '$select=name,fetchxml,layoutjson,returnedtypecode')
        .then(function(record: any) {

          _entityName = record.returnedtypecode;
          _viewName = record.name;

          _columns = [];

          const layout = JSON.parse(record.layoutjson);
          _entityObject = layout.Object;
          const primary = layout.Rows[0].Id;

          /* add hidden primary entity field */
          _columns.push({
            name: primary,
            fieldName: primary,
            displayName: primary,
            width: 0,
            isPrimary: true,
            isHidden: true,
          });

          const cells = layout.Rows[0].Cells;
          for (let i = 0; i < cells.length; i++) {
            let name = cells[i].Name;
            let displayName = (_xrmAPI.displayNameDict[name] || name);
            const isLookup = _xrmAPI.lookupFields.indexOf(name) !== -1;
            const isLinkEntity = name.split('.').length > 1;
            const fieldName = isLookup ? `_${name}_value` : name;
            const hasLink = i === 0 || isLookup;

            if(isLinkEntity) {
              name = name.split('.').at(-1);
              displayName = (_xrmAPI.displayNameDict[name] || name);
              const relatedEntityName = cells[i].RelatedEntityName;
              if(relatedEntityName) {
                displayName += ` ( ${_xrmAPI.displayNameDict[relatedEntityName]} )`;
              }
            }

            const column : IEntityColumn = {
              name: name,
              fieldName: fieldName,
              displayName: displayName,
              width: cells[i].Width,
              isLookup: isLookup,
              hasLink: hasLink,
            };

            _columns.push(column);
          }

          _xrmAPI.getEntityMetadata(_entityName, [])
            .then(function(metadata) {
              _entitySetName = metadata.EntitySetName;
              _entityDisplayName = metadata.DisplayName;
              _entityDisplayCollectionName = metadata.DisplayCollectionName;

              // It need call after initialization metadata
              onReadyCallbacks.forEach((callback) => {
                callback(_xrmAPI);
              });
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
        setName: _entitySetName,
        object: _entityObject,
        displayName: _entityDisplayName,
        displayCollectionName: _entityDisplayCollectionName,
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
    },
    getDataByFetchXml: (callback: any) => {
      if(_xrmAPI === undefined) {
        callback(undefined);
        return;
      }

      _xrmAPI.retrieveRecord("savedquery", _entityViewGuid, "$select=fetchxml").then(function(data) {
        _xrmAPI.retrieveMultipleRecords(_entityName, "?fetchXml=" + encodeURIComponent(data.fetchxml)).then(function(result) {
          callback(result);
        });
      });
    },
    openForm: (entityName : string, entityId : string) => {
      return _xrmAPI.openForm({
        entityName: entityName,
        entityId: entityId
      });
    }
  };
})();
