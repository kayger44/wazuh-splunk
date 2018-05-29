/*
 * Wazuh app - Overview agent summary controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

require([
  "jquery",
  "splunkjs/mvc/layoutview",
  "/static/app/SplunkAppForWazuh/js/directives/agentsTable.js",
  "/static/app/SplunkAppForWazuh/js/services/credentialService.js",
  "/static/app/SplunkAppForWazuh/js/services/apiService.js",
  "/static/app/SplunkAppForWazuh/js/directives/toaster.js"
],
  function (
    $,
    LayoutView,
    agentsTable,
    CredentialService,
    ApiService,
    Toast

  ) {

    const errorToast = new Toast('error', 'toast-bottom-right', 'Error at loading agent list', 1000, 250, 250)

    CredentialService.checkSelectedApiConnection().then((api) => {

      /**
       * Initializes agent table
       */
      const initializeAgentTable = async () => {
        try {
          const baseUrl = await ApiService.getBaseUrl()
          const urlData = {
            baseUrl: baseUrl,
            ipApi: api.url,
            portApi: api.portapi,
            userApi: api.userapi,
            passApi: api.passapi
          }
          const table = new agentsTable($('#row1'))
          table.build(urlData)
        } catch (err) {
          errorToast.show()
          console.error(err)
        }
      }

      /**
       * On document ready load agent table
       */
      $(document).ready(() => initializeAgentTable())

      $('header').remove()
      new LayoutView({ "hideFooter": false, "hideChrome": false, "hideSplunkBar": false, "hideAppBar": false })
        .render()
        .getContainerElement()
        .appendChild($('.dashboard-body')[0])

    }).catch((err) => { window.location.href = '/en-US/app/SplunkAppForWazuh/settings' })
  }
)

