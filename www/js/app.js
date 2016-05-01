/**
 * @author Hana Lee
 * @since 2016-04-15 14:13
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
/*global angular, cordova, StatusBar, ionic, Ionic */

angular.module('translate-chat', [
    'ionic', 'ngCordova',
    'translate-chat.friends-controller', 'translate-chat.chats-controller', 'translate-chat.chatRooms-controller',
    'translate-chat.account-controller',
    'translate-chat.services',
    'monospaced.elastic', 'angularMoment', 'btford.socket-io', 'underscore'
  ])

  .run(function ($ionicPlatform, $rootScope, $sqliteService) {
    'use strict';

    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        window.StatusBar.styleDefault();
      }

      $rootScope.env = {
        DEVELOPMENT : true
      };

      if ($rootScope.env.DEVELOPMENT) {
        window.localStorage.clear();
      }

      $rootScope.first_run = !window.localStorage.getItem('translate-chat-device-id');

      ionic.Platform.isNativeBrowser = (!ionic.Platform.isAndroid() && !ionic.Platform.isIOS());

      function prepareDatabase() {
        $sqliteService.preloadDataBase(true).then(function (result) {
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
          "debug" : false
        });
        push.register(function (token) {
          console.log("Device token:", token.token);
          localStorage.setItem('translate-chat-device-token', token.token);
          push.saveToken(token);  // persist the token in the Ionic Platform

          prepareDatabase();
        });
      }
    });
  })

  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    'use strict';

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

    // setup an abstract state for the tabs directive
      .state('tab', {
        url : '/tab',
        abstract : true,
        templateUrl : 'templates/tabs.html'
      })

      // Each tab has its own nav history stack:
      .state('tab.friends', {
        url : '/friends',
        views : {
          'tab-users' : {
            templateUrl : 'templates/tab-friends.html',
            controller : 'FriendsCtrl'
          }
        }
      })
      .state('tab.chats', {
        url : '/chats',
        views : {
          'tab-chats' : {
            templateUrl : 'templates/tab-chats.html',
            controller : 'ChatsCtrl'
          }
        }
      })
      .state('tab.chat-room', {
        url : '/room/:chatRoomId/:backViewId',
        views : {
          'tab-chat-room' : {
            templateUrl : 'templates/chat-room.html',
            controller : 'ChatRoomsCtrl'
          }
        }
      })
      .state('tab.account', {
        url : '/account',
        views : {
          'tab-account' : {
            templateUrl : 'templates/tab-account.html',
            controller : 'AccountCtrl'
          }
        }
      });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/friends');

  });
