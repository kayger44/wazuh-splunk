/*
 * Wazuh app - Fetch png from visualization div
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

define(['../module', 'domToImg'], function(app, domToImg) {
  'use strict'
  class Vis2PNG {
    constructor($rootScope, $currentDataService) {
      this.$rootScope = $rootScope
      this.rawArray = []
      this.htmlObject = {}
      this.working = false
      this.currentDataService = $currentDataService
    }

    async checkArray(tab, visArray, sectionTitle, filters) {
      try {
        this.working = true
        const len = visArray.length
        let currentCompleted = 0
        const timeRange = document.getElementById('timePicker').getElementsByTagName('span')[1].innerHTML
        await Promise.all(
          visArray.map(async currentValue => {
            const tmpNode = this.htmlObject[currentValue]
            const title = document.getElementById(currentValue).parentElement.getElementsByTagName('span')[0].innerHTML
            try {
              const tmpResult = await domToImg.toPng(tmpNode[0])
              this.rawArray.push({
                element: tmpResult,
                width: tmpNode.width(),
                height: tmpNode.height(),
                id: currentValue,
                title: title,
                sectionTitle: sectionTitle,
                filters: filters,
                timeRange: timeRange,
                pdfName: tab
              })
            } catch (error) {
              console.error('error converting ', error)
            } // eslint-disable-line
            currentCompleted++
            this.$rootScope.reportStatus = `Generating report...${Math.round(
              (currentCompleted / len) * 100
            )}%`
            if (!this.$rootScope.$$phase) this.$rootScope.$digest()
          })
        )
        this.working = false
        this.$rootScope.reportStatus = `Generating PDF document...`
        return this.rawArray
      } catch (error) {
        this.working = false
        return Promise.reject(error)
      }
    }

    isWorking() {
      return this.working
    }

    clear() {
      this.rawArray = []
      this.htmlObject = {}
    }

    assignHTMLItem(id, content) {
      this.htmlObject[id] = content
    }
  }
  app.service('vis2png', Vis2PNG)
})
