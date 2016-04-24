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
angular.module('translate-chat.friends-controller', [])
  .controller('FriendsCtrl', function ($ionicPlatform, $scope, $ionicTabsDelegate, Friends,
                                       $ionicModal, UserService, Socket, Device, Users) {
    'use strict';

    $scope.remove = function (user) {
      console.log('remove user', user);
    };
    $scope.join = function (user) {
      console.log('join', user);
    };

    $scope.showUsers = function () {
      $ionicModal.fromTemplateUrl('templates/add-friend.html', {
        scope : $scope,
        animation : 'slide-in-down'
      }).then(function (userListModal) {
        $scope.users = [];

        Users.all(UserService.get().user_id).then(function (result) {
          console.log('result ', result);
          result.map(function (r) {
            r.face = 'img/sarah.png';
            return r;
          });
          $scope.users = result;
        });

        $scope.userListModal = userListModal;
        $scope.userListModal.show();
      });
    };

    $scope.hideUserListModal = function () {
      $scope.userListModal.hide();
    };

    $scope.addFriend = function (friendId) {
      console.log('create friend');
      Socket.emit('createFriend', {user_id : UserService.get().user_id, friend_id : friendId});
      Socket.on('createdFriend', function () {
        Friends.add(UserService.get(), friendId).then(Friends.all(UserService.get()).then(function (result) {
          console.log('all friends', result);
          $scope.friends = result;
        }));
      });
    };

    $scope.$on('$ionicView.beforeEnter', function () {
      $ionicTabsDelegate.showBar(true);
    });

    $scope.userDataLoadCompleted = false;

    $scope.$on('$ionicView.enter', function () {
      if (!$scope.userDataLoadCompleted) {
        $ionicModal.fromTemplateUrl('templates/user-name-input.html', {
          scope : $scope,
          animation : 'slide-in-down'
        }).then(function (modal) {
          $ionicPlatform.registerBackButtonAction(function (evt) {
            evt.preventDefault();
          }, 100);

          $scope.modal = modal;

          if (ionic.Platform.isAndroid() && ionic.Platform.isIOS()) {
            UserService.retrieveAlreadyRegisteredUserByDeviceIdOnLocal({device_id : Device.getId()})
              .then(function (result) {
                console.log('retrieveAlreadyRegisteredUserByDeviceId result : ', result);
                $scope.userDataLoadCompleted = true;
                $scope.friends = Friends.all(result.user_id);
              }, function (error) {
                console.error('retrieve already registered user by device id error : ', error);
                $scope.modal.show();
              });
          } else {
            var userName = localStorage.getItem('translate-chat-user-name');
            var deviceId = localStorage.getItem('translate-chat-device-id');

            UserService.retrieveAlreadyRegisteredUserByUserNameOnLocal({username : userName})
              .then(function (result) {
                console.log('retrieveAlreadyRegisteredUserByUserName result : ', result);
                $scope.userDataLoadCompleted = true;
                $scope.friends = Friends.all(result.user_id);
              }, function (error) {
                console.error('retrieveAlreadyRegisteredUserByUserName error : ', error);
                UserService.retrieveAlreadyRegisteredUserByDeviceIdOnLocal({device_id : deviceId})
                  .then(function (result) {
                    console.log('retrieveAlreadyRegisteredUserByDeviceId result : ', result);
                    $scope.userDataLoadCompleted = true;
                    $scope.friends = Friends.all(result.user_id);
                  }, function (error) {
                    console.error('retrieve already registered user by device id error', error);
                    $scope.modal.show();
                  });
              });
          }
        });
      }
    });

    $scope.user = {};

    $scope.createUser = function () {
      var deviceId = Device.getId();

      UserService.createUserOnServer({username : $scope.user.username, device_id : deviceId}, Socket)
        .then(function (result) {
          UserService.createUserOnLocal({
              user_id : result.user_id,
              username : $scope.user.username,
              device_id : deviceId
            })
            .then(function (result) {
              console.log('create user success', result);
              $scope.userDataLoadCompleted = true;
              $scope.modal.hide();
            }, function (error) {
              console.error('create user on local error', error);
            });
        }, function (error) {
          console.error('create user on server error', error);
        });
    };
  });
