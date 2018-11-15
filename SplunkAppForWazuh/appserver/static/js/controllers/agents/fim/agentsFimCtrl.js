define([
  '../../module',
  '../../../services/visualizations/chart/column-chart',
  '../../../services/visualizations/chart/pie-chart',
  '../../../services/visualizations/table/table',
  '../../../services/visualizations/chart/area-chart',
  '../../../services/visualizations/inputs/time-picker',
], function (
  app,
  ColumnChart,
  PieChart,
  Table,
  AreaChart,
  TimePicker
  ) {
    
    'use strict'
    
    class AgentsFim {
      
      /**
      * Class constructor
      * @param {Object} $urlTokenModel 
      * @param {Object} $state 
      * @param {Object} $scope 
      * @param {Object} $currentDataService 
      * @param {Object} agent
      */
      
      
      constructor($urlTokenModel, $state, $scope, $currentDataService, agent) {
        this.state = $state
        if (!$currentDataService.getCurrentAgent()) { this.state.go('overview') }
        this.scope = $scope
        this.urlTokenModel = $urlTokenModel
        this.filters = $currentDataService.getSerializedFilters()
        this.timePicker = new TimePicker('#timePicker',this.urlTokenModel.handleValueChange)
        this.submittedTokenModel = this.urlTokenModel.getSubmittedTokenModel()
        
        this.scope.agent = agent.data.data  
        
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
          new AreaChart('eventsOverTimeElement',
          `${this.filters} sourcetype=\"wazuh\"  \"rule.groups\"=\"syscheck\" | timechart span=12h count by rule.description`,
          'eventsOverTimeElement'),
          new ColumnChart('topGroupOwnersElement',
          `${this.filters} sourcetype=\"wazuh\" uname_after syscheck.gname_after!=\"\"| top limit=20 \"syscheck.gname_after\"`,
          'topGroupOwnersElement'),
          new PieChart('topUserOwnersElement',
          `${this.filters} sourcetype=\"wazuh\" uname_after| top limit=20 \"syscheck.uname_after\"`,
          'topUserOwnersElement'),
          new PieChart('topFileChangesElement',
          `${this.filters} sourcetype=\"wazuh\" \"Integrity checksum changed\" location!=\"syscheck-registry\" syscheck.path=\"*\" | top syscheck.path`,
          'topFileChangesElement'),
          new PieChart('rootUserFileChangesElement',
          `${this.filters} sourcetype=\"wazuh\" \"Integrity checksum changed\" location!=\"syscheck-registry\" syscheck.path=\"*\" | search root | top limit=10 syscheck.path`,
          'rootUserFileChangesElement'),
          new PieChart('wordWritableFilesElement',
          `${this.filters} sourcetype=\"wazuh\" rule.groups=\"syscheck\" \"syscheck.perm_after\"=* | top \"syscheck.perm_after\" showcount=false showperc=false | head 1`,
          'wordWritableFilesElement'),
          new Table('eventsSummaryElement',
          `${this.filters} sourcetype=\"wazuh\" rule.groups=\"syscheck\"  |stats count sparkline by agent.name, syscheck.path syscheck.event, rule.description | sort count DESC | rename agent.name as Agent, syscheck.path as File, syscheck.event as Event, rule.description as Description, count as Count`,
          'eventsSummaryElement')
        ]
        
        /**
        * When controller is destroyed
        */
        this.scope.$on('$destroy', () => {
          this.timePicker.destroy()
          this.vizz.map( (vizz) => vizz.destroy())      
        })
        
      }
      
      $onInit(){
        this.scope.getAgentStatusClass = agentStatus => agentStatus === "Active" ? "teal" : "red";
        this.scope.formatAgentStatus = agentStatus => {
          return ['Active', 'Disconnected'].includes(agentStatus) ? agentStatus : 'Never connected';
        }
      }

      launchSearches(){
        this.filters = $currentDataService.getSerializedFilters()
        this.state.reload()
      }
      
    }  
    app.controller('agentsFimCtrl', AgentsFim)
  })