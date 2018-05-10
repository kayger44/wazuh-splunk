/*
 * Wazuh app - Decoders view controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

require([
  "splunkjs/mvc",
  "splunkjs/mvc/utils",
  "splunkjs/mvc/tokenutils",
  "underscore",
  "jquery",
  "splunkjs/mvc/simplexml",
  "splunkjs/mvc/layoutview",
  "splunkjs/mvc/simplexml/dashboardview",
  "splunkjs/mvc/simplexml/dashboard/panelref",
  "splunkjs/mvc/simplexml/element/chart",
  "splunkjs/mvc/simplexml/element/event",
  "splunkjs/mvc/simplexml/element/html",
  "splunkjs/mvc/simplexml/element/list",
  "splunkjs/mvc/simplexml/element/map",
  "splunkjs/mvc/simplexml/element/single",
  "splunkjs/mvc/simplexml/element/table",
  "splunkjs/mvc/simplexml/element/visualization",
  "splunkjs/mvc/simpleform/formutils",
  "splunkjs/mvc/simplexml/eventhandler",
  "splunkjs/mvc/simplexml/searcheventhandler",
  "splunkjs/mvc/simpleform/input/dropdown",
  "splunkjs/mvc/simpleform/input/radiogroup",
  "splunkjs/mvc/simpleform/input/linklist",
  "splunkjs/mvc/simpleform/input/multiselect",
  "splunkjs/mvc/simpleform/input/checkboxgroup",
  "splunkjs/mvc/simpleform/input/text",
  "splunkjs/mvc/simpleform/input/timerange",
  "splunkjs/mvc/simpleform/input/submit",
  "splunkjs/mvc/searchmanager",
  "splunkjs/mvc/savedsearchmanager",
  "splunkjs/mvc/postprocessmanager",
  "splunkjs/mvc/simplexml/urltokenmodel",
  "/static/app/wazuh/js/customViews/tableView.js",
  "/static/app/wazuh/js/utilLib/services.js",
  "/static/app/wazuh/js/customViews/toaster.js",
  "/static/app/wazuh/js/utilLib/promisedReq.js"

  // Add comma-separated libraries and modules manually here, for example:
  // ..."splunkjs/mvc/simplexml/urltokenmodel",
  // "splunkjs/mvc/tokenforwarder"
],
  function (
    mvc,
    utils,
    TokenUtils,
    _,
    $,
    DashboardController,
    LayoutView,
    Dashboard,
    PanelRef,
    ChartElement,
    EventElement,
    HtmlElement,
    ListElement,
    MapElement,
    SingleElement,
    TableElement,
    VisualizationElement,
    FormUtils,
    EventHandler,
    SearchEventHandler,
    DropdownInput,
    RadioGroupInput,
    LinkListInput,
    MultiSelectInput,
    CheckboxGroupInput,
    TextInput,
    TimeRangeInput,
    SubmitButton,
    SearchManager,
    SavedSearchManager,
    PostProcessManager,
    UrlTokenModel,
    tableView,
    services,
    Toast,
    promisedReq

    // Add comma-separated parameter names here, for example: 
    // ...UrlTokenModel, 
    // TokenForwarder
  ) {

    let pageLoading = true


    // 
    // TOKENS
    //

    // Create token namespaces
    const urlTokenModel = new UrlTokenModel()
    mvc.Components.registerInstance('url', urlTokenModel)
    const defaultTokenModel = mvc.Components.getInstance('default', { create: true })
    const submittedTokenModel = mvc.Components.getInstance('submitted', { create: true })
    const service = new services()
    const errorToast = new Toast('error', 'toast-bottom-right', 'Error at loading decoders info', 1000, 250, 250)
    service.checkConnection().then(() => {
      urlTokenModel.on('url:navigate', () => {
        defaultTokenModel.set(urlTokenModel.toJSON())
        if (!_.isEmpty(urlTokenModel.toJSON()) && !_.all(urlTokenModel.toJSON(), _.isUndefined)) {
          submitTokens()
        } else {
          submittedTokenModel.clear()
        }
      })

      // Initialize tokens
      defaultTokenModel.set(urlTokenModel.toJSON())

      const submitTokens = () => {
        // Copy the contents of the defaultTokenModel to the submittedTokenModel and urlTokenModel
        FormUtils.submitForm({ replaceState: pageLoading })
      }

      const setToken = (name, value) => {
        defaultTokenModel.set(name, value)
        submittedTokenModel.set(name, value)
      }

      const unsetToken = (name) => {
        defaultTokenModel.unset(name)
        submittedTokenModel.unset(name)
      }

      /**
       * Initializes data for rendering decoders table
       */
      const initializeRulesetTable = async () => {
        try {
          const { baseUrl, jsonData } = await service.loadCredentialData()

          const opts = {
            pages: 10,
            processing: true,
            serverSide: true,
            filterVisible: false,
            columns: [
              { "data": "name", 'orderable': true, defaultContent: "-" },
              { "data": "status", 'orderable': true, defaultContent: "-" },
              { "data": "path", 'orderable': true, defaultContent: "-" },
              { "data": "file", 'orderable': true, defaultContent: "-" },
              { "data": "position", 'orderable': true, defaultContent: "-" }
            ]
          }
          const table = new tableView()
          table.element($('#myTable'))
          table.build(baseUrl + '/custom/wazuh/manager/decoders?ip=' + jsonData.url + '&port=' + jsonData.portapi + '&user=' + jsonData.userapi + '&pass=' + jsonData.passapi, opts)
          table.click(data => {
            setToken("showDetails", "true")
            setToken("Name", data.name)
            setToken("Program", data.details.program_name || "-")
            setToken("Path", data.path)
            setToken("Order", data.details.order || "-")
            setToken("Parent", data.details.parent || "-")
            setToken("Regex", data.details.regex || "-")
          })
        } catch (err) {
          errorToast.show()
        }
      }

      $(document).ready(() => initializeRulesetTable())

      const search2 = new SearchManager({
        "id": "search2",
        "cancelOnUnload": true,
        "sample_ratio": 1,
        "earliest_time": "-24h@h",
        "status_buckets": 0,
        "search": "index=\"wazuh\" sourcetype=\"wazuh\"| timechart count by \"decoder.name\" useother=f",
        "latest_time": "now",
        "app": utils.getCurrentApp(),
        "auto_cancel": 90,
        "preview": true,
        "tokenDependencies": {
        },
        "runWhenTimeIsUndefined": false
      }, { tokens: true, tokenNamespace: "submitted" })


      //
      // SPLUNK LAYOUT
      //

      $('header').remove()
      new LayoutView({ "hideFooter": false, "hideSplunkBar": false, "hideAppBar": false, "hideChrome": false })
        .render()
        .getContainerElement()
        .appendChild($('.dashboard-body')[0])

      //
      // DASHBOARD EDITOR
      //

      new Dashboard({
        id: 'dashboard',
        el: $('.dashboard-body'),
        showTitle: true,
        editable: true
      }, { tokens: true }).render()

      const element2 = new HtmlElement({
        "id": "element2",
        "useTokens": true,
        "el": $('#element2')
      }, { tokens: true, tokenNamespace: "submitted" }).render()

      DashboardController.addReadyDep(element2.contentLoaded())

      const element3 = new ChartElement({
        "id": "element3",
        "charting.axisY2.scale": "inherit",
        "trellis.size": "medium",
        "charting.chart.stackMode": "stacked",
        "resizable": true,
        "charting.layout.splitSeries.allowIndependentYRanges": "0",
        "charting.drilldown": "none",
        "charting.chart.nullValueMode": "gaps",
        "charting.axisTitleY2.visibility": "visible",
        "charting.chart": "area",
        "trellis.scales.shared": "1",
        "charting.layout.splitSeries": "0",
        "charting.chart.style": "shiny",
        "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
        "charting.axisTitleX.visibility": "collapsed",
        "charting.axisTitleY.visibility": "visible",
        "charting.axisX.scale": "linear",
        "charting.chart.bubbleMinimumSize": "10",
        "charting.axisLabelsX.majorLabelStyle.overflowMode": "ellipsisNone",
        "charting.axisY2.enabled": "0",
        "trellis.enabled": "0",
        "charting.legend.placement": "right",
        "charting.chart.bubbleSizeBy": "area",
        "charting.chart.bubbleMaximumSize": "50",
        "charting.axisLabelsX.majorLabelStyle.rotation": "0",
        "charting.axisY.scale": "linear",
        "charting.chart.showDataLabels": "none",
        "charting.chart.sliceCollapsingThreshold": "0.01",
        "managerid": "search2",
        "el": $('#element3')
      }, { tokens: true, tokenNamespace: "submitted" }).render()


      // Initialize time tokens to default
      if (!defaultTokenModel.has('earliest') && !defaultTokenModel.has('latest')) {
        defaultTokenModel.set({ earliest: '0', latest: '' })
      }

      submitTokens()


      //
      // DASHBOARD READY
      //

      DashboardController.ready()
      pageLoading = false
    }).catch((err) => { window.location.href = '/en-US/app/wazuh/API' })
  }
)
// ]]>