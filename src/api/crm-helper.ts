export interface IEntityColumn {
  name: string,
  fieldName: string,
  displayName: string,
  width: number;
  isPrimary?: boolean,
  isPrimaryName?: boolean,
  isLookup?: boolean,
  isHidden?: boolean,
  hasLink?: boolean,
  isSorted: boolean,
  isSortedDescending: boolean,
}

export interface IEntityMeta {
  name: string,
  object?: number | null,
  displayName: string,
  displayCollectionName: string,
  columns: IEntityColumn[]
}

export interface IXrmAPI {
  xrm: any,
  title?: string,
  allowSearchBox?: boolean,
  allowAddButton?: boolean,
  allowOpenAssociatedRecordsButton?: boolean,
  allowRefreshGridViewButton?: boolean,
  allowOpenInNewWindowButton?: boolean,
  fetchXml?: string;
  layoutJson?: string;
  entityViewGuid?: string,
  customFilterConditions?: string[],
  commandBarItems?: any
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

  let _fetchXml: string;
  let _layoutJson: string | object | undefined;
  let _entityName: string;
  let _entityViewGuid: string | undefined;
  let _entityObject: number | undefined;
  let _entityDisplayName: string;
  let _entityDisplayCollectionName: string;
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
            isPrimary: val.IsPrimaryId,
            isPrimaryName: val.IsPrimaryName,
            isLookup: val['@odata.type'] === "#Microsoft.Dynamics.CRM.LookupAttributeMetadata",
            displayName: val.DisplayName.LocalizedLabels[0].Label,
          });
        });
        return result;
      });
  };

  /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
  * private findOrCreateXmlElement: (parent : Element, name : string, etalon : string) => Element;
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  const _findOrCreateXmlElement = (parent : Element, name : string, etalon : string) : Element => {
    let element = parent.getElementsByTagName(name)[0];
    if(!element) {
      const _doc : Document = (new DOMParser()).parseFromString(etalon, 'text/xml');
      const filter = _doc.getElementsByTagName(name)[0];
      if(filter) {
        parent.appendChild(filter);
      }
      element = parent.getElementsByTagName('filter')[0];
    }
    return element;
  };

  /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
  * private _applyCustomFilterConditions: (fetchXml : string, conditions : string[]) => string;
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  const _applyCustomFilterConditions = (fetchXml : string, conditions : string[]) : string => {
    let result : string = fetchXml;
    if(_xrmAPI.customFilterConditions && _xrmAPI.customFilterConditions.length > 0) {
        const fetch : Document = (new DOMParser()).parseFromString(fetchXml, 'text/xml');
        const entityElem = fetch.getElementsByTagName('fetch')[0].getElementsByTagName('entity')[0];
        const filterElem = _findOrCreateXmlElement(entityElem, 'filter', '<filter type="and" />');

        conditions.forEach((condition) => {
          const doc : Document = (new DOMParser()).parseFromString(condition, 'text/xml');
          const conditionElem = doc.getElementsByTagName('condition')[0];
          if(conditionElem) {
            filterElem.appendChild(conditionElem);
          }
        });
        result = (new XMLSerializer()).serializeToString(fetch);
      }
      return result;
  };

  /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
  * private _init: () => void;
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  const _init = () => {
    if(!_fetchXml) {
      throw new Error('fetchXml is required');
    }

    if(_xrmAPI.customFilterConditions && _xrmAPI.customFilterConditions.length > 0) {
      _fetchXml = _applyCustomFilterConditions(_fetchXml, _xrmAPI.customFilterConditions);
    }

    const fetch : Document = (new DOMParser()).parseFromString(_fetchXml, 'text/xml');
    const layout = typeof _layoutJson === 'string' ? JSON.parse(_layoutJson) : _layoutJson;

    const entityElem = fetch && fetch.getElementsByTagName('fetch')[0]?.getElementsByTagName('entity')[0];
    const entityElemName = entityElem?.getAttribute('name');
    if(!entityElemName) {
      throw new Error('Incoming fetchxml not have entity element or name attribute: ' + _fetchXml);
    }
    const orderElem = entityElem.getElementsByTagName('order')[0];

    _entityName = entityElemName;
    _entityObject = layout ? layout.Object : undefined;
    _columns = [];

    /* columns names */

    const entityNames : string[] = [ _entityName ];
    let fieldNames : string[] = [];
    const linkEntities : any[] = [];

    for (let i = 0; i < entityElem.children.length; i++) {
      const elem = entityElem.children[i];
      if(elem.nodeName === 'attribute') {
        const elemName = elem.getAttribute('name');
        if(elemName) {
          fieldNames.push(elemName);
        }
      } else if(elem.nodeName === 'link-entity') {
        const linkAlias = elem.getAttribute('alias');
        const relatedEntityName = elem.getAttribute('name');
        if(relatedEntityName) { entityNames.push(relatedEntityName); }
        if(linkAlias) {
          const linkFrom = elem.getAttribute('from');
          const linkTo = elem.getAttribute('to');

          const linkAttributes = elem.getElementsByTagName('attribute');
          for(let a = 0; a < linkAttributes.length; a++) {
            const linkName = linkAttributes[a].getAttribute('name');
            if(linkName) {
              fieldNames.push(linkAlias + '.' + linkName);
            }

            linkEntities.push({
              alias: linkAlias,
              name: linkName,
              from: linkFrom,
              to: linkTo,
            });
          }
        }
      }
    }

    /* sort column names is available */

    if(layout && layout.Rows) {
      const order = layout.Rows[0]?.Cells?.map((cell:any) => cell.Name) ?? [];
      fieldNames = fieldNames.sort((a, b) => order.indexOf(a) - order.indexOf(b) );
    }

    /* get entity definitions */

    const columnNames : string[] = fieldNames.map((fieldName) => fieldName.split('.').at(-1) ?? '');

    _getMultipleEntityDefinitions(entityNames, columnNames).then((entityDefinitions:any[]) => {
      for(let i = 0; i < fieldNames.length; i++) {
        const cell = layout && layout.Rows && layout.Rows[0]?.Cells?.find((cell:any) => cell.Name === fieldNames[i]);
        const width = cell ? cell.Width : 100;
        const isHidden = layout ? (cell === undefined ? true : cell.IsHidden) : false;

        let fieldName = fieldNames[i];
        const isLinkEntity = fieldName.split('.').length > 1;

        const alias = isLinkEntity ? fieldName.split('.')[0] : undefined;
        const name = isLinkEntity ? fieldName.split('.')[1] ?? fieldName : fieldName;

        const entityDefinition = entityDefinitions.find((def) => { return def.name === name; });

        const isPrimary = entityDefinition?.isPrimary ?? false;
        const isPrimaryName = entityDefinition?.isPrimaryName ?? false;
        const isLookup = entityDefinition?.isLookup ?? false;
        if(isLookup && !isLinkEntity) {
          fieldName = `_${fieldName}_value`;
        }
        let displayName = entityDefinition?.displayName ?? name;

        if(isLinkEntity) {
          const link = linkEntities.find((link) => link.alias === alias);
          if(link) {
            const relatedDisplayName = entityDefinitions.find((def) => def.name === link.to)?.displayName;
            displayName = displayName + ` ( ${relatedDisplayName ?? link.name} )`;
          } else {
            displayName = fieldName;
          }
        }

        const countOfVisibleColumns = _columns.filter((c) => c.isHidden !== true).length;

        const column : IEntityColumn = {
          name: name,
          isPrimary: isPrimary,
          isPrimaryName: isPrimaryName,
          isHidden: isHidden,
          fieldName: fieldName,
          displayName: displayName,
          width: width,
          isLookup: isLookup,
          hasLink: isPrimaryName || isLookup,
          isSorted: orderElem && orderElem.getAttribute('attribute') === name,
          isSortedDescending: orderElem && orderElem.getAttribute('descending') === 'true',
        };

        _columns.push(column);
      }

      /* undetected props */

      const primaryColumn = _columns.find((column) => column.isPrimary);
      _entityDisplayName = _xrmAPI.title ?? primaryColumn?.displayName ?? primaryColumn?.name ?? '';
      _entityDisplayCollectionName = _entityDisplayName;

      // It need call after initialization metadata
      onReadyCallbacks.forEach((callback) => {
        callback(_xrmAPI);
      });
    });
  };

  return {

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public init: (xrmAPI: IXrmAPI) => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    init: (xrmAPI: IXrmAPI) => {
      _xrmAPI = xrmAPI;

      _entityViewGuid = _xrmAPI.entityViewGuid && _xrmAPI.entityViewGuid;

      if(!_xrmAPI.fetchXml) {
        if(_entityViewGuid) {
          _xrmAPI.xrm.WebApi
            .retrieveRecord('savedquery', _entityViewGuid, '$select=name,fetchxml,layoutjson,returnedtypecode')
            .then(function(record: any) {
              _fetchXml = record.fetchxml;
              _layoutJson = _xrmAPI.layoutJson || record.layoutjson;
              _init();
            });
        }
      } else {
        _fetchXml = _xrmAPI.fetchXml;
        _layoutJson = _xrmAPI.layoutJson;
        _init();
      }
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public onReady : (callback: () => void) => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    onReady : (callback: () => void) => {
      onReadyCallbacks.push(callback);
    },

    getUIConfig: () => {
      return {
        allowSearchBox: _xrmAPI?.allowSearchBox ?? false,
        allowAddButton: _xrmAPI?.allowAddButton ?? false,
        allowOpenAssociatedRecordsButton: _xrmAPI?.allowOpenAssociatedRecordsButton ?? false,
        allowRefreshGridViewButton: _xrmAPI?.allowRefreshGridViewButton ?? false,
        allowOpenInNewWindowButton: _xrmAPI?.allowOpenInNewWindowButton ?? false,
        commandBarItems: _xrmAPI?.commandBarItems ?? []
      };
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public getEntityMeta : () : (IEntityMeta | undefined) => IEntityMeta;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    getEntityMeta : () : (IEntityMeta | undefined) => {
      if(!(_xrmAPI && _xrmAPI.xrm))
        return undefined;

      return {
        name: _entityName,
        object: _entityObject,
        displayName: _entityDisplayName,
        displayCollectionName: _entityDisplayCollectionName,
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

      const query = (_entityObject && _entityViewGuid)
        ? `?etc=${_entityObject}&pagetype=ENTITYLIST&viewid=%7b${_entityViewGuid}%7d`
        : `?pagetype=ENTITYLIST`;
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

      _xrmAPI.xrm.WebApi
        .retrieveMultipleRecords(_entityName, query)
        .then(callback, console.log);
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public getDataByFetchXml: (callback: any) => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    getDataByFetchXml: (callback: any) => {
      if(!(_xrmAPI && _xrmAPI.xrm)) {
        callback(undefined);
        return;
      }

      _xrmAPI.xrm.WebApi
        .retrieveMultipleRecords(_entityName, "?fetchXml=" + encodeURIComponent(_fetchXml))
        .then(callback, console.log);
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * public openForm: (entityName : string, entityId : string) => void;
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    openForm: (entityName : string, entityId : string, inNewWindow?: boolean) => {
      if(!(_xrmAPI && _xrmAPI.xrm))
        return undefined;

        if(inNewWindow) {
          const extraqs = 'id={' + entityId +'}';
          const pageUrl = _xrmAPI.xrm.Page.context.getClientUrl();
          const url = pageUrl + '/main.aspx?etn=' + entityName + '&pagetype=entityrecord&extraqs=' + encodeURIComponent(extraqs);
          window.open(url, '_blank');
        } else {
          return _xrmAPI.xrm.Utility.openEntityForm(entityName, entityId);
        }
    },

  };
})();
