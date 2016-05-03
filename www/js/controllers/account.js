/**
 * @author Hana Lee
 * @since 2016-04-23 21:06
 */

angular.module('translate-chat.account-controller', [])
  .controller('AccountCtrl', function ($rootScope, $scope, UserService, $ionicTabsDelegate) {
    'use strict';

    $scope.user = {};

    $scope.$on('$ionicView.enter', function () {
      console.log('account view enter');
      if (!$scope.user.user_name) {
        UserService.get().then(function (result) {
          $scope.user = result;
        });
      }
    });

    $scope.$on('$ionicView.beforeEnter', function () {
      $ionicTabsDelegate.showBar(true);
    });

    console.log('user information : ', $scope.user);

    $scope.settings = {
      enableFriends : true
    };
  });
