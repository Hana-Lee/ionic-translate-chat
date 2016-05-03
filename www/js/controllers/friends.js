/**
 * @author Hana Lee
 * @since 2016-04-23 20:36
 */

angular.module('translate-chat.friends-controller', ['ionic'])
  .controller('FriendsCtrl',
    function ($ionicPlatform, $scope, $rootScope, $ionicTabsDelegate, Friends,
              $ionicHistory,
              $ionicModal, UserService, Chats, Device, Socket, _, $state) {
      'use strict';

      $scope.friends = [];
      $scope.users = [];
      $scope.user = {};

      console.log('history : ', $ionicHistory.viewHistory());

      var initializing = false;
      var dbInitializeComplete = false;

      Socket.on('addedFriend', function (data) {
        if (data.error) {
          console.error('added friend error : ', data);
        } else {
          UserService.createUserOnLocal(data.result).then(function () {
            Friends.addToLocal($scope.user, data.result).then(function () {
              $scope.friends.push(data.result);
            }, function (error) {
              console.error('insert friend to local error : ', error);
            });
          }, function (error) {
            console.error('insert friend to local user table error : ', error);
          });
        }
      });

      $scope.userNameInputKeyEvent = function (event) {
        console.log('event :', event);
        if (event.keyCode === 13) {
          $scope.createUser();
        }
      };

      $scope.remove = function (user) {
        console.log('remove user', user);
      };
      $scope.join = function (user) {
        console.log('join', user);
      };

      $ionicModal.fromTemplateUrl('templates/user-list-modal.html', {
        scope : $scope,
        animation : 'slide-in-down'
      }).then(function (userListModal) {
        $scope.userListModal = userListModal;
      });

      $scope.showUsers = function () {
        UserService.getAllUserFromServer($scope.user).then(function (result) {
          if ($scope.users.length === 0) {
            result.forEach(function (user) {
              $scope.users.push(user);
            });
          } else {
            $scope.users = _.uniq(_.union($scope.users, result), false, function (item) {
              return item.user_id;
            });
          }
          $scope.userListModal.show();
        });
      };

      $scope.hideUserListModal = function () {
        $scope.userListModal.hide();
      };

      $scope.addFriend = function (friend) {
        UserService.createUserOnLocal(friend).then(function () {
          Friends.add($scope.user, friend).then(function () {
            Friends.getAll($scope.user).then(function (result) {
              $scope.friends = result;
              console.log('friends list', $scope.friends);
              $scope.userListModal.hide();
            });
          }, function (error) {
            console.error('insert friend error : ', error);
          });
        }, function (error) {
          console.error('insert friend to local user table error : ', error);
        });
      };

      $scope.$on('$ionicView.beforeEnter', function () {
        $ionicTabsDelegate.showBar(true);
      });

      function _initializeFriends(userData) {
        Friends.getAll(userData).then(function (result) {
          $scope.friends = result;
          initializing = false;
          $rootScope.first_run = false;
        });
      }

      function _initializeUserAndFriends() {
        if (initializing) {
          return;
        }
        if (!dbInitializeComplete) {
          return;
        }
        initializing = true;
        var params = {
          device_id : Device.getId()
        };
        UserService.retrieveAlreadyRegisteredUserByDeviceIdOnLocal(params)
          .then(function (result) {
            console.log('retrieveAlreadyRegisteredUserByDeviceId result : ', result);
            $scope.user = result;
            $rootScope.user_id = $scope.user.user_id;
            _initializeFriends(result);
          }, function (error) {
            console.error('retrieve already registered user by device id on local error : ', error);
            UserService.retrieveAlreadyRegisteredUserByDeviceIdOnServer(params)
              .then(function (result) {
                if (result && Object.keys(result).length > 0) {
                  UserService.createUserOnLocal(result).then(function (result) {
                    $scope.user = result;
                    $rootScope.user_id = $scope.user.user_id;
                    _initializeFriends(result);
                  });
                } else {
                  console.error('user information is not exists on server : ', result);
                }
              }, function (error) {
                console.error('retrieve already registered user by device id on server error : ', error);
              });
          });
      }

      $scope.$on('$ionicView.enter', function () {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);
        }

        if (!$rootScope.first_run && dbInitializeComplete) {
          if (!$scope.user.user_name) {
            _initializeUserAndFriends();
          }
        }
        console.log('friend view enter', $scope.user);
      });

      $ionicModal.fromTemplateUrl('templates/user-name-input-modal.html', {
        scope : $scope,
        animation : 'slide-in-down'
      }).then(function (modal) {
        $scope.userNameInpuModal = modal;
      });

      $rootScope.$on('DB_ready', function () {
        console.log('friend db init done');
        dbInitializeComplete = true;
        if ($rootScope.first_run) {
          console.log('first run');
          $scope.userNameInpuModal.show();
        } else {
          _initializeUserAndFriends();
        }
      });

      $scope.createUser = function () {
        var deviceId = Device.getId();
        var deviceType = Device.getType();
        var deviceVersion = Device.getVersion();
        var deviceToken = Device.getToken();

        var params = {
          user_name : $scope.user.user_name, device_id : deviceId,
          device_type : deviceType, device_version : deviceVersion,
          user_face : 'img/sarah.png', device_token : deviceToken,
          online : 1
        };
        UserService.createUserOnServer(params)
          .then(function (result) {
            UserService.createUserOnLocal(result)
              .then(function (result) {
                console.log('create user success', result);
                $scope.user = result;
                $rootScope.user_id = $scope.user.user_id;
                $scope.userNameInpuModal.hide();
              }, function (error) {
                console.error('create user on local error : ', error);
              });
          }, function (error) {
            console.error('create user on server error : ', error);
          });
      };

      function joinChatRoom(chatRoomId, friend) {
        Chats.join(chatRoomId, $scope.user, friend).then(function () {
          var viewId = $ionicHistory.viewHistory().currentView.viewId;
          $state.go('tab.chat-room', {chatRoomId : chatRoomId, backViewId : viewId});
        }, function (error) {
          console.log('joining chat room error : ', error);
        });
      }

      $scope.joinChatRoom = function (friend) {
        Chats.getChatRoomIdByUserAndFriend($scope.user, friend).then(function (result) {
          console.log('get chat room id by user and friend result : ', result);
          joinChatRoom(result, friend);
        }, function (error) {
          console.error('get chat room id by user and friend error : ', error);

          Chats.create().then(function (createdChatRoomId) {
            joinChatRoom(createdChatRoomId, friend);
          }, function (error) {
            console.error('create chat room error : ', error);
          });
        });
      };
    });
