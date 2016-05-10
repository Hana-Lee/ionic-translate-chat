/**
 * @author Hana Lee
 * @since 2016-04-23 21:06
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .controller('AccountCtrl', AccountController);

  AccountController.$inject = [
    '$scope', '$state', '$ionicTabsDelegate', '$ionicPopup', 'UserService'
  ];

  function AccountController($scope, $state, $ionicTabsDelegate, $ionicPopup, UserService) {
    $scope.user = UserService.get();
    $scope.settings = {
    };

    $scope.$on('$ionicView.enter', onEnter);
    $scope.$on('$ionicView.beforeEnter', onBeforeEnter);

    $scope.showDeleteConfirm = showDeleteConfirm;

    function onEnter() {
      console.log('account view enter');
    }

    function onBeforeEnter() {
      $ionicTabsDelegate.showBar(true);
    }

    function showDeleteConfirm() {
      var options = {
        title : '삭제 경고!!',
        template : '로컬 데이터를 정말 삭제 하시겠습니까?'
      };
      var confirmPopup = $ionicPopup.confirm(options);
      confirmPopup.then(function (res) {
        if (res) {
          resetLocalData();
        }
      });
    }

    function resetLocalData() {
      localStorage.clear();
      console.info('local storage data clear complete');
      $state.go('user-name');
    }
  }
})();
