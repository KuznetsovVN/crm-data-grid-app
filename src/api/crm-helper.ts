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
  xrm: any,
  entityViewGuid: string,
  customFilterConditions?: string[],
}

const win : { [key: string] : any } = (window as { [key: string]: any });

win['InitXrmAPI'] = (xrmAPI: IXrmAPI) => {
  XrmHelper.init(xrmAPI);
};

let _selectedItemIDs : string[] = [];
win['GetSelectedItemIDs'] = () => {
  return _selectedItemIDs;
};

win['_getSelectedItemKeysCallback'] = (ids : string[]) => {
  _selectedItemIDs = ids;
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

  /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
  * private _getEntityDefinitions: (entityNames: string[], attrNames: string[]) : Promise<any>;
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  const _getMultipleEntityDefinitions = (entityNames: string[], attrNames: string[]) : Promise<any> => {
    const arr : Promise<any>[] = [];

    entityNames.forEach((entityName : string) => {
      arr.push(_getEntityDefinitions(entityName, attrNames));
    });

    return Promise.all(arr).then((result:any[]) => {
      const res : any[] = [];
      result.forEach((items) => {
        res.push(...items);
      });
      return res;
    });
  };

  /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
  * private _getEntityDefinitions: (entityName: string, attrNames: string[]) : Promise<any>;
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  const _getEntityDefinitions = (entityName: string, attrNames: string[]) : Promise<any> => {
    const pageUrl = _xrmAPI.xrm.Page.context.getClientUrl();
    const propertyValues = attrNames.map((val) => `'${val}'`).join(',');
    const request = pageUrl + '/api/data/v9.0/EntityDefinitions(LogicalName=\'' + entityName + '\')/Attributes?$filter=Microsoft.Dynamics.CRM.In(PropertyName=\'logicalname\',PropertyValues=[' + propertyValues + '])';
    return fetch(request, { headers: { 'Accept': 'application/json' }})
      .then(response => response.json())
      .then(function(data) {
        const result:any[] = [];
        data.value.forEach((val:any) => {
          result.push({
            name: val.LogicalName,
            isLookup: val['@odata.type'] === "#Microsoft.Dynamics.CRM.LookupAttributeMetadata",
            displayName: val.DisplayName.LocalizedLabels[0].Label,
          });
        });
        return result;
      });
  };

  /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
  * private _findRelatedLinkEntityAttributeName: (fetchXml : Document, alias : string) : (string | null);
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  const _findRelatedLinkEntityAttributeName = (fetchXml : Document, alias : string) : (string | null) => {
    const entityElem = fetchXml.getElementsByTagName('fetch')[0].getElementsByTagName('entity')[0];
    const linkEntities = entityElem.getElementsByTagName(`link-entity`);
    let linkTo : (string | null) = null;
    for(let i = 0; i < linkEntities.length; i++) {
      if(linkEntities[i].getAttribute('alias') === alias) {
        linkTo = linkEntities[i].getAttribute('to');
      }
    }
    return linkTo;
  };

  return {

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public init: (xrmAPI: IXrmAPI) => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    init: (xrmAPI: IXrmAPI) => {
      _xrmAPI = xrmAPI;
      _entityViewGuid = _xrmAPI.entityViewGuid;

      _xrmAPI.xrm.WebApi.retrieveRecord('savedquery', _xrmAPI.entityViewGuid, '$select=name,fetchxml,layoutjson,returnedtypecode')
        .then(function(record: any) {

          _columns = [];
          _entityName = record.returnedtypecode;
          _viewName = record.name;

          const layout = JSON.parse(record.layoutjson);
          _entityObject = layout.Object;
          const primary = layout.Rows[0].Id;

          const defEntityNames = [ _entityName ];
          layout.Rows[0].Cells.forEach((cell:any) => {
            if(cell.Name.split('.').length > 1) {
              defEntityNames.push(cell.RelatedEntityName);
            }
          });
          const defNames = layout.Rows[0].Cells.map((cell:any) => cell.Name.split('.').at(-1));

          _getMultipleEntityDefinitions(defEntityNames, defNames).then((entityDefinitions:any[]) => {

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
              const name = cells[i].Name.split('.').at(-1);
              let fieldName = cells[i].Name;
              const entityDefinition = entityDefinitions.find((def) => { return def.name === name; });
              const isLookup = entityDefinition?.isLookup ?? false;
              fieldName = isLookup ? `_${fieldName}_value` : fieldName;
              let displayName = entityDefinition?.displayName ?? name;

              const isLinkEntity = fieldName.split('.').length > 1;
              if(isLinkEntity) {
                const fetch : Document = (new DOMParser()).parseFromString(record.fetchxml, 'text/xml');
                const alias = cells[i].Name.split('.')[0];
                const relatedAttribute = _findRelatedLinkEntityAttributeName(fetch, alias);
                const relatedDisplayName = entityDefinitions.find((def) => { return def.name === relatedAttribute; })?.displayName;
                const relatedEntityName = cells[i].RelatedEntityName;
                displayName = displayName + ` ( ${relatedDisplayName ?? relatedEntityName} )`;
              }

              const column : IEntityColumn = {
                name: name,
                fieldName: fieldName,
                displayName: displayName,
                width: cells[i].Width,
                isLookup: isLookup,
                hasLink: i === 0 || isLookup,
              };

              _columns.push(column);
            }

            _xrmAPI.xrm.Utility.getEntityMetadata(_entityName, [])
              .then(function(metadata:any) {
                _entitySetName = metadata.EntitySetName;
                _entityDisplayName = metadata.DisplayName;
                _entityDisplayCollectionName = metadata.DisplayCollectionName;

                // It need call after initialization metadata
                onReadyCallbacks.forEach((callback) => {
                  callback(_xrmAPI);
                });
              });
          });
      });
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public onReady : (callback: () => void) => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    onReady : (callback: () => void) => {
      onReadyCallbacks.push(callback);
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public getEntityMeta : () : (IEntityMeta | undefined) => IEntityMeta;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    getEntityMeta : () : (IEntityMeta | undefined) => {
      if(!(_xrmAPI && _xrmAPI.xrm))
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

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public openQuickCreate : (entityName: string) => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    openQuickCreate : (entityName: string) => {
      if(!(_xrmAPI && _xrmAPI.xrm))
        return undefined;

      _xrmAPI.xrm.Utility.openQuickCreate(entityName);
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public openSubGrid : () => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    openSubGrid : () => {
      if(!(_xrmAPI && _xrmAPI.xrm))
        return undefined;

      const query = `?etc=${_entityObject}&pagetype=ENTITYLIST&viewid=%7b${_entityViewGuid}%7d`;
      _xrmAPI.xrm.Navigation.openUrl("/main.aspx" + query);
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public getData: (query : string, callback: any) => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    getData: (query : string, callback: any) => {
      if(!(_xrmAPI && _xrmAPI.xrm)) {
        callback(undefined);
        return;
      }

      _xrmAPI.xrm.WebApi.retrieveMultipleRecords(_entityName, query).then(callback);
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public getDataByFetchXml: (callback: any) => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    getDataByFetchXml: (callback: any) => {
      if(!(_xrmAPI && _xrmAPI.xrm)) {
        callback(undefined);
        return;
      }

      _xrmAPI.xrm.WebApi.retrieveRecord("savedquery", _entityViewGuid, "$select=fetchxml").then(function(data:any) {

        let fetchxml = data.fetchxml;

        if(_xrmAPI.customFilterConditions && _xrmAPI.customFilterConditions.length > 0) {
          const fetch : Document = (new DOMParser()).parseFromString(fetchxml, 'text/xml');
          const entityElem = fetch.getElementsByTagName('fetch')[0].getElementsByTagName('entity')[0];
          let filterElem = entityElem.getElementsByTagName('filter')[0];

          if(!filterElem) {
            const doc : Document = (new DOMParser()).parseFromString('<filter type="and" />', 'text/xml');
            const filter = doc.getElementsByTagName('filter')[0];
            if(filter) {
              entityElem.appendChild(filter);
            }
            filterElem = entityElem.getElementsByTagName('filter')[0];
          }

          _xrmAPI.customFilterConditions?.forEach((condition) => {
            const doc : Document = (new DOMParser()).parseFromString(condition, 'text/xml');
            const conditionElem = doc.getElementsByTagName('condition')[0];
            if(condition) {
              filterElem.appendChild(conditionElem);
            }
          });
          fetchxml = (new XMLSerializer()).serializeToString(fetch);
        }
        _xrmAPI.xrm.WebApi.retrieveMultipleRecords(_entityName, "?fetchXml=" + encodeURIComponent(fetchxml)).then(function(result:any) {
          callback(result);
        });
      });
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public openForm: (entityName : string, entityId : string) => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    openForm: (entityName : string, entityId : string) => {
      if(!(_xrmAPI && _xrmAPI.xrm))
        return undefined;

      return _xrmAPI.xrm.Navigation.openForm({
        entityName: entityName,
        entityId: entityId
      });
    }
  };
})();
