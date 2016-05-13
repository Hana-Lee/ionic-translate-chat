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
    '$scope', '$state', '$ionicTabsDelegate', '$ionicPopup', 'UserService', 'ImageService'
  ];

  function AccountController($scope, $state, $ionicTabsDelegate, $ionicPopup, UserService, ImageService) {
    $scope.user = UserService.get();
    $scope.settings = {};
    $scope.userNameViewOnly = true;
    var imageUploadUrl = ImageService.getServerUrl();
    $scope.userFaceUrl = '';

    $scope.$on('$ionicView.enter', onEnter);
    $scope.$on('$ionicView.beforeEnter', onBeforeEnter);

    $scope.showUserFace = showUserFace;
    $scope.showDeleteConfirm = showDeleteConfirm;
    $scope.editUserName = editUserName;
    $scope.updateUserName = updateUserName;
    $scope.changeUserFace = changeUserFace;

    function onEnter() {
      console.log('account view enter');
    }

    function onBeforeEnter() {
      $ionicTabsDelegate.showBar(true);
      _changeUserFaceValue();
    }

    function showUserFace() {

    }

    function editUserName() {
      $scope.userNameViewOnly = false;
    }

    function updateUserName() {
      $scope.userNameViewOnly = true;
      UserService.updateUserName($scope.user);
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

    function changeUserFace(event) {
      event.preventDefault();

      if (ionic.Platform.isNativeBrowser) {
        var fileButton = document.querySelector('#image-file-picker');
        angular.element(fileButton).bind('change', function () {
          var imageFile = $scope.imageFile;
          _uploadImage(imageFile);
        });
        fileButton.click();
      } else {
        ImageService.loadPicture().then(function (imageFile) {
          _uploadImage(imageFile);
        });
      }
    }

    function _uploadImage(imageFile) {
      var isNativeBrowser = ionic.Platform.isNativeBrowser;

      ImageService.uploadImageFileToUrl(imageFile, isNativeBrowser)
        .then(function (imageFileName) {
          console.info('upload user face complete : ', imageFileName);
          $scope.user.user_face = imageFileName;
          _changeUserFaceValue();
          UserService.updateUserFace($scope.user);
        }, function (error) {
          console.error('upload image file to url error : ', error);
        });
    }

    function _changeUserFaceValue() {
      var userFace = $scope.user.user_face;
      $scope.userFaceUrl = (userFace === 'assets/img/sarah.png') ? userFace : imageUploadUrl + '/' + userFace;
    }
  }
})();
