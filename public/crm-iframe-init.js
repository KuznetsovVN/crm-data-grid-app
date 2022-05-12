function onload () {
  const iFrameElem = Xrm.Page.getControl("IFRAME_kuzn_crm_datagrid_html");
  iFrameElem.setSrc("https://srv-democrm/LearnKuznetsov/WebResources/kuzn_crm-datagrid-html");
  iFrameElem.getObject().onload = function() {
    var iFrameWindow = iFrameElem.getObject().contentWindow;

    if(iFrameWindow.InitXrmAPI !== null) {
      iFrameWindow.InitXrmAPI({

        /* [REQUIRED] Type: Xrm Namespace */
        xrm: Xrm,

        /* Type: string | undefined | 'Контакты' */
        title: undefined,

        /* Type: boolean | undefined | false - default */
        allowSearchBox: undefined,

        /* Type: boolean | undefined | false - default */
        allowAddButton: undefined,

        /* Type: boolean | undefined | false - default */
        allowOpenAssociatedRecordsButton: undefined,

        /* Type: boolean | undefined | false - default */
        allowRefreshGridViewButton: undefined,

        /* Type: boolean | undefined | false - default */
        allowOpenInNewWindowButton: undefined,

        /* Type: string | undefined */
        fetchXml: undefined,

        /* Type: string | object | undefined */
        layoutJson: undefined,

        /* Type: string | undefined | '00000000-0000-0000-00AA-000010001004' | [{ name: 'Мои Контакты', guid: '00000000-0000-0000-00AA-000010001004', active: true }] */
        entityViewGuid: undefined,

        /* Type: array | undefined | [ '<condition attribute="new_opportunityid" operator="eq" value="{58695D1F-2ABB-EC11-ACE6-005056A670CA}" />' ] */
        customFilterConditions : [],

        /* Type: array | undefined | { key: "btn", text: "Caption", iconName: "Edit", disabled: false, clickHandler: () => { console.log("pressed") } } */
        commandBarItems: []
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
