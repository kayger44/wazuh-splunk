// <![CDATA[
    // <![CDATA[
    //
    // LIBRARY REQUIREMENTS
    //
    // In the require function, we include the necessary libraries and modules for
    // the HTML dashboard. Then, we pass variable names for these libraries and
    // modules as function parameters, in order.
    // 
    // When you add libraries or modules, remember to retain this mapping order
    // between the library or module and its function parameter. You can do this by
    // adding to the end of these lists, as shown in the commented examples below.

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
      "splunkjs/mvc/simplexml/urltokenmodel"
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
        UrlTokenModel

        // Add comma-separated parameter names here, for example: 
        // ...UrlTokenModel, 
        // TokenForwarder
      ) {

        var pageLoading = true;


        // 
        // TOKENS
        //

        // Create token namespaces
        var urlTokenModel = new UrlTokenModel();
        mvc.Components.registerInstance('url', urlTokenModel);
        var defaultTokenModel = mvc.Components.getInstance('default', { create: true });
        var submittedTokenModel = mvc.Components.getInstance('submitted', { create: true });
        var service = mvc.createService({ owner: "nobody" });

        urlTokenModel.on('url:navigate', function () {
          defaultTokenModel.set(urlTokenModel.toJSON());
          if (!_.isEmpty(urlTokenModel.toJSON()) && !_.all(urlTokenModel.toJSON(), _.isUndefined)) {
            submitTokens();
          } else {
            submittedTokenModel.clear();
          }
        });

        // Initialize tokens
        defaultTokenModel.set(urlTokenModel.toJSON());

        function submitTokens() {
          // Copy the contents of the defaultTokenModel to the submittedTokenModel and urlTokenModel
          FormUtils.submitForm({ replaceState: pageLoading });
        }

        function setToken(name, value) {
          defaultTokenModel.set(name, value);
          submittedTokenModel.set(name, value);
        }

        function unsetToken(name) {
          defaultTokenModel.unset(name);
          submittedTokenModel.unset(name);
        }

        $(document).ready(function () {
          service.request(
            "storage/collections/data/credentials/",
            "GET",
            null,
            null,
            null,
            { "Content-Type": "application/json" }, null
          ).done(function (data) {
            var parsedData = JSON.parse(data);
            console.log(parsedData)
            console.log('BASEIP', JSON.parse(data)[0].baseip);
            setToken('baseip', parsedData[0].baseip);
            setToken('baseport', parsedData[0].baseport);
            setToken('ipapi', parsedData[0].ipapi);
            setToken('portapi', parsedData[0].portapi);
            setToken('userapi', parsedData[0].userapi);
            setToken('passwordapi', parsedData[0].passapi);
            setToken("loadedtokens", "true");
          });
        })

        //
        // SEARCH MANAGERS
        //


        var search1 = new SearchManager({
          "id": "search1",
          "cancelOnUnload": true,
          "sample_ratio": null,
          "earliest_time": "-60m@m",
          "status_buckets": 0,
          "search": "| getagentscheck $baseip$ $baseport$ $ipapi$ $portapi$ $userapi$ $passwordapi$ |table id, ip, name, os-platform, os-uname, os-name, os-arch,os-version, dateAdd, lastKeepAlive, last_rootcheck, last_syscheck, version, status | dedup id | sort - id | rename os-platform as \"Platform\", os-uname as \"OS Info\", os-name as \"OS name\", os-arch as \"Arch\",os-version as \"OS Version\", dateAdd as \"Registered date\", lastKeepAlive as \"Last KeepAlive\", last_rootcheck as \"Last Rootcheck\", last_syscheck as \"Last Syscheck\", version as \"Agent version\" | search name=$agent$ | fillnull value=\"N/A\"",
          "latest_time": "now",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search2 = new SearchManager({
          "id": "search2",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit agent.name=\"$agent$\" | top rule.groups",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search3 = new SearchManager({
          "id": "search3",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit agent.name=\"$agent$\" | top agent.name showperc=false",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search4 = new SearchManager({
          "id": "search4",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit agent.name=\"$agent$\" | top audit.directory.name showperc=f",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search5 = new SearchManager({
          "id": "search5",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit  agent.name=\"$agent$\"| top audit.file.name showperc=f",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search6 = new SearchManager({
          "id": "search6",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit  agent.name=\"$agent$\" | timechart count by rule.description",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search7 = new SearchManager({
          "id": "search7",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit  \"rule.id\"=80787 agent.name=\"$agent$\" | top audit.file.name",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search8 = new SearchManager({
          "id": "search8",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit agent.name=\"$agent$\"  | top audit.egid",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search9 = new SearchManager({
          "id": "search9",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit agent.name=\"$agent$\"  | top audit.command",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search10 = new SearchManager({
          "id": "search10",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit  agent.name=\"$agent$\"| timechart count by rule.groups",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search11 = new SearchManager({
          "id": "search11",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit  rule.id=80784 agent.name=\"$agent$\"| top audit.file.name",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search12 = new SearchManager({
          "id": "search12",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit  rule.id=80781 agent.name=\"$agent$\" | top audit.file.name",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search13 = new SearchManager({
          "id": "search13",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit  rule.id=80790 agent.name=\"$agent$\" | top audit.file.name",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search14 = new SearchManager({
          "id": "search14",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit  rule.id=80791 agent.name=\"$agent$\"| top audit.file.name",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search15 = new SearchManager({
          "id": "search15",
          "cancelOnUnload": true,
          "sample_ratio": 1,
          "earliest_time": "$when.earliest$",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit agent.name=\"$agent$\"| table _time, agent.name, rule.description, audit.exe, audit.file.mode, audit.egid, audit.euid",
          "latest_time": "$when.latest$",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true, tokenNamespace: "submitted" });

        var search16 = new SearchManager({
          "id": "search16",
          "cancelOnUnload": true,
          "sample_ratio": null,
          "earliest_time": "-24h@h",
          "status_buckets": 0,
          "search": "index=wazuh sourcetype=wazuh agent.name=\"*\"| stats count by \"agent.name\" | sort \"agent.name\" ASC | fields - count",
          "latest_time": "now",
          "app": utils.getCurrentApp(),
          "auto_cancel": 90,
          "preview": true,
          "tokenDependencies": {
          },
          "runWhenTimeIsUndefined": false
        }, { tokens: true });


        //
        // SPLUNK LAYOUT
        //

        $('header').remove();
        new LayoutView({ "hideFooter": false, "hideSplunkBar": false, "hideAppBar": false, "hideChrome": false })
          .render()
          .getContainerElement()
          .appendChild($('.dashboard-body')[0]);

        //
        // DASHBOARD EDITOR
        //

        new Dashboard({
          id: 'dashboard',
          el: $('.dashboard-body'),
          showTitle: true,
          editable: true
        }, { tokens: true }).render();


        //
        // VIEWS: VISUALIZATION ELEMENTS
        //

        var element1 = new TableElement({
          "id": "element1",
          "count": 5,
          "drilldown": "cell",
          "managerid": "search1",
          "el": $('#element1')
        }, { tokens: true, tokenNamespace: "submitted" }).render();

        element1.on("click", function (e) {
          if (e.field !== undefined) {
            e.preventDefault();
            var url = TokenUtils.replaceTokenNames("{{SPLUNKWEB_URL_PREFIX}}/app/wazuh/| getagentscheck name=$agent$ |table id, ip, name, os-platform, os-uname, os-name, os-arch,os-version, dateAdd, lastKeepAlive, last_rootcheck, last_syscheck, version, status | dedup id | sort - id | rename os-platform as \"Platform\", os-uname as \"OS Info\", os-name as \"OS name\", os-arch as \"Arch\",os-version as \"OS Version\", dateAdd as \"Registered date\", lastKeepAlive as \"Last KeepAlive\", last_rootcheck as \"Last Rootcheck\", last_syscheck as \"Last Syscheck\", version as \"Agent version\" | fillnull value=\"N/A\"&earliest=-60m@m&latest=now", _.extend(submittedTokenModel.toJSON(), e.data), TokenUtils.getEscaper('url'), TokenUtils.getFilters(mvc.Components));
            utils.redirect(url, false, "_blank");
          }
        });

        var element2 = new ChartElement({
          "id": "element2",
          "charting.axisY2.scale": "inherit",
          "trellis.size": "medium",
          "charting.chart.stackMode": "default",
          "resizable": true,
          "charting.layout.splitSeries.allowIndependentYRanges": "0",
          "charting.drilldown": "none",
          "charting.chart.nullValueMode": "gaps",
          "charting.axisTitleY2.visibility": "visible",
          "charting.chart": "pie",
          "trellis.scales.shared": "1",
          "charting.layout.splitSeries": "0",
          "charting.chart.style": "shiny",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.axisTitleX.visibility": "visible",
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
          "el": $('#element2')
        }, { tokens: true, tokenNamespace: "submitted" }).render();


        var element3 = new TableElement({
          "id": "element3",
          "drilldown": "cell",
          "managerid": "search3",
          "el": $('#element3')
        }, { tokens: true, tokenNamespace: "submitted" }).render();

        element3.on("click", function (e) {
          if (e.field !== undefined) {
            e.preventDefault();
            var url = TokenUtils.replaceTokenNames("{{SPLUNKWEB_URL_PREFIX}}/app/wazuh/search?q=index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit agent.name=* | top agent.name showperc=false&earliest=$when.earliest$&latest=$when.latest$", _.extend(submittedTokenModel.toJSON(), e.data), TokenUtils.getEscaper('url'), TokenUtils.getFilters(mvc.Components));
            utils.redirect(url, false, "_blank");
          }
        });

        var element4 = new TableElement({
          "id": "element4",
          "drilldown": "cell",
          "managerid": "search4",
          "el": $('#element4')
        }, { tokens: true, tokenNamespace: "submitted" }).render();

        element4.on("click", function (e) {
          if (e.field !== undefined) {
            e.preventDefault();
            var url = TokenUtils.replaceTokenNames("{{SPLUNKWEB_URL_PREFIX}}/app/wazuh/search?q=index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit | top audit.directory.name showperc=f&earliest=$when.earliest$&latest=$when.latest$", _.extend(submittedTokenModel.toJSON(), e.data), TokenUtils.getEscaper('url'), TokenUtils.getFilters(mvc.Components));
            utils.redirect(url, false, "_blank");
          }
        });

        var element5 = new TableElement({
          "id": "element5",
          "drilldown": "cell",
          "managerid": "search5",
          "el": $('#element5')
        }, { tokens: true, tokenNamespace: "submitted" }).render();

        element5.on("click", function (e) {
          if (e.field !== undefined) {
            e.preventDefault();
            var url = TokenUtils.replaceTokenNames("{{SPLUNKWEB_URL_PREFIX}}/app/wazuh/search?q=index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit  | top audit.file.name showperc=f&earliest=$when.earliest$&latest=$when.latest$", _.extend(submittedTokenModel.toJSON(), e.data), TokenUtils.getEscaper('url'), TokenUtils.getFilters(mvc.Components));
            utils.redirect(url, false, "_blank");
          }
        });

        var element6 = new ChartElement({
          "id": "element6",
          "charting.axisY2.scale": "inherit",
          "trellis.size": "medium",
          "charting.chart.stackMode": "stacked100",
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
          "charting.axisTitleX.visibility": "visible",
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
          "managerid": "search6",
          "el": $('#element6')
        }, { tokens: true, tokenNamespace: "submitted" }).render();


        var element7 = new ChartElement({
          "id": "element7",
          "charting.drilldown": "none",
          "resizable": true,
          "charting.chart": "pie",
          "managerid": "search7",
          "el": $('#element7')
        }, { tokens: true, tokenNamespace: "submitted" }).render();


        var element8 = new ChartElement({
          "id": "element8",
          "charting.axisY2.scale": "inherit",
          "trellis.size": "medium",
          "charting.chart.stackMode": "default",
          "resizable": true,
          "charting.layout.splitSeries.allowIndependentYRanges": "0",
          "charting.drilldown": "none",
          "charting.chart.nullValueMode": "gaps",
          "charting.axisTitleY2.visibility": "visible",
          "charting.chart": "bar",
          "trellis.scales.shared": "1",
          "charting.layout.splitSeries": "0",
          "charting.chart.style": "shiny",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.axisTitleX.visibility": "visible",
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
          "managerid": "search8",
          "el": $('#element8')
        }, { tokens: true, tokenNamespace: "submitted" }).render();


        var element9 = new ChartElement({
          "id": "element9",
          "charting.axisY2.scale": "inherit",
          "trellis.size": "medium",
          "charting.chart.stackMode": "default",
          "resizable": true,
          "charting.layout.splitSeries.allowIndependentYRanges": "0",
          "charting.drilldown": "none",
          "charting.chart.nullValueMode": "gaps",
          "charting.axisTitleY2.visibility": "visible",
          "charting.chart": "pie",
          "trellis.scales.shared": "1",
          "charting.layout.splitSeries": "0",
          "charting.chart.style": "shiny",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.axisTitleX.visibility": "visible",
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
          "managerid": "search9",
          "el": $('#element9')
        }, { tokens: true, tokenNamespace: "submitted" }).render();


        var element10 = new ChartElement({
          "id": "element10",
          "charting.axisY2.scale": "inherit",
          "trellis.size": "medium",
          "charting.chart.stackMode": "stacked100",
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
          "charting.axisTitleX.visibility": "visible",
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
          "managerid": "search10",
          "el": $('#element10')
        }, { tokens: true, tokenNamespace: "submitted" }).render();


        var element11 = new ChartElement({
          "id": "element11",
          "charting.axisY2.scale": "inherit",
          "trellis.size": "medium",
          "charting.chart.stackMode": "default",
          "resizable": true,
          "charting.layout.splitSeries.allowIndependentYRanges": "0",
          "charting.drilldown": "none",
          "charting.chart.nullValueMode": "gaps",
          "charting.axisTitleY2.visibility": "visible",
          "charting.chart": "pie",
          "trellis.scales.shared": "1",
          "charting.layout.splitSeries": "0",
          "charting.chart.style": "shiny",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.axisTitleX.visibility": "visible",
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
          "managerid": "search11",
          "el": $('#element11')
        }, { tokens: true, tokenNamespace: "submitted" }).render();


        var element12 = new ChartElement({
          "id": "element12",
          "charting.axisY2.scale": "inherit",
          "trellis.size": "medium",
          "charting.chart.stackMode": "default",
          "resizable": true,
          "charting.layout.splitSeries.allowIndependentYRanges": "0",
          "charting.drilldown": "none",
          "charting.chart.nullValueMode": "gaps",
          "charting.axisTitleY2.visibility": "visible",
          "charting.chart": "pie",
          "trellis.scales.shared": "1",
          "charting.layout.splitSeries": "0",
          "charting.chart.style": "shiny",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.axisTitleX.visibility": "visible",
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
          "managerid": "search12",
          "el": $('#element12')
        }, { tokens: true, tokenNamespace: "submitted" }).render();


        var element13 = new ChartElement({
          "id": "element13",
          "charting.axisY2.scale": "inherit",
          "trellis.size": "medium",
          "charting.chart.stackMode": "default",
          "resizable": true,
          "charting.layout.splitSeries.allowIndependentYRanges": "0",
          "charting.drilldown": "none",
          "charting.chart.nullValueMode": "gaps",
          "charting.axisTitleY2.visibility": "visible",
          "charting.chart": "pie",
          "trellis.scales.shared": "1",
          "charting.layout.splitSeries": "0",
          "charting.chart.style": "shiny",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.axisTitleX.visibility": "visible",
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
          "managerid": "search13",
          "el": $('#element13')
        }, { tokens: true, tokenNamespace: "submitted" }).render();


        var element14 = new ChartElement({
          "id": "element14",
          "charting.axisY2.scale": "inherit",
          "trellis.size": "medium",
          "charting.chart.stackMode": "default",
          "resizable": true,
          "charting.layout.splitSeries.allowIndependentYRanges": "0",
          "charting.drilldown": "none",
          "charting.chart.nullValueMode": "gaps",
          "charting.axisTitleY2.visibility": "visible",
          "charting.chart": "pie",
          "trellis.scales.shared": "1",
          "charting.layout.splitSeries": "0",
          "charting.chart.style": "shiny",
          "charting.legend.labelStyle.overflowMode": "ellipsisMiddle",
          "charting.axisTitleX.visibility": "visible",
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
          "managerid": "search14",
          "el": $('#element14')
        }, { tokens: true, tokenNamespace: "submitted" }).render();


        var element15 = new TableElement({
          "id": "element15",
          "dataOverlayMode": "none",
          "drilldown": "cell",
          "percentagesRow": "false",
          "rowNumbers": "false",
          "totalsRow": "false",
          "wrap": "false",
          "managerid": "search15",
          "el": $('#element15')
        }, { tokens: true, tokenNamespace: "submitted" }).render();

        element15.on("click", function (e) {
          if (e.field !== undefined) {
            e.preventDefault();
            var url = TokenUtils.replaceTokenNames("{{SPLUNKWEB_URL_PREFIX}}/app/wazuh/search?q=index=wazuh sourcetype=\"wazuh\" \"rule.groups\"=audit | table _time, agent.name, rule.description, audit.exe, audit.file.mode, audit.egid, audit.euid&earliest=$when.earliest$&latest=$when.latest$", _.extend(submittedTokenModel.toJSON(), e.data), TokenUtils.getEscaper('url'), TokenUtils.getFilters(mvc.Components));
            utils.redirect(url, false, "_blank");
          }
        });


        //
        // VIEWS: FORM INPUTS
        //

        var input1 = new DropdownInput({
          "id": "input1",
          "choices": [
            { "label": "ALL", "value": "*" }
          ],
          "labelField": "agent.name",
          "searchWhenChanged": true,
          "default": "*",
          "valueField": "agent.name",
          "initialValue": "*",
          "selectFirstChoice": false,
          "showClearButton": true,
          "value": "$form.agent$",
          "managerid": "search16",
          "el": $('#input1')
        }, { tokens: true }).render();

        input1.on("change", function (newValue) {
          FormUtils.handleValueChange(input1);
        });

        var input2 = new TimeRangeInput({
          "id": "input2",
          "searchWhenChanged": true,
          "default": { "latest_time": "now", "earliest_time": "-24h@h" },
          "earliest_time": "$form.when.earliest$",
          "latest_time": "$form.when.latest$",
          "el": $('#input2')
        }, { tokens: true }).render();

        input2.on("change", function (newValue) {
          FormUtils.handleValueChange(input2);
        });

        DashboardController.onReady(function () {
          if (!submittedTokenModel.has('earliest') && !submittedTokenModel.has('latest')) {
            submittedTokenModel.set({ earliest: '0', latest: '' });
          }
        });

        // Initialize time tokens to default
        if (!defaultTokenModel.has('earliest') && !defaultTokenModel.has('latest')) {
          defaultTokenModel.set({ earliest: '0', latest: '' });
        }

        submitTokens();


        //
        // DASHBOARD READY
        //

        DashboardController.ready();
        pageLoading = false;

      }
    );
// ]]>