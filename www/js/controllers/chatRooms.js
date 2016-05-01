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
    function ($scope, $rootScope, $state, $stateParams, MessageService, $ionicActionSheet,
              $ionicPopup, $ionicScrollDelegate, $timeout, $interval, Chats,
              $ionicTabsDelegate, Socket, UserService, $ionicHistory, _) {
      'use strict';

      var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
      var footerBar;
      var scroller;
      var txtInput;
      var keyboardHeight = 0;
      var isAndroid = ionic.Platform.isAndroid();
      var chatRoomId = $stateParams.chatRoomId;
      var backViewId = $stateParams.backViewId;
      var user = UserService.get();
      $scope.user = {};
      $scope.toUser = {};
      user.then(function (result) {
        $scope.user = result;
        console.log('user ', $scope.user);
        Chats.getToUser({user_id : $scope.user.user_id, chat_room_id : chatRoomId}).then(
          function (result) {
            $scope.toUser = result;
            console.log('to user', result);
          }, function (error) {
            console.error('get to user error : ', JSON.stringify(error));
          });
      });

      $scope.messages = [];

      $scope.input = {
        message : localStorage['userMessage-' + $scope.toUser.user_id] || ''
      };

      function keyboardPluginAvailable() {
        return window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard;
      }

      function keyboardShowHandler(event) {
        console.log('keyboardShowHandler');
        keyboardHeight = event.keyboardHeight;

        $rootScope.hideTabs = true;

        $timeout(function () {
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

        $timeout(function () {
          scroller.style.bottom = footerBar.clientHeight + 'px';
          viewScroll.scrollBottom(false);
        }, 0);
      }

      function keydownHandler(event) {
        console.log('key down handler', event.keyCode);
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

      function getMessages() {
        // the service is mock but you would probably pass the toUser's GUID here
        MessageService.getUserMessages(chatRoomId).then(function (data) {
          $scope.doneLoading = true;
          $scope.messages = data;

          $timeout(function () {
            viewScroll.scrollBottom(false);
          }, 0);
        }, function (error) {
          console.error('get user messages error : ', error);
        });
      }

      $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
        $ionicTabsDelegate.showBar(false);
        viewData.enableBack = true;
        var currentViewStateName = $ionicHistory.viewHistory().currentView.stateName;
        var backView = _.find($ionicHistory.viewHistory().views, function (view) {
          return view.viewId === backViewId;
        });
        console.log('back view ', backView);
        if (backView && (currentViewStateName !== backView.stateName)) {
          $ionicHistory.backView(backView);
        } else {
          $rootScope.$ionicGoBack = function () {
            $state.go('tab.friends');
          };
        }
      });

      $scope.$on('$ionicView.enter', function () {
        console.log('ChatRooms $ionicView.enter');

        Socket.on('new_message', function (data) {
          $scope.doneLoading = true;
          if (data.error) {
            console.error('new message receive error : ', data.error);
          } else {
            var fromUserId = $scope.toUser.user_id;
            if (data.result.user_name === $scope.user.user_name) {
              fromUserId = $scope.user.user_id;
            }

            $scope.messages.push({
              user_id : fromUserId,
              date : new Date(),
              text : data.result.text,
              type : data.result.type
            });

            $timeout(function () {
              viewScroll.scrollBottom(false);
            }, 0);
          }
        });

        window.addEventListener('native.keyboardshow', keyboardShowHandler);
        window.addEventListener('native.keyboardhide', keyboardHideHandler);

        if (keyboardPluginAvailable()) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);
        }

        getMessages();

        $timeout(function () {
          footerBar = document.body.querySelector('#userMessagesView .bar-footer');
          scroller = document.body.querySelector('#userMessagesView .scroll-content');
          txtInput = angular.element(footerBar.querySelector('textarea'));

          txtInput.on('keydown', keydownHandler);
        }, 0);
      });

      $scope.$on('$ionicView.leave', function () {
        console.log('leaving UserMessages view, destroying interval');

        window.removeEventListener('native.keyboardshow', keyboardShowHandler);
        window.removeEventListener('native.keyboardhide', keyboardHideHandler);

        if (keyboardPluginAvailable()) {
          cordova.plugins.Keyboard.disableScroll(false);
        }
      });

      $scope.$on('$ionicView.beforeLeave', function () {
        $ionicTabsDelegate.showBar(true);

        if (!$scope.input.message || $scope.input.message === '') {
          localStorage.removeItem('userMessage-' + $scope.toUser.user_id);
        }
      });

      $scope.$watch('input.message', function (newValue/*, oldValue*/) {
        console.log('input.message $watch, newValue "' + newValue + '"', arguments);
        if (!newValue) {
          newValue = '';
        }
        localStorage['userMessage-' + $scope.toUser.user_id] = newValue;
      });

      $scope.sendMessage = function (/*sendMessageForm*/) {
        var message = {
          toId : $scope.toUser.user_id,
          text : $scope.input.message
        };

        $scope.input.message = '';

        message.user_id = $scope.user.user_id;
        message.date = new Date();
        message.user_name = $scope.user.user_name;
        message.pic = $scope.user.user_face;

        $timeout(function () {
          $scope.messages.push(message);
          viewScroll.scrollBottom(true);

          Socket.emit('new_message', {
            type : 'text', text : message.text,
            friends : [$scope.toUser]
          });
        }, 500);
      };

      $scope.onMessageHold = function (event, itemIndex, message) {
        event.preventDefault();

        console.log('onMessageHold');
        console.log('message: ' + JSON.stringify(message, null, 2));
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
      };

      $scope.$on('elastic:resize', function (event, element, oldHeight, newHeight) {
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
  .factory('MessageService', function ($http, $q, Socket) {
      'use strict';
      var me = {};

      me.getUserMessages = function (chatRoomId) {
        var deferred = $q.defer();

        Socket.emit('retrieveAllChatMessagesByChatRoomId', {
          chat_room_id : chatRoomId
        });
        Socket.on('retrievedAllChatMessagesByChatRoomId', function (data) {
          Socket.removeListener('retrievedAllChatMessagesByChatRoomId');

          if (data.error) {
            deferred.reject(data.error);
          } else {
            deferred.resolve(data.result);
          }
        });

        return deferred.promise;
      };

      return me;
    })

  .filter('nl2br', function () {
      'use strict';
      return function (data) {
        if (!data) {
          return data;
        }
        return data.replace(/\n\r?/g, '<br />');
      };
    })

  .directive('autolinker', function ($timeout) {
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
            var autolinksLength = autolinks.length;
            var i;
            function onLinkClick(e) {
              var href = e.target.href;
              console.log('autolinkClick, href: ' + href);

              if (href) {
                //window.open(href, '_system');
                window.open(href, '_blank');
              }

              e.preventDefault();
              return false;
            }
            for (i = 0; i < autolinksLength; i++) {
              angular.element(autolinks[i]).bind('click', onLinkClick);
            }
          }, 0);
        }
      };
    });
