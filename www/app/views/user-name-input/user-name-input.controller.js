/**
 * @author Hana Lee
 * @since 2016-04-23 20:36
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .controller('UserNameInputCtrl', UserNameInputController);

  UserNameInputController.$inject = [
    '$scope', '$rootScope', '$state', 'UserService'
  ];

  function UserNameInputController($scope, $rootScope, $state, UserService) {
    ionic.Platform.ready(ready);

    $scope.$on('$ionicView.enter', onViewEnter);

    $scope.userNameInputKeyEvent = userNameInputKeyEvent;
    $scope.createUser = createUser;

    function ready() {
      UserService.retrieveAlreadyRegisteredUserByDeviceIdOnServer()
        .then(function (result) {
          if (result) {
            $rootScope.user = result;
            UserService.createUserOnLocal(result).then(function () {
              $state.go('tab.friends');
            });
          }
        }, function (error) {
          console.error('user already exist check on server error : ', error);
        });
    }

    function onViewEnter() {
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }

      console.log('user name input view enter', $rootScope.user);
    }

    function userNameInputKeyEvent(event) {
      if (event.keyCode === 13) {
        $scope.createUser();
      }
    }

    function createUser() {
      UserService.createUserOnServer($rootScope.user)
        .then(function (result) {
          UserService.createUserOnLocal(result)
            .then(function (result) {
              $rootScope.user = result;
              $state.go('tab.friends');
            }, function (error) {
              console.error('create user on local error : ', error);
            });
        }, function (error) {
          console.error('create user on server error : ', error);
        });
    }
  }
})();
