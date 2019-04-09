define(['../../module'], function (controllers) {
  'use strict'

  class OverviewWelcome {
    /**
     * Class Welcome
     * @param {*} $scope
     * @param {Object} agentsInfo
     * @param {Object} extensions
     */
    constructor($scope, agentsInfo, extensions) {
      this.scope = $scope
      try {
        this.scope.agentsCountTotal = agentsInfo.data.data.Total - 1
        this.scope.agentsCountActive = agentsInfo.data.data.Active - 1
        this.scope.agentsCountDisconnected = agentsInfo.data.data.Disconnected
        this.scope.agentsCountNeverConnected =
          agentsInfo.data.data['Never Connected']
        this.loadCharts();
      } catch (error) { } //eslint-disable-line

      try {
        this.extensions = extensions
      } catch (error) { } //eslint-disable-line
    }

    /**
     * On controller loads
     */
    $onInit() {
      const keys = Object.keys(this.extensions)
      keys.map(key =>
        this.extensions[key] === 'true'
          ? (this.scope[key] = key)
          : (this.scope[key] = null)
      )
      if (!this.scope.$$phase) this.scope.$digest()
    }

    /**
 * Load custom charts 
 */
    loadCharts() {
      let allCharts = [];
      const chart1 = new Chart(document.getElementById("overviewWelcome1"),
        {
          type: "doughnut",
          data: {
            labels: ["Active", "Disconnected", "Never connected"],
            datasets: [
              {
                backgroundColor: ['#46BFBD', '#F7464A', '#949FB1'],
                data: [this.scope.agentsCountActive, this.scope.agentsCountDisconnected, this.scope.agentsCountNeverConnected],
              }
            ]
          },
          options: {
            cutoutPercentage: 65
          }
        });
      setTimeout(function () {
        allCharts.push(chart1);
        allCharts.forEach(function (chart) {
          chart.update();
        });
      }, 250);
    }
  }
  controllers.controller('overviewWelcomeCtrl', OverviewWelcome)
})
