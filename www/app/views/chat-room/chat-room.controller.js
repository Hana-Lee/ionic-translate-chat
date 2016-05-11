/**
 * @author Hana Lee
 * @since 2016-04-23 20:50
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .controller('ChatRoomCtrl', ChatRoomController);

  ChatRoomController.$inject = [
    '$scope', '$rootScope', '$state', '$stateParams', '$ionicActionSheet',
    '$cordovaToast', '$ionicScrollDelegate', '$ionicModal', '$ionicTabsDelegate',
    '$ionicHistory',
    'ChatService', 'MessageService', 'UserService',
    '_', 'SettingService', 'ImageService', 'CONFIG'
  ];

  function ChatRoomController($scope, $rootScope, $state, $stateParams, $ionicActionSheet,
                              $cordovaToast, $ionicScrollDelegate, $ionicModal, $ionicTabsDelegate,
                              $ionicHistory,
                              ChatService, MessageService, UserService,
                              _, SettingService, ImageService, CONFIG) {
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    var footerBar;
    var scroller;
    var txtInput;
    var keyboardHeight = 0;
    var isAndroid = ionic.Platform.isAndroid();
    var chatRoomId = $stateParams.chatRoomId;
    var backViewId = $stateParams.backViewId;
    var reJoin = $stateParams.reJoin;

    UserService.updateOnlineState(true);

    $ionicModal.fromTemplateUrl('app/views/chat-room/modal/show-image-modal.html', {
      scope : $scope,
      animation : 'slide-in-up'
    }).then(function (modal) {
      $scope.showPictureModal = modal;
    });

    $ionicModal.fromTemplateUrl('app/views/chat-room/modal/chat-room-setting.html', {
      scope : $scope,
      animation : 'slide-in-up'
    }).then(function (modal) {
      $scope.settingModal = modal;
    });

    $scope.$on('$ionicView.beforeEnter', onBeforeEnter);
    $scope.$on('$ionicView.enter', onEnter);
    $scope.$on('$ionicView.beforeLeave', onBeforeLeave);
    $scope.$on('$ionicView.leave', onLeave);
    $scope.$on('elastic:resize', onInputFormResize);

    /** @prop {File} $scope.imageFile */
    $scope.showPictureSrc = null;
    $scope.showPicture = showPicture;
    $scope.hidePicture = hidePicture;
    $scope.retrievePicture = getPicture;
    $scope.translateSettingChange = updateSettings;
    $scope.showSetting = showSetting;
    $scope.hideSetting = hideSetting;
    $scope.sendMessage = sendMessage;
    $scope.onMessageHold = onMessageHold;
    $scope.playAudio = playAudio;

    $scope.imageUploadUrl = CONFIG.serverUrl + ':' + CONFIG.serverPort + '/api/image';

    $scope.messages = [];
    $scope.user = UserService.get();
    $scope.toUser = ChatService.getToUserByChatRoomId(chatRoomId);

    $scope.input = {
      message : ''
    };

    $scope.settingsList = [];

    if (reJoin === 'true') {
      ChatService.joinChatRoom($scope.user, $scope.toUser, chatRoomId);
    }

    SettingService.getSettingsList({
      user_id : $scope.user.user_id,
      chat_room_id : chatRoomId
    }).then(function (result) {
      console.debug('get setting list result : ', result);
      result.forEach(function (setting) {
        var type = setting.setting_type;
        var value;
        if (type.toLowerCase() === 'boolean') {
          value = (setting.setting_value === '1');
        } else {
          value = setting.setting_value;
        }
        $scope.settingsList.push({
          key : setting.setting_key,
          text : setting.setting_name,
          value : value, type : type
        });
      });
    }, function (error) {
      console.error('get settings list error : ', error);
    });

    MessageService.registerNewMessageCallback(onNewMessage);

    function keyboardPluginAvailable() {
      return window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard;
    }

    function getMessages() {
      MessageService.getUserMessages(chatRoomId).then(function (data) {
        $scope.doneLoading = true;
        $scope.messages = data;

        setTimeout(function () {
          viewScroll.scrollBottom(false);
        }, 0);
      }, function (error) {
        console.error('get user messages error : ', error);
      });
    }

    function onBeforeEnter(event, viewData) {
      console.debug('on before enter event : ', event);

      $ionicTabsDelegate.showBar(false);
      viewData.enableBack = true;
      var currentViewStateName = $ionicHistory.viewHistory().currentView.stateName;
      var backView = _.find($ionicHistory.viewHistory().views, function (view) {
        return view.viewId === backViewId;
      });

      if (backView && (currentViewStateName !== backView.stateName)) {
        $ionicHistory.backView(backView);
      } else {
        $rootScope.$ionicGoBack = function () {
          $state.go('tab.friends');
        };
      }
    }

    function onEnter() {
      window.addEventListener('native.keyboardshow', onKeyboardShow);
      window.addEventListener('native.keyboardhide', onKeyboardHide);

      if (keyboardPluginAvailable()) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }

      getMessages();

      setTimeout(function () {
        footerBar = document.body.querySelector('#userMessagesView .bar-footer');
        scroller = document.body.querySelector('#userMessagesView .scroll-content');
        txtInput = angular.element(footerBar.querySelector('textarea'));

        txtInput.on('keydown', onKeydown);
      }, 0);
    }

    function onLeave() {
      console.debug('leaving UserMessages view, destroying interval');

      window.removeEventListener('native.keyboardshow', onKeyboardShow);
      window.removeEventListener('native.keyboardhide', onKeyboardHide);

      if (keyboardPluginAvailable()) {
        cordova.plugins.Keyboard.disableScroll(false);
      }

      UserService.updateOnlineState(false);
      MessageService.removeNewMessageCallback(onNewMessage);
    }

    function onBeforeLeave() {
      $ionicTabsDelegate.showBar(true);
    }

    function showPicture(message) {
      $scope.showPictureSrc = $scope.imageUploadUrl + '/' + message.text;
      $scope.showPictureModal.show();
    }

    function hidePicture() {
      $scope.showPictureModal.hide();
      $scope.showPictureSrc = null;
    }

    function getPicture(event) {
      event.preventDefault();

      if (ionic.Platform.isNativeBrowser) {
        var fileButton = document.querySelector('#image-file-picker');
        angular.element(fileButton).bind('change', function () {
          var imageFile = $scope.imageFile;
          uploadImage(imageFile);
        });
        fileButton.click();
      } else {
        ImageService.loadPicture().then(function (imageFile) {
          uploadImage(imageFile);
        });
      }
    }

    function uploadImage(imageFile) {
      ImageService.uploadImageFileToUrl(imageFile, $scope.imageUploadUrl)
        .then(function (imageFileName) {
          sendMessage(imageFileName, 'image');
        }, function (error) {
          console.error('upload image file to url error : ', error);
        });
    }

    function updateSettings() {
      var params = {
        settings : $scope.settingsList,
        user : $scope.user,
        chat_room_id : chatRoomId
      };

      console.info('update settings : ', params);
      SettingService.updateSettings(params).then(function () {
        if (!ionic.Platform.isNativeBrowser) {
          $cordovaToast.show('변경 완료', 'long', 'bottom');
        }
      });
    }

    function showSetting() {
      $scope.settingModal.show();
    }

    function hideSetting() {
      $scope.settingModal.hide();
    }
    
    function playAudio() {
      
    }

    function sendMessage(text, type) {
      var options = {
        chat_room_id : chatRoomId,
        type : type || 'text',
        text : text || $scope.input.message,
        user : $scope.user,
        to_user : $scope.toUser
      };
      console.debug('send new message : ', options);
      MessageService.sendMessage(options);
      $scope.input.message = '';
    }

    function onNewMessage(data) {
      $scope.doneLoading = true;
      if (data.error) {
        console.error('new message receive error : ', data);
      } else {
        var fromUserId = $scope.toUser.user_id;
        if (data.result.user_name === $scope.user.user_name) {
          fromUserId = $scope.user.user_id;
        }

        $scope.messages.push({
          user_id : fromUserId,
          created : new Date(),
          text : data.result.text,
          type : data.result.type
        });

        ChatService.updateLastText(chatRoomId, data.result.text);

        setTimeout(function () {
          viewScroll.scrollBottom(false);
        }, 0);
      }
    }

    function onKeyboardShow(event) {
      keyboardHeight = event.keyboardHeight;

      setTimeout(function () {
        if (isAndroid) {
          scroller.style.bottom = footerBar.clientHeight + 'px';
        } else {
          scroller.style.bottom = footerBar.clientHeight + keyboardHeight + 'px';
        }
        viewScroll.scrollBottom(false);
      }, 0);
    }

    function onKeyboardHide() {
      keyboardHeight = 0;

      setTimeout(function () {
        scroller.style.bottom = footerBar.clientHeight + 'px';
        viewScroll.scrollBottom(false);
      }, 0);
    }

    function onKeydown(event) {
      if (keyboardPluginAvailable()) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();

        if (txtInput.val().replace(/\s+/g, '') !== '') {
          $scope.sendMessage();
        } else {
          txtInput.val('');
        }
      }
    }

    function onMessageHold(event, itemIndex, message) {
      event.preventDefault();

      console.info('on message hold item index : ', itemIndex);

      console.debug('onMessageHold');
      console.debug('message: ' + JSON.stringify(message, null, 2));
      $ionicActionSheet.show({
        buttons : [{
          text : 'Copy Text'
        }],
        buttonClicked : function (index) {
          switch (index) {
            case 0:
              cordova.plugins.clipboard.copy(message.text);
              break;
          }

          return true;
        }
      });
    }

    function onInputFormResize(event, element, oldHeight, newHeight) {
      event.preventDefault();

      console.debug('input form resizer old height : ', oldHeight);
      console.debug('input form resizer new height : ', newHeight);

      if (!element) {
        return;
      }

      if (!footerBar) {
        return;
      }

      var newFooterHeight = newHeight + 10;
      newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;

      footerBar.style.height = newFooterHeight + 'px';

      if (isAndroid) {
        scroller.style.bottom = newFooterHeight + 'px';
      } else {
        scroller.style.bottom = newFooterHeight + keyboardHeight + 'px';
      }

      setTimeout(function () {
        viewScroll.scrollBottom(true);
      }, 50);
    }
  }
})();
