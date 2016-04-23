/**
 * @author Hana Lee
 * @since 2016-04-23 20:50
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
 unparam  : true,
 node     : true
 */
/*global angular, ionic, cordova, Autolinker */

angular.module('translate-chat.chatRooms-controller', [])
  .controller('ChatRoomsCtrl',
    function ($scope, $rootScope, $state, $stateParams, MockService, $ionicActionSheet, $ionicPopup,
              $ionicScrollDelegate, $timeout, $interval, Chats, $ionicTabsDelegate, Socket) {
      'use strict';

      var messageCheckTimer;

      var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
      var footerBar; // gets set in $ionicView.enter
      var scroller;
      var txtInput; // ^^^
      var keyboardHeight = 0;
      var isAndroid = ionic.Platform.isAndroid();

      $scope.chat = Chats.get($stateParams.chatId);
      $scope.messages = [];

      if (isAndroid) {
        // mock acquiring data via $stateParams
        $scope.toUser = {
          _id : '204adf928ce0ea2449d03a5d07707021',
          // pic : 'http://ionicframework.com/img/docs/venkman.jpg',
          username : '이하나'
        };

        // this could be on $rootScope rather than in $stateParams
        $scope.user = {
          _id : '6bd0303195b3ec9709149a095577e36f',
          // pic : 'http://ionicframework.com/img/docs/mcfly.jpg',
          username : '구여신'
        };
      } else {
        // this could be on $rootScope rather than in $stateParams
        $scope.toUser = {
          _id : '6bd0303195b3ec9709149a095577e36f',
          // pic : 'http://ionicframework.com/img/docs/mcfly.jpg',
          username : '구여신'
        };

        // mock acquiring data via $stateParams
        $scope.user = {
          _id : '204adf928ce0ea2449d03a5d07707021',
          // pic : 'http://ionicframework.com/img/docs/venkman.jpg',
          username : '이하나'
        };
      }

      $scope.input = {
        message : localStorage['userMessage-' + $scope.toUser._id] || ''
      };

      function keyboardPluginAvailable() {
        return window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard;
      }

      // TODO 입력 버튼 제거, 키보드의 엔터로 메세지 입력되게 변경하여 키보드 show, hide 문제 해결하기
      function keyboardShowHandler(event) {
        console.log('keyboardShowHandler');
        keyboardHeight = event.keyboardHeight;

        $rootScope.hideTabs = true;

        $timeout(function() {
          if (isAndroid) {
            scroller.style.bottom = footerBar.clientHeight + 'px';
          } else {
            scroller.style.bottom = footerBar.clientHeight + keyboardHeight + 'px';
          }
          viewScroll.scrollBottom(false);
        }, 0);
      }

      function keyboardHideHandler(/*event*/) {
        console.log('Goodnight, sweet prince');
        keyboardHeight = 0;

        $timeout(function() {
          scroller.style.bottom = footerBar.clientHeight + 'px';
          viewScroll.scrollBottom(false);
        }, 0);
      }

      function keydownHandler(event) {
        console.log('key down handler', event.keyCode);
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
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

      $scope.$on('$ionicView.beforeEnter', function () {
        $ionicTabsDelegate.showBar(false);
      });

      $scope.$on('$ionicView.enter', function () {
        console.log('UserMessages $ionicView.enter');

        Socket.emit('add user', {username : $scope.user.username});

        Socket.on('new message', function (data) {
          $scope.doneLoading = true;
          var fromUserId = $scope.toUser._id;
          if (data.username === $scope.user.username) {
            fromUserId = $scope.user._id;
          }
          $scope.messages.push({
            userId : fromUserId,
            date : new Date(),
            text : data.message
          });

          $timeout(function () {
            viewScroll.scrollBottom(false);
          }, 0);
        });

        window.addEventListener('native.keyboardshow', keyboardShowHandler);
        window.addEventListener('native.keyboardhide', keyboardHideHandler);

        if (keyboardPluginAvailable()) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);
        }

        // getMessages();

        $timeout(function () {
          footerBar = document.body.querySelector('#userMessagesView .bar-footer');
          scroller = document.body.querySelector('#userMessagesView .scroll-content');
          txtInput = angular.element(footerBar.querySelector('textarea'));

          txtInput.on('keydown', keydownHandler);
        }, 0);

        messageCheckTimer = $interval(function () {
          // here you could check for new messages if your app doesn't use push notifications or user disabled them
        }, 20000);
      });

      $scope.$on('$ionicView.leave', function () {
        console.log('leaving UserMessages view, destroying interval');

        window.removeEventListener('native.keyboardshow', keyboardShowHandler);
        window.removeEventListener('native.keyboardhide', keyboardHideHandler);

        if (keyboardPluginAvailable()) {
          cordova.plugins.Keyboard.disableScroll(false);
        }

        // Make sure that the interval is destroyed
        if (angular.isDefined(messageCheckTimer)) {
          $interval.cancel(messageCheckTimer);
          messageCheckTimer = undefined;
        }
      });

      $scope.$on('$ionicView.beforeLeave', function () {
        $ionicTabsDelegate.showBar(true);

        if (!$scope.input.message || $scope.input.message === '') {
          localStorage.removeItem('userMessage-' + $scope.toUser._id);
        }
      });

      function getMessages() {
        // the service is mock but you would probably pass the toUser's GUID here
        MockService.getUserMessages({
          toUserId : $scope.toUser._id
        }).then(function (data) {
          $scope.doneLoading = true;
          $scope.messages = data.messages;

          $timeout(function () {
            viewScroll.scrollBottom(false);
          }, 0);
        });
      }

      $scope.$watch('input.message', function (newValue/*, oldValue*/) {
        console.log('input.message $watch, newValue "' + newValue + '"', arguments);
        if (!newValue) {
          newValue = '';
        }
        localStorage['userMessage-' + $scope.toUser._id] = newValue;
      });

      $scope.sendMessage = function (/*sendMessageForm*/) {
        var message = {
          toId : $scope.toUser._id,
          text : $scope.input.message
        };

        //MockService.sendMessage(message).then(function(data) {
        $scope.input.message = '';

        message._id = new Date().getTime(); // :~)
        message.date = new Date();
        message.username = $scope.user.username;
        message.userId = $scope.user._id;
        message.pic = $scope.user.picture;

        $timeout(function () {
          $scope.messages.push(message);
          viewScroll.scrollBottom(true);

          Socket.emit('new message', message.text);
        }, 500);

        // $timeout(function () {
        //   $scope.messages.push(MockService.getMockMessage());
        //   viewScroll.scrollBottom(true);
        // }, 2000);

        //});
      };

      $scope.onMessageHold = function (event, itemIndex, message) {
        event.preventDefault();

        console.log('onMessageHold');
        console.log('message: ' + JSON.stringify(message, null, 2));
        $ionicActionSheet.show({
          buttons : [{
            text : 'Copy Text'
          }, {
            text : 'Delete Message'
          }],
          buttonClicked : function (index) {
            switch (index) {
              case 0: // Copy Text
                //cordova.plugins.clipboard.copy(message.text);

                break;
              case 1: // Delete
                // no server side secrets here :~)
                $scope.messages.splice(itemIndex, 1);
                $timeout(function () {
                  viewScroll.resize();
                }, 0);

                break;
            }

            return true;
          }
        });
      };

      // this prob seems weird here but I have reasons for this in my app, secret!
      $scope.viewProfile = function (msg) {
        if (msg.userId === $scope.user._id) {
          // go to your profile
        } else {
          // go to other users profile
        }
      };

      $scope.$on('elastic:resize', function(event, element, oldHeight, newHeight) {
        // do stuff
        event.preventDefault();

        console.log('elastic:resize');
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
      });
    })

  // services
  .factory('MockService', ['$http', '$q',
    function ($http, $q) {
      'use strict';
      var me = {};

      me.getUserMessages = function (d) {
        /*
         var endpoint =
         'http://www.mocky.io/v2/547cf341501c337f0c9a63fd?callback=JSON_CALLBACK';
         return $http.jsonp(endpoint).then(function(response) {
         return response.data;
         }, function(err) {
         console.log('get user messages error, err: ' + JSON.stringify(
         err, null, 2));
         });
         */
        var deferred = $q.defer();

        setTimeout(function () {
          deferred.resolve(getMockMessages());
        }, 1500);

        return deferred.promise;
      };

      me.getMockMessage = function () {
        return {
          userId : '534b8e5aaa5e7afc1b23e69b',
          date : new Date(),
          text : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
        };
      };

      return me;
    }
  ])

  // fitlers
  .filter('nl2br', ['$filter',
    function ($filter) {
      'use strict';
      return function (data) {
        if (!data) {
          return data;
        }
        return data.replace(/\n\r?/g, '<br />');
      };
    }
  ])

  // directives
  .directive('autolinker', ['$timeout',
    function ($timeout) {
      'use strict';
      return {
        restrict : 'A',
        link : function (scope, element, attrs) {
          $timeout(function () {
            var eleHtml = element.html();

            if (eleHtml === '') {
              return false;
            }

            var text = Autolinker.link(eleHtml, {
              className : 'autolinker',
              newWindow : false
            });

            element.html(text);

            var autolinks = element[0].getElementsByClassName('autolinker');

            for (var i = 0; i < autolinks.length; i++) {
              angular.element(autolinks[i]).bind('click', function (e) {
                var href = e.target.href;
                console.log('autolinkClick, href: ' + href);

                if (href) {
                  //window.open(href, '_system');
                  window.open(href, '_blank');
                }

                e.preventDefault();
                return false;
              });
            }
          }, 0);
        }
      }
    }
  ]);

