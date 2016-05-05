/**
 * @author Hana Lee
 * @since 2016-05-03 21:22
 */

/*globals Ionic */
(function () {
  'use strict';

  angular.module('translate-chat').run(run);

  run.$inject = ['$ionicPlatform', '$rootScope', 'SqliteService', '$state', 'SocketService',
    'ChatService', 'UserService', '$ionicHistory'];

  /* @ngInject */
  function run($ionicPlatform, $rootScope, SqliteService, $state, SocketService,
               ChatService, UserService, $ionicHistory) {
    $ionicPlatform.ready(function () {
      console.log('ready');
      if (!$rootScope.user || !$rootScope.user.user_name) {
        $rootScope.user = {};
      }
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        window.StatusBar.styleDefault();
      }

      $rootScope.env = {
        DEVELOPMENT : false
      };

      if ($rootScope.env.DEVELOPMENT) {
        window.localStorage.clear();
      }

      /** @prop {Function} isIOS */
      var ionicPlatform = ionic.Platform;
      ionic.Platform.isNativeBrowser = (!ionicPlatform.isAndroid() && !ionicPlatform.isIOS());

      function prepareDatabase() {
        SqliteService.preloadDataBase(true).then(function (result) {
          console.log('preload database done', JSON.stringify(result));
          $rootScope.$emit('DB_ready');
        }, function (error) {
          console.error('preload database error', JSON.stringify(error));
        });
      }

      if (ionic.Platform.isNativeBrowser) {
        prepareDatabase();
      } else {
        var push = new Ionic.Push({
          debug : false,
          onNotification : function (data) {
            console.log('on notification', data);
            var payload = data.payload;
            var chatRoomId = payload.chat_room_id;
            if ($state.current.name !== 'tab.chat-room') {
              UserService.get().then(function (user) {
                ChatService.getToUser({user_id : user.user_id, chat_room_id : chatRoomId}).then(function (friend) {
                  ChatService.join(chatRoomId, user, friend).then(function () {
                    var viewId = $ionicHistory.viewHistory().currentView.viewId;
                    $state.go('tab.chat-room', {chatRoomId : chatRoomId, backViewId : viewId});
                  }, function (error) {
                    console.log('joining chat room error : ', JSON.stringify(error));
                  });
                }, function (error) {
                  console.error('get to user(friend) error : ', error);
                });
              }, function (error) {
                console.error('get user by user service error : ', error);
              });
            }
          }
        });
        push.register(function (token) {
          console.log('Device token : ', token.token);
          localStorage.setItem('translate-chat-device-token', token.token);
          push.saveToken(token);  // persist the token in the Ionic Platform

          prepareDatabase();
        });
      }

      document.addEventListener('resume', function () {
        console.log('app resume state');
        var params = {
          user_id : $rootScope.user_id,
          online : 1
        };
        SocketService.emit('updateUserOnlineState', params);
      });

      document.addEventListener('pause', function () {
        console.log('app pause state');
        var params = {
          user_id : $rootScope.user_id,
          online : 0
        };
        SocketService.emit('updateUserOnlineState', params);
      });
    });
  }
})();
