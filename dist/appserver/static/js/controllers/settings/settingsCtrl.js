'use strict';

define(['../module'], function (controllers) {
  'use strict';

  controllers.controller('settingsCtrl', function ($scope, $navigationService) {
    $scope.message = 'Settings';
    $scope.tabName = '';
    $navigationService.hello();
    var lastState = $navigationService.getLastState();
    console.log('laststate ', lastState);
    switch (lastState) {
      case 'settings.api':
        $scope.tabName = 'api';
        break;
      case 'settings.index':
        $scope.tabName = 'index';
        break;
      case 'settings.about':
        $scope.tabName = 'about';
        break;
    }

    $scope.switchTab = function (name) {
      $scope.tabName = name;
    };
  });
});