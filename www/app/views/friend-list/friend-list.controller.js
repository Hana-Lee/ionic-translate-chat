/**
 * @author Hana Lee
 * @since 2016-04-23 20:36
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .controller('FriendListCtrl', FriendListController);

  FriendListController.$inject = [
    '$scope', '$ionicTabsDelegate', '$state', '$ionicHistory', '$ionicModal',
    'UserService', 'ChatService', 'SocketService', 'FriendService', 'ImageService'
  ];
  function FriendListController($scope, $ionicTabsDelegate, $state, $ionicHistory, $ionicModal,
                                UserService, ChatService, SocketService, FriendService, ImageService) {
    $scope.friends = [];
    $scope.users = [];
    $scope.user = UserService.get();
    $scope.imageServerUrl = ImageService.getServerUrl();

    $scope.$on('$ionicView.beforeEnter', onBeforeEnter);
    $scope.$on('$ionicView.enter', onEnter);

    $scope.removeFriend = removeFriend;
    $scope.showUsers = showUsers;
    $scope.hideUserListModal = hideUserListModal;
    $scope.addFriend = addFriend;
    $scope.joinChatRoom = joinChatRoom;

    SocketService.on('addedFriend', onAddedFriend);
    SocketService.on('friendDeletedYou', onFriendDeletedYou);

    $ionicModal.fromTemplateUrl('app/views/friend-list/modal/user-list-modal.html', {
      scope : $scope,
      animation : 'slide-in-down'
    }).then(function (userListModal) {
      $scope.userListModal = userListModal;
    });

    function removeFriend(friend) {
      FriendService.remove($scope.user, friend).then(function (friends) {
        $scope.friends = friends;
      });
    }

    function showUsers() {
      UserService.getAll($scope.user).then(function (result) {
        $scope.users = result;
        $scope.userListModal.show();
      });
    }

    function hideUserListModal() {
      $scope.users = null;
      $scope.userListModal.hide();
    }

    function addFriend(friend, doNotification) {
      console.debug('call add friend : ', friend, $scope.friends);
      FriendService.add($scope.user, friend, doNotification).then(function () {
        console.debug('Friend add all done : ', friend, $scope.friends);
        $scope.friends.push(friend);
        hideUserListModal();
      }, function (error) {
        console.error('add new friend error : ', error);
      });
    }

    function onBeforeEnter() {
      $ionicTabsDelegate.showBar(true);
    }

    function _initializeFriends(userData) {
      console.debug('initialize friends : ', $scope.friends);
      FriendService.getAll(userData).then(function (result) {
        $scope.friends = result;
        console.debug('initialize friends done : ', $scope.friends, result);
      }, function (error) {
        console.error('get all friends error : ', error);
      });
    }

    function onEnter() {
      _initializeFriends($scope.user);
    }

    function joinChatRoom(friend) {
      var chatRoom = ChatService.getChatRoom(friend);
      var chatRoomId;
      if (chatRoom) {
        chatRoomId = chatRoom.chat_room_id;
      }

      ChatService.joinChatRoom($scope.user, friend, chatRoomId).then(function (result) {
        var viewId = $ionicHistory.viewHistory().currentView.viewId;
        $state.go('tab.chat-room', {
          chatRoomId : chatRoomId || result.chat_room_id,
          backViewId : viewId, reJoin : false
        });
      }, function (error) {
        console.log('joining chat room error : ', error);
      });
    }

    function onAddedFriend(data) {
      if (data.error) {
        console.error('added friend error : ', data);
      } else {
        console.log('added friend : ', data.result, $scope.friends);
        addFriend(data.result, false);
      }
    }

    function onFriendDeletedYou(data) {
      var deletedFriendId = data.result;
      _deleteFriendOnLocal(deletedFriendId);
    }

    function _deleteFriendOnLocal(friendId) {
      $scope.friends.forEach(function (friend, idx) {
        if (friend.user_id === friendId) {
          $scope.friends.splice(idx, 1);
        }
      });
    }
  }
})();
