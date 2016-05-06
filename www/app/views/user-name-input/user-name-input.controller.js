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
    '$scope', '$state', 'UserService'
  ];

  function UserNameInputController($scope, $state, UserService) {
    $scope.userNameInputKeyEvent = userNameInputKeyEvent;
    $scope.createUser = createUser;
    $scope.user = {};

    function userNameInputKeyEvent(event) {
      if (event.keyCode === 13) {
        var userName = $scope.user.user_name;
        if (userName && userName.replace(/\s/g, '').length > 0) {
          createUser();
        }
      }
    }

    function createUser() {
      UserService.createUser($scope.user).then(
        function () {
          $state.go('tab.friends');
        }, function (error) {
          console.error('create user on local error : ', error);
        }
      );
    }
  }
})();
