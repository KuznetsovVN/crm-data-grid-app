function onload () {
  const iFrameElem = Xrm.Page.getControl("IFRAME_kuzn_crm_datagrid_html");
  iFrameElem.setSrc("https://srv-democrm90.gmcs.ru/LearnKuznetsov/WebResources/kuzn_crm-datagrid-html");
  iFrameElem.getObject().onload = function() {
    var iFrameWindow = iFrameElem.getObject().contentWindow;

    const ENTITY_VIEW_GUID = "00000000-0000-0000-00AA-000010001004";
    const LOOKUP_FIELDS = ['parentcustomerid'];
    const DISPLAY_NAME_DICT = { contactid: 'Контакт', fullname: 'Полное имя', emailaddress1: 'Электронная почта', parentcustomerid: 'Электронная почта', telephone1 : 'Рабочий телефон' };

    if(iFrameWindow.InitXrmAPI !== null) {
      iFrameWindow.InitXrmAPI({
        entityViewGuid: ENTITY_VIEW_GUID,
        lookupFields: LOOKUP_FIELDS,
        displayNameDict: DISPLAY_NAME_DICT,
        retrieveRecord: Xrm.WebApi.retrieveRecord,
        retrieveMultipleRecords: Xrm.WebApi.retrieveMultipleRecords,
        openQuickCreate: Xrm.Utility.openQuickCreate,
        openSubGrid: Xrm.Navigation.openUrl
      });
    }
  };
}
