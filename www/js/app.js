/**
* @author Hana Lee
* @since 2016-04-15 14:13
*/

angular.module('translate-chat', [
    'ionic', 'translate-chat.controllers', 'translate-chat.services',
    'monospaced.elastic', 'angularMoment', 'btford.socket-io'
  ])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })

  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

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
      .state('tab.users', {
        url : '/users',
        views : {
          'tab-users' : {
            templateUrl : 'templates/tab-users.html',
            controller : 'DashCtrl'
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
      .state('tab.chat-detail', {
        url : '/chats/:chatId',
        views : {
          'tab-chats' : {
            templateUrl : 'templates/chat-detail.html',
            controller : 'ChatDetailCtrl'
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
    $urlRouterProvider.otherwise('/tab/users');

  });