function getMockMessages() {
  return {
    "messages" : [{
      "_id" : "535d625f898df4e80e2a125e",
      "text" : "Ionic has changed the game for hybrid app development.",
      "userId" : "534b8fb2aa5e7afc1b23e69c",
      "date" : "2014-04-27T20:02:39.082Z",
      "read" : true,
      "readDate" : "2014-12-01T06:27:37.944Z"
    }, {
      "_id" : "535f13ffee3b2a68112b9fc0",
      "text" : "I like Ionic better than ice cream!",
      "userId" : "534b8e5aaa5e7afc1b23e69b",
      "date" : "2014-04-29T02:52:47.706Z",
      "read" : true,
      "readDate" : "2014-12-01T06:27:37.944Z"
    }, {
      "_id" : "546a5843fd4c5d581efa263a",
      "text" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      "userId" : "534b8fb2aa5e7afc1b23e69c",
      "date" : "2014-11-17T20:19:15.289Z",
      "read" : true,
      "readDate" : "2014-12-01T06:27:38.328Z"
    }, {
      "_id" : "54764399ab43d1d4113abfd1",
      "text" : "Am I dreaming?",
      "userId" : "534b8e5aaa5e7afc1b23e69b",
      "date" : "2014-11-26T21:18:17.591Z",
      "read" : true,
      "readDate" : "2014-12-01T06:27:38.337Z"
    }, {
      "_id" : "547643aeab43d1d4113abfd2",
      "text" : "Is this magic?",
      "userId" : "534b8fb2aa5e7afc1b23e69c",
      "date" : "2014-11-26T21:18:38.549Z",
      "read" : true,
      "readDate" : "2014-12-01T06:27:38.338Z"
    }, {
      "_id" : "547815dbab43d1d4113abfef",
      "text" : "Gee wiz, this is something special.",
      "userId" : "534b8e5aaa5e7afc1b23e69b",
      "date" : "2014-11-28T06:27:40.001Z",
      "read" : true,
      "readDate" : "2014-12-01T06:27:38.338Z"
    }, {
      "_id" : "54781c69ab43d1d4113abff0",
      "text" : "I think I like Ionic more than I like ice cream!",
      "userId" : "534b8fb2aa5e7afc1b23e69c",
      "date" : "2014-11-28T06:55:37.350Z",
      "read" : true,
      "readDate" : "2014-12-01T06:27:38.338Z"
    }, {
      "_id" : "54781ca4ab43d1d4113abff1",
      "text" : "Yea, it's pretty sweet",
      "userId" : "534b8e5aaa5e7afc1b23e69b",
      "date" : "2014-11-28T06:56:36.472Z",
      "read" : true,
      "readDate" : "2014-12-01T06:27:38.338Z"
    }, {
      "_id" : "5478df86ab43d1d4113abff4",
      "text" : "Wow, this is really something huh?",
      "userId" : "534b8fb2aa5e7afc1b23e69c",
      "date" : "2014-11-28T20:48:06.572Z",
      "read" : true,
      "readDate" : "2014-12-01T06:27:38.339Z"
    }, {
      "_id" : "54781ca4ab43d1d4113abff1",
      "text" : "Create amazing apps - ionicframework.com",
      "userId" : "534b8e5aaa5e7afc1b23e69b",
      "date" : "2014-11-29T06:56:36.472Z",
      "read" : true,
      "readDate" : "2014-12-01T06:27:38.338Z"
    }], "unread" : 0
  };
}
