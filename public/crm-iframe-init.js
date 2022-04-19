function onload () {
  Xrm.Page.getControl("IFRAME_kuzn_crm_datagrid_html").setSrc("https://srv-democrm90.gmcs.ru/LearnKuznetsov/WebResources/kuzn_crm-datagrid-html");

  Xrm.Page.ui.controls.get('IFRAME_kuzn_crm_datagrid_html').getObject().onload = function() {
    var iFrameWindow = Xrm.Page.ui.controls.get('IFRAME_kuzn_crm_datagrid_html').getObject().contentWindow;

    const entityMeta = {
      name: 'contact',
      displayName: 'Контакт',
      entityColumns: [
        { name : 'contactid', displayName : 'ID', type: 'string', primarykey: true },
        { name : 'fullname', displayName : 'Полное имя', type: 'string' },
        { name : 'emailaddress1', displayName : 'Электронная почта', type: 'string' },
        { name : 'parentcustomerid', displayName : 'Электронная почта', type: 'string', isLookup: true },
        { name : 'telephone1', displayName : 'Рабочий телефон', type: 'string' },
      ]
    };

    if(iFrameWindow.InitCRMAPI !== null) {
      iFrameWindow.InitCRMAPI({
        entityMeta: entityMeta,
        openQuickCreate: function() {
          Xrm.Utility.openQuickCreate(entityMeta.name).then(function() { /* TODO */ });
        },
        openSubGrid: function() {
          // Xrm.Navigation.navigateTo({ pageType: 'entitylist', entityName: 'contact' }); // - doesn't work
          const query = "?etc=2&pagetype=ENTITYLIST&viewid=%7b00000000-0000-0000-00AA-000010001004%7d&viewtype=1039#68839060";
          Xrm.Navigation.openUrl("/main.aspx" + query);
        },
        getAllRecords: function(query, callback) {
          Xrm.WebApi.retrieveMultipleRecords(entityMeta.name, query).then(callback);
        }
      });
    }
  };
}
