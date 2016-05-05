/**
 * @author Hana Lee
 * @since 2016-04-23 20:36
 */

(function () {
  'use strict';

  angular.module('translate-chat').controller('FriendListCtrl', FriendListController);

  FriendListController.$inject = [
    '$scope', '$rootScope', '$ionicTabsDelegate', '$state', '$ionicHistory', '$ionicModal',
    'UserService', 'ChatService', 'SocketService', 'FriendService'
  ];
  function FriendListController($scope, $rootScope, $ionicTabsDelegate, $state, $ionicHistory, $ionicModal,
                                UserService, ChatService, SocketService, FriendService) {
    $scope.friends = [];
    $scope.users = [];

    console.log('friend controller');

    SocketService.on('addedFriend', function (data) {
      if (data.error) {
        console.error('added friend error : ', data);
      } else {
        UserService.createUserOnLocal(data.result).then(function () {
          FriendService.addToLocal($rootScope.user, data.result).then(function () {
            $scope.friends.push(data.result);
          }, function (error) {
            console.error('insert friend to local error : ', error);
          });
        }, function (error) {
          console.error('insert friend to local user table error : ', error);
        });
      }
    });

    $scope.remove = function (user) {
      console.log('remove user', user);
    };

    $ionicModal.fromTemplateUrl('app/views/friend-list/modal/user-list-modal.html', {
      scope : $scope,
      animation : 'slide-in-down'
    }).then(function (userListModal) {
      $scope.userListModal = userListModal;
    });

    $scope.showUsers = function () {
      UserService.getAllUserFromServer($rootScope.user).then(function (result) {
        $scope.users = result;
        $scope.userListModal.show();
      });
    };

    $scope.hideUserListModal = function () {
      $scope.userListModal.hide();
    };

    $scope.addFriend = function (friend) {
      UserService.createUserOnLocal(friend).then(function () {
        FriendService.add($rootScope.user, friend).then(function () {
          FriendService.getAll($rootScope.user).then(function (result) {
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
      FriendService.getAll(userData).then(function (result) {
        $scope.friends = result;
      });
    }

    $scope.$on('$ionicView.enter', function () {
      if (!$rootScope.user.user_name) {
        $state.go('user-name');
      } else if ($scope.friends.length === 0) {
        _initializeFriends($rootScope.user);
      }
    });

    function joinChatRoom(chatRoomId, friend) {
      ChatService.join(chatRoomId, $rootScope.user, friend).then(function () {
        var viewId = $ionicHistory.viewHistory().currentView.viewId;
        $state.go('tab.chat-room', {chatRoomId : chatRoomId, backViewId : viewId});
      }, function (error) {
        console.log('joining chat room error : ', error);
      });
    }

    $scope.joinChatRoom = function (friend) {
      ChatService.getChatRoomIdByUserAndFriend($rootScope.user, friend).then(function (result) {
        console.log('get chat room id by user and friend result : ', result);
        joinChatRoom(result, friend);
      }, function (error) {
        console.error('get chat room id by user and friend error : ', error);

        ChatService.createRoom().then(function (createdChatRoomId) {
          joinChatRoom(createdChatRoomId, friend);
        }, function (error) {
          console.error('create chat room error : ', error);
        });
      });
    };
  }
})();
