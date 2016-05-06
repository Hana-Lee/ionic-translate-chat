/**
 * @author Hana Lee
 * @since 2016-04-23 21:06
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .controller('AccountCtrl', AccountController);

  AccountController.$inject = ['$scope', 'UserService', '$ionicTabsDelegate'];

  function AccountController($scope, UserService, $ionicTabsDelegate) {
    $scope.user = UserService.get();
    $scope.settings = {
      enableFriends : true
    };

    $scope.$on('$ionicView.enter', onEnter);
    $scope.$on('$ionicView.beforeEnter', onBeforeEnter);

    function onEnter() {
      console.log('account view enter');
    }

    function onBeforeEnter() {
      $ionicTabsDelegate.showBar(true);
    }
  }
})();
