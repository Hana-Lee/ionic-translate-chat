/**
 * @author Hana Lee
 * @since 2016-04-23 20:36
 */
/*jslint
 browser  : true,
 continue : true,
 devel    : true,
 indent   : 2,
 maxerr   : 50,
 nomen    : true,
 plusplus : true,
 regexp   : true,
 vars     : true,
 white    : true,
 todo     : true,
 node     : true
 */
/*global angular */
angular.module('translate-chat.friend-controller', [])
  .controller('FriendsCtrl', function ($ionicPlatform, $scope, $ionicTabsDelegate, Users, $ionicModal) {
    'use strict';
    
    $scope.users = Users.all();
    $scope.remove = function (user) {
      console.log('remove user', user);
    };
    $scope.join = function (user) {
      console.log('join', user);
    };

    $scope.$on('$ionicView.beforeEnter', function () {
      $ionicTabsDelegate.showBar(true);
    });

    $scope.$on('$ionicView.enter', function () {
      $ionicModal.fromTemplateUrl('templates/user-name-input.html', {
        scope : $scope,
        animation : 'slide-in-down'
      }).then(function (modal) {
        $ionicPlatform.registerBackButtonAction(function (evt) {
          evt.preventDefault();
        }, 100);
        $scope.modal = modal;
        $scope.modal.show();
      });
    });
  });
