define(['../../module'], function(controllers) {
  'use strict'

  class Edition {
    /**
     * Class Status
     * @param {*} $scope
     * @param {Array} clusterInfo
     * @param {Boolean} isAdmin
     */
    constructor(
      $scope,
      isAdmin,
      $notificationService,
      clusterInfo,
      $fileEditor,
      $restartService,
      $interval,
      $rootScope,
      $state
    ) {
      this.scope = $scope
      this.clusterInfo = clusterInfo
      this.isAdmin = isAdmin
      this.notification = $notificationService
      this.clusterInfo = clusterInfo
      this.fileEditor = $fileEditor
      this.restartService = $restartService
      this.interval = $interval
      this.rootScope = $rootScope
      this.state = $state
    }
    /**
     * On controller loads
     */
    $onInit() {
      try {
        this.scope.restartInProgress = false
        this.scope.editingNode = false
        this.scope.editNode = nodeName => this.editNode(nodeName)
        this.scope.cancelEditNode = () => this.cancelEditNode()
        this.scope.saveOssecConfig = () => this.saveOssecConfig()
        this.scope.xmlIsValid = valid => this.xmlIsValid(valid)
        this.scope.changeNode = node => this.changeNode(node)
        this.scope.restart = node => this.restart(node)
        this.scope.switchRestart = () => this.switchRestart()
        this.scope.closeRestartConfirmation = () =>
          this.closeRestartConfirmation()

        if (this.clusterInfo && this.clusterInfo.clusterEnabled) {
          this.scope.clusterEnabled = this.clusterInfo.clusterEnabled
          if (this.clusterInfo.clusterEnabled) {
            this.scope.selectedNode = this.clusterInfo.nodes.data.data.items[0].name
            this.scope.nodes = this.clusterInfo.nodes.data.data.items
          }
          this.editNode(this.scope.selectedNode)
        } else {
          this.editNode()
        }
        this.scope.isAdmin = this.isAdmin

        /**
         *  Listeners
         */

        this.scope.$on('saveComplete', event => {
          event.stopPropagation()
          this.scope.saveIncomplete = false
        })
      } catch (error) {
        this.notification.showErrorToast(error)
        this.state.go('manager')
      }
    }

    async editNode(nodeName = 'manager') {
      try {
        const file = 'ossec.conf'
        const dir = false
        const content = !this.clusterInfo.clusterEnabled
          ? await this.fileEditor.getConfiguration(file, dir)
          : await this.fileEditor.getConfiguration(file, dir, nodeName)
        this.scope.editingNode = nodeName
        this.scope.fetchedXML = content
        this.scope.$broadcast('fetchedFile', { data: content })
        this.scope.$applyAsync()
      } catch (error) {
        this.notification.showErrorToast(`Error editing node: ${error}`)
      }
    }

    changeNode(node) {
      this.editNode(node)
    }

    saveOssecConfig() {
      const node =
        this.scope.editingNode === 'manager' ? false : this.scope.editingNode
      this.scope.saveIncomplete = true
      this.scope.$broadcast('saveXmlFile', {
        file: 'ossec.conf',
        dir: false,
        node: node,
        overwrite: true
      })
    }

    xmlIsValid(valid) {
      this.scope.xmlHasErrors = valid
      this.scope.$applyAsync()
    }

    async restart(node = false) {
      try {
        this.scope.$broadcast('removeRestartMsg', {})

        this.scope.restartInProgress = true
        let result = ''
        if (this.clusterInfo.clusterEnabled && node) {
          result = await this.restartService.restartNode(node)
        } else {
          result = await this.restartService.restart()
        }
        if (result.startsWith('Restarting cluster')) {
          this.rootScope.$broadcast('showHeadToaster', {
            type: 'info',
            msg: result,
            delay: true,
            spinner: false
          })
        } else {
          this.rootScope.$broadcast('wazuhNotReadyYet', { msg: result })
        }
        //this.notification.showSimpleToast(result)
        this.scope.restartInProgress = false
      } catch (error) {
        this.rootScope.$broadcast('showHeadToaster', {
          type: 'error',
          msg: error || `Cannot restart.`,
          delay: false,
          spinner: false
        })
        //this.notification.showErrorToast(error)
        this.scope.restartInProgress = false
      }
    }

    switchRestart() {
      this.scope.confirmingRestart = !this.scope.confirmingRestart
      this.scope.$applyAsync()
    }
  }

  controllers.controller('editionCtrl', Edition)
})
