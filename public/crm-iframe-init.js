function onload () {
  Xrm.Page.getControl("IFRAME_kuzn_crm_datagrid_html").setSrc("https://srv-democrm90.gmcs.ru/LearnKuznetsov/WebResources/kuzn_crm-datagrid-html");

  Xrm.Page.ui.controls.get('IFRAME_kuzn_crm_datagrid_html').getObject().onload = function() {
    var iFrameWindow = Xrm.Page.ui.controls.get('IFRAME_kuzn_crm_datagrid_html').getObject().contentWindow;

    const entitySet = 'contacts';

    const entityMeta = {
      name: 'contact',
      displayName: 'Контакт',
      entityColumns: [
        { name : 'contactid', displayName : 'ID', type: 'string', primarykey: true, visible: false },
        { name : 'fullname', displayName : 'Полное имя', type: 'string' },
        { name : 'emailaddress1', displayName : 'Электронная почта', type: 'string' },
        { name : 'telephone1', displayName : 'Рабочий телефон', type: 'string' },
      ]
    };

    if(iFrameWindow.InitCRM !== null) {
      iFrameWindow.InitCRM({
        entityMeta: entityMeta,
        openQuickCreate: function() {
          Xrm.Utility.openQuickCreate(entityMeta.name).then(function() { /* TODO */ });
        },
        openSubGrid: function() {
          const url = Xrm.Page.context.getClientUrl() + "/main.aspx?etc=2&pagetype=ENTITYLIST&viewid=%7b00000000-0000-0000-00AA-000010001004%7d&viewtype=1039#68839060";
          window.open(url , null, "popup");
        },
        getData: function(query, callback) {
          RetrieveEntities(Xrm.Page.context.getClientUrl(), entitySet, query, callback);
        }
      });
    }
  };
}

function RetrieveEntities(clientURL, entitySet, query, callback) {
  var req = new XMLHttpRequest();
  req.open('GET', clientURL + "/api/data/v8.0/" + entitySet + query, true);
  req.setRequestHeader("Accept", "application/json");
  req.setRequestHeader("Content-type", "application/json; charset=utf-8");
  req.setRequestHeader("OData-MaxVersion", "4.0");
  req.setRequestHeader("OData-Version","4.0");

  req.onreadystatechange = function () {
    if (this.readyState == 4 /* complete */) {
      req.onreadystatechange = null;
      if (this.status == 200) {
        var data = JSON.parse(this.response);
        console.log(data);
        callback(data);
      }
      else {
        var error = JSON.parse(this.response).error;
        console.log(error.message);
      }
    }
  };
  req.send();
}
