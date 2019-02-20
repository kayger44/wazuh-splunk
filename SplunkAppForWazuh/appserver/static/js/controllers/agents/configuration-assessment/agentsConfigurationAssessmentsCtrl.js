/*
 * Wazuh app - Agents controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

define([
  '../../module',
  '../../../services/visualizations/chart/pie-chart',
  '../../../services/visualizations/chart/area-chart',
  '../../../services/visualizations/table/table',
  '../../../services/visualizations/inputs/time-picker',
  '../../../services/rawTableData/rawTableDataService'
], function (app, PieChart, AreaChart, Table, TimePicker, RawTableDataService) {
  'use strict'

  class AgentsCA {
    /**
     * Class Agents Policy-Monitoring
     * @param {Object} $urlTokenModel
     * @param {Object} $scope
     * @param {Object} $state
     * @param {Object} $currentDataService
     * @param {Object} agent
     * @param {*} $reportingService
     * @param {*} $requestService
     * @param {*} $notificationService
     * @param {*} $csvRequestService
     */

    constructor(
      $urlTokenModel,
      $rootScope,
      $scope,
      $state,
      $currentDataService,
      agent,
      configAssess,
      $reportingService,
      $requestService,
      $notificationService,
      $csvRequestService,
      $tableFilterService
    ) {
      this.urlTokenModel = $urlTokenModel
      this.rootScope = $rootScope
      this.scope = $scope
      this.apiReq = $requestService.apiReq
      this.scope.showPolicies = false
      this.state = $state
      this.reportingService = $reportingService
      this.tableResults = {}
      this.currentDataService = $currentDataService
      this.agent = agent
      this.configAssess = configAssess
      this.toast = $notificationService.showSimpleToast
      this.api = $currentDataService.getApi()
      this.csvReq = $csvRequestService
      this.wzTableFilter = $tableFilterService
      this.currentDataService.addFilter(
        `{"rule.groups":"configuration_assessment", "implicit":true}`
      )
      if (
        this.agent &&
        this.agent.data &&
        this.agent.data.data &&
        this.agent.data.data.id
      )
        this.currentDataService.addFilter(
          `{"agent.id":"${this.agent.data.data.id}", "implicit":true}`
        )

      if (
        this.configAssess &&
        this.configAssess.data &&
        this.configAssess.data.data &&
        this.configAssess.data.data.items &&
        this.configAssess.data.error === 0
      ) {
        this.configAssess = this.configAssess.data.data.items
        this.scope.configAssess = this.configAssess
      }

      this.filters = this.currentDataService.getSerializedFilters()
      this.timePicker = new TimePicker(
        '#timePicker',
        this.urlTokenModel.handleValueChange
      )

      this.scope.$on('deletedFilter', () => {
        this.launchSearches()
      })

      this.scope.$on('barFilter', () => {
        this.launchSearches()
      })

      this.vizz = [
        /**
         * Visualizations
         */
        new AreaChart(
          'elementOverTime',
          `${
          this.filters
          } sourcetype=wazuh rule.description=* | timechart span=1h count by rule.description`,
          'elementOverTime',
          this.scope
        ),
        new PieChart(
          'cisRequirements',
          `${this.filters} sourcetype=wazuh rule.cis{}=* | top  rule.cis{}`,
          'cisRequirements',
          this.scope
        ),
        new PieChart(
          'topPciDss',
          `${
          this.filters
          } sourcetype=wazuh rule.pci_dss{}=* | top  rule.pci_dss{}`,
          'topPciDss',
          this.scope
        ),
        new AreaChart(
          'eventsPerAgent',
          `${
          this.filters
          } sourcetype=wazuh | timechart span=2h count by agent.name`,
          'eventsPerAgent',
          this.scope
        ),
        new Table(
          'alertsSummary',
          `${
          this.filters
          } sourcetype=wazuh |stats count sparkline by agent.name, rule.description, title | sort count DESC | rename rule.description as "Rule description", agent.name as Agent, title as Control`,
          'alertsSummary',
          this.scope
        ),
        new RawTableDataService(
          'alertsSummaryTable',
          `${
          this.filters
          } sourcetype=wazuh |stats count sparkline by agent.name, rule.description, title | sort count DESC | rename rule.description as "Rule description", agent.name as Agent, title as Control`,
          'alertsSummaryTableToken',
          '$result$',
          this.scope,
          'Alerts Summary'
        )
      ]

      // Set agent info
      try {
        this.agentReportData = {
          ID: this.agent.data.data.id,
          Name: this.agent.data.data.name,
          IP: this.agent.data.data.ip,
          Version: this.agent.data.data.version,
          Manager: this.agent.data.data.manager,
          OS: this.agent.data.data.os.name,
          dateAdd: this.agent.data.data.dateAdd,
          lastKeepAlive: this.agent.data.data.lastKeepAlive,
          group: this.agent.data.data.group.toString()
        }
      } catch (error) {
        this.agentReportData = false
      }

      /**
       * Generates report
       */
      this.scope.startVis2Png = () =>
        this.reportingService.startVis2Png(
          'agents-ca',
          'Configuration assessment',
          this.filters,
          [
            'elementOverTime',
            'cisRequirements',
            'topPciDss',
            'eventsPerAgent',
            'alertsSummary'
          ],
          {}, //Metrics,
          this.tableResults,
          this.agentReportData
        )

      this.scope.$on('loadingReporting', (event, data) => {
        this.scope.loadingReporting = data.status
      })

      this.scope.$on('checkReportingStatus', () => {
        this.vizzReady = !this.vizz.filter(v => {
          return v.finish === false
        }).length
        if (this.vizzReady) {
          this.scope.loadingVizz = false
        } else {
          this.vizz.map(v => {
            if (v.constructor.name === 'RawTableData') {
              this.tableResults[v.name] = v.results
            }
          })
          this.scope.loadingVizz = true
        }
        if (!this.scope.$$phase) this.scope.$digest()
      })

      /**
       * When controller is destroyed
       */
      this.scope.$on('$destroy', () => {
        this.timePicker.destroy()
        this.vizz.map(vizz => vizz.destroy())
      })
    }

    $onInit() {
      this.scope.searchRootcheck = (term, specificFilter) =>
        this.scope.$broadcast('wazuhSearch', { term, specificFilter })
      this.scope.downloadCsv = () => this.downloadCsv()

      this.scope.switchVisualizations = () => this.switchVisualizations()
      this.scope.loadPolicyChecks = (id, name) => this.loadPolicyChecks(id, name)
      this.scope.backToConfAssess = () => this.backToConfAssess()

      this.scope.agent =
        this.agent && this.agent.data && this.agent.data.data
          ? this.agent.data.data
          : { error: true }
      this.scope.getAgentStatusClass = agentStatus =>
        this.getAgentStatusClass(agentStatus)
      this.scope.formatAgentStatus = agentStatus =>
        this.formatAgentStatus(agentStatus)
    }

    /**
     * Returns a class depending of the agent state
     * @param {String} agentStatus
     */
    getAgentStatusClass(agentStatus) {
      return agentStatus === 'Active' ? 'teal' : 'red'
    }

    /**
     * Checks and returns agent status
     * @param {Array} agentStatus
     */
    formatAgentStatus(agentStatus) {
      return ['Active', 'Disconnected'].includes(agentStatus)
        ? agentStatus
        : 'Never connected'
    }

    /**
     * Exports the table in CSV format
     */
    async downloadCsv() {
      try {
        this.toast('Your download should begin automatically...')
        const currentApi = this.api.id
        const output = await this.csvReq.fetch(
          '/agents',
          currentApi,
          this.wzTableFilter.get()
        )
        const blob = new Blob([output], { type: 'text/csv' }) // eslint-disable-line
        saveAs(blob, 'agents.csv') // eslint-disable-line
        return
      } catch (error) {
        this.toast('Error downloading CSV')
      }
      return
    }

    /**
     * Gets filters and launches search
     */
    launchSearches() {
      this.filters = this.currentDataService.getSerializedFilters()
      this.state.reload()
    }

    /**
     * Switches between alerts visualizations and policies
     */
    switchVisualizations() {
      this.scope.showPolicies = !this.scope.showPolicies
      this.scope.showPolicyChecks = name
      this.scope.$applyAsync()
    }

    /**
     * Loads policies checks
     */
    async loadPolicyChecks(id, name) {
      this.scope.showPolicyChecks = name
      this.scope.policyId = id
      const agentId = this.agent.data.data.id
      this.scope.wzTablePath = `/configuration-assessment/${agentId}/checks/${id}`
    }

    /**
     * Back to configuration assessment from a policy checks
     */
    backToConfAssess(){
      this.scope.showPolicyChecks = false
      this.scope.showPolicies = true
    }

  }
  app.controller('agentsConfigurationAssessmentsCtrl', AgentsCA)
})
