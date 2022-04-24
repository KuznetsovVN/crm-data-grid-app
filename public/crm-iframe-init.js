function onload () {
  const iFrameElem = Xrm.Page.getControl("IFRAME_kuzn_crm_datagrid_html");
  iFrameElem.setSrc("https://srv-democrm90.gmcs.ru/LearnKuznetsov/WebResources/kuzn_crm-datagrid-html");
  iFrameElem.getObject().onload = function() {
    var iFrameWindow = iFrameElem.getObject().contentWindow;

    const ENTITY_VIEW_GUID = "00000000-0000-0000-00AA-000010001004";

    if(iFrameWindow.InitXrmAPI !== null) {
      iFrameWindow.InitXrmAPI({
        xrm: Xrm,
        entityViewGuid: ENTITY_VIEW_GUID,
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
