/**
 * @author Hana Lee
 * @since 2016-04-15 14:13
 */

/*globals Ionic */
(function () {
  'use strict';
  angular.module('translate-chat',
    [
      'ionic', 'ngCordova', 'btford.socket-io',
      'monospaced.elastic', 'angularMoment', 'underscore', 'angular-md5'
    ])
    .run(run).config(config);

  run.$inject = [
    '$ionicPlatform', '$state', '$ionicHistory',
    'ChatService', 'UserService', 'DeviceService'
  ];

  function run($ionicPlatform, $state, $ionicHistory,
               ChatService, UserService, DeviceService) {
    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        window.StatusBar.styleDefault();
      }

      /** @prop {Function} isIOS */
      var ionicPlatform = ionic.Platform;
      ionic.Platform.isNativeBrowser = (!ionicPlatform.isAndroid() && !ionicPlatform.isIOS());

      if (!ionic.Platform.isNativeBrowser) {
        var push = new Ionic.Push({
          debug : false,
          onNotification : function (data) {
            console.log('on notification', data);
            var payload = data.payload;
            var chatRoomId = payload.chat_room_id;
            if ($state.current.name !== 'tab.chat-room') {
              var user = UserService.get();
              var friend = ChatService.getToUserByChatRoomId(chatRoomId);
              ChatService.joinChatRoom(user, friend, chatRoomId).then(function () {
                /** @prop {Function} viewHistory */
                var viewId = $ionicHistory.viewHistory().currentView.viewId;
                $state.go('tab.chat-room', {chatRoomId : chatRoomId, backViewId : viewId});
              }, function (error) {
                console.error('join chat room error : ', error);
              });
            }
          }
        });
        push.register(function (token) {
          console.log('Device token : ', token.token);
          DeviceService.setToken(token.token);
          push.saveToken(token);
        });

        document.addEventListener('resume', function () {
          console.log('app resume state');
          UserService.updateOnlineState(true);
        });

        document.addEventListener('pause', function () {
          console.log('app pause state');
          UserService.updateOnlineState(false);
        });
      }
    });
  }

  config.$inject = [
    '$stateProvider', '$urlRouterProvider', '$ionicConfigProvider', 'STORAGE_KEYS'
  ];

  function config($stateProvider, $urlRouterProvider, $ionicConfigProvider, STORAGE_KEYS) {
    if (ionic.Platform.isIOS()) {
      $ionicConfigProvider.scrolling.jsScrolling(true);
    }

    $ionicConfigProvider.tabs.position('bottom');
    $ionicConfigProvider.navBar.alignTitle('center');

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider
      .state('user-name', {
        url : '/user-name',
        templateUrl : 'app/views/user-name-input/user-name-input.html',
        controller : 'UserNameInputCtrl'
      })
      // setup an abstract state for the tabs directive
      .state('tab', {
        url : '/tab',
        abstract : true,
        templateUrl : 'app/views/tabs.html'
      })

      // Each tab has its own nav history stack:
      .state('tab.friends', {
        url : '/friends',
        views : {
          'tab-users' : {
            templateUrl : 'app/views/friend-list/tab-friends.html',
            controller : 'FriendListCtrl'
          }
        }
      })
      .state('tab.chats', {
        url : '/chats',
        views : {
          'tab-chats' : {
            templateUrl : 'app/views/chat-list/tab-chats.html',
            controller : 'ChatsCtrl'
          }
        }
      })
      .state('tab.chat-room', {
        url : '/room/:chatRoomId/:backViewId',
        views : {
          'tab-chat-room' : {
            templateUrl : 'app/views/chat-room/chat-room.html',
            controller : 'ChatRoomsCtrl'
          }
        }
      })
      .state('tab.account', {
        url : '/account',
        views : {
          'tab-account' : {
            templateUrl : 'app/views/account-setting/tab-account.html',
            controller : 'AccountCtrl'
          }
        }
      });

    if (localStorage.getItem(STORAGE_KEYS.USER)) {
      $urlRouterProvider.otherwise('/tab/friends');
    } else {
      $urlRouterProvider.otherwise('/user-name');
    }
  }
})();
