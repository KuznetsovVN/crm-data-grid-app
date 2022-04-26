function onload () {
  const iFrameElem = Xrm.Page.getControl("IFRAME_kuzn_crm_datagrid_html");
  iFrameElem.setSrc("https://srv-democrm90.gmcs.ru/LearnKuznetsov/WebResources/kuzn_crm-datagrid-html");
  iFrameElem.getObject().onload = function() {
    var iFrameWindow = iFrameElem.getObject().contentWindow;

    const ENTITY_VIEW_GUID = "00000000-0000-0000-00AA-000010001004";

    if(iFrameWindow.InitXrmAPI !== null) {
      iFrameWindow.InitXrmAPI({

        /* [REQUIRED] Type: Xrm Namespace */
        xrm: Xrm,

        /* Type: string | undefined | 'Контакты' */
        title: undefined,

        /* Type: string | undefined */
        fetchXml: undefined,

        /* Type: string | undefined | '00000000-0000-0000-00AA-000010001004' */
        entityViewGuid: undefined,

        /* Type: array | undefined | [ '<condition attribute="new_opportunityid" operator="eq" value="{58695D1F-2ABB-EC11-ACE6-005056A670CA}" />' ] */
        customFilterConditions : [],

      });
    }
  };
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
* 
* GetSelectedItemIDs() : string[] - returns a list of grid item IDs
* 
* Example:
*   Xrm.Page.getControl("IFRAME_kuzn_crm_datagrid_html").getObject().contentWindow.GetSelectedItemIDs()
* 
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
