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
 node     : true
 */
/*global angular, ionic */
angular.module('translate-chat.friends-controller', ['ionic'])
  .controller('FriendsCtrl', function ($ionicPlatform, $scope, $rootScope, $ionicTabsDelegate, Friends,
                                       $ionicModal, UserService, Device, Socket) {
    'use strict';

    $scope.friends = [];
    $scope.users = [];

    Socket.on('addedFriend', function (data) {
      if (data.error) {
        console.error('added friend error : ', data);
      } else {
        Friends.addToLocal(UserService.get(), data.result).then(function () {
          $scope.friends.push(data.result);
        });
      }
    });

    $scope.remove = function (user) {
      console.log('remove user', user);
    };
    $scope.join = function (user) {
      console.log('join', user);
    };

    $ionicModal.fromTemplateUrl('templates/add-friend.html', {
      scope : $scope,
      animation : 'slide-in-down'
    }).then(function (userListModal) {
      $scope.userListModal = userListModal;
    });

    $scope.showUsers = function () {
      UserService.getAllUserFromServer(UserService.get()).then(function (result) {
        result.forEach(function (user) {
          if ($scope.users.length === 0) {
            $scope.users.push(user);
          } else {
            var exists = false;
            $scope.users.forEach(function (scopeUser) {
              if (!exists && user.user_id === scopeUser.user_id) {
                exists = true;
              }
            });

            if (!exists) {
              $scope.users.push(user);
            }
          }
        });

        $scope.userListModal.show();
      });
    };

    $scope.hideUserListModal = function () {
      $scope.userListModal.hide();
    };

    $scope.addFriend = function (friend) {
      UserService.createUserOnLocal(friend).then(function () {
        Friends.add(UserService.get(), friend).then(function () {
          Friends.getAll(UserService.get()).then(function (result) {
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

    $rootScope.$on('db_init_done', function () {
      $ionicModal.fromTemplateUrl('templates/user-name-input.html', {
        scope : $scope,
        animation : 'slide-in-down'
      }).then(function (modal) {
        $ionicPlatform.registerBackButtonAction(function (evt) {
          evt.preventDefault();
        }, 100);

        $scope.modal = modal;

        if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
          UserService.retrieveAlreadyRegisteredUserByDeviceIdOnLocal({device_id : Device.getId()})
            .then(function (result) {
              console.log('retrieveAlreadyRegisteredUserByDeviceId result : ', JSON.stringify(result));
              Friends.getAll(result).then(function (result) {
                $scope.friends = result;
              });
            }, function (error) {
              console.error('retrieve already registered user by device id on local error : ', JSON.stringify(error));
              UserService.retrieveAlreadyRegisteredUserByDeviceIdOnServer({device_id : Device.getId()})
                .then(function (result) {
                  console.log('retrieveAlreadyRegisteredUserByDeviceIdOnServer result - friend : ', JSON.stringify(result));
                  if (result && Object.keys(result).length > 0) {
                    UserService.createUserOnLocal(result);
                    Friends.getAll(result).then(function (result) {
                      $scope.friends = result;
                    });
                  } else {
                    $scope.modal.show();
                  }
                }, function (error) {
                  console.error('retrieve already registered user by device id on server error : ', JSON.stringify(error));
                  $scope.modal.show();
                });
            });
        } else {
          var deviceId = localStorage.getItem('translate-chat-device-id');

          if (!deviceId) {
            $scope.modal.show();
          } else {
            UserService.retrieveAlreadyRegisteredUserByDeviceIdOnLocal({device_id : deviceId})
              .then(function (result) {
                console.log('retrieveAlreadyRegisteredUserByDeviceId result : ', result);
                Friends.getAll(result).then(function (result) {
                  $scope.friends = result;
                });
              }, function (error) {
                console.error('retrieve already registered user by device id error : ', error);
                UserService.retrieveAlreadyRegisteredUserByDeviceIdOnServer({device_id : deviceId})
                  .then(function (result) {
                    if (result && Object.keys(result).length > 0) {
                      UserService.createUserOnLocal(result);
                      Friends.getAll(result).then(function (result) {
                        $scope.friends = result;
                      });
                    } else {
                      $scope.modal.show();
                    }
                  }, function (error) {
                    console.error('retrieve already registered user by device id on server error : ', error);
                    $scope.modal.show();
                  });
              });
          }
        }
      });
    });

    $scope.user = {};

    $scope.createUser = function () {
      var deviceId = Device.getId();
      var deviceType = Device.getType();
      var deviceVersion = Device.getVersion();

      console.log('create user : ', $scope.user_name);
      var params = {
        user_name : $scope.user.user_name, device_id : deviceId,
        device_type : deviceType, device_version : deviceVersion
      };
      UserService.createUserOnServer(params)
        .then(function (result) {
          UserService.createUserOnLocal({
              user_id : result.user_id,
              user_name : result.user_name,
              device_id : result.device_id,
              device_type : result.device_type,
              device_version : result.device_version
            })
            .then(function (result) {
              console.log('create user success', JSON.stringify(result));
              $scope.userDataLoadCompleted = true;
              $scope.modal.hide();
            }, function (error) {
              console.error('create user on local error', JSON.stringify(error));
            });
        }, function (error) {
          console.error('create user on server error', JSON.stringify(error));
        });
    };
  });
