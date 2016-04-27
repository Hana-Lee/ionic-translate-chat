/**
 * @author Hana Lee
 * @since 2016-04-23 20:36
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
 node     : true,
 unparam  : true
 */
/*global angular, ionic, cordova */
angular.module('translate-chat.friends-controller', ['ionic'])
  .controller('FriendsCtrl', function ($ionicPlatform, $scope, $rootScope, $ionicTabsDelegate, Friends,
                                       $ionicModal, UserService, Device, Socket, _) {
    'use strict';

    $scope.friends = [];
    $scope.users = [];
    $scope.user = {};

    var initialize_done = false;

    Socket.on('addedFriend', function (data) {
      if (data.error) {
        console.error('added friend error : ', data);
      } else {
        Friends.addToLocal($scope.user, data.result).then(function () {
          $scope.friends.push(data.result);
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
          console.error('insert friend error : ', JSON.stringify(error));
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
      });
    }

    function _initializeUserAndFriends() {
      var params = {
        device_id : Device.getId()
      };
      UserService.retrieveAlreadyRegisteredUserByDeviceIdOnLocal(params)
        .then(function (result) {
          console.log('retrieveAlreadyRegisteredUserByDeviceId result : ', JSON.stringify(result));
          $scope.user = result;
          _initializeFriends(result);
        }, function (error) {
          console.error('retrieve already registered user by device id on local error : ', JSON.stringify(error));
          UserService.retrieveAlreadyRegisteredUserByDeviceIdOnServer(params)
            .then(function (result) {
              console.log('retrieveAlreadyRegisteredUserByDeviceIdOnServer result - friend : ', JSON.stringify(result));
              if (result && Object.keys(result).length > 0) {
                UserService.createUserOnLocal(result).then(function (result) {
                  $scope.user = result;
                  _initializeFriends(result);
                });
              } else {
                console.error('user information is not exists on server : ', JSON.stringify(result));
              }
            }, function (error) {
              console.error('retrieve already registered user by device id on server error : ', JSON.stringify(error));
            });
        });
    }

    $scope.$on('$ionicView.enter', function () {
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }

      if (initialize_done) {
        if (!$scope.user) {
          _initializeUserAndFriends();
        }
      }
      console.log('friend view enter');
    });

    $ionicModal.fromTemplateUrl('templates/user-name-input-modal.html', {
      scope : $scope,
      animation : 'slide-in-down'
    }).then(function (modal) {
      $scope.userNameInpuModal = modal;
    });

    $rootScope.$on('DB_ready', function () {
      console.log('friend db init done');
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

      var params = {
        user_name : $scope.user.user_name, device_id : deviceId,
        device_type : deviceType, device_version : deviceVersion,
        user_face : 'img/sarah.png'
      };
      UserService.createUserOnServer(params)
        .then(function (result) {
          UserService.createUserOnLocal(result)
            .then(function (result) {
              console.log('create user success', JSON.stringify(result));
              $scope.user = result;
              $scope.userNameInpuModal.hide();
            }, function (error) {
              console.error('create user on local error : ', JSON.stringify(error));
            });
        }, function (error) {
          console.error('create user on server error : ', JSON.stringify(error));
        });
    };
  });
