/**
 * @author Hana Lee
 * @since 2016-05-03 21:23
 */

(function () {
  'use strict';

  angular.module('translate-chat').config(config);

  config.$inject = ['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider'];

  /* @ngInject */
  function config ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    console.log('config');
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

    if (localStorage.getItem('translate-chat-user-name')) {
      $urlRouterProvider.otherwise('/tab/friends');
    } else {
      $urlRouterProvider.otherwise('/user-name');
    }
  }
})();
