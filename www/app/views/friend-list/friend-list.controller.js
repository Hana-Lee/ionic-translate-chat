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
    'UserService', 'ChatService', 'SocketService', 'FriendService'
  ];
  function FriendListController($scope, $ionicTabsDelegate, $state, $ionicHistory, $ionicModal,
                                UserService, ChatService, SocketService, FriendService) {
    $scope.friends = [];
    $scope.users = [];
    $scope.user = UserService.get();

    $scope.$on('$ionicView.beforeEnter', onBeforeEnter);
    $scope.$on('$ionicView.enter', onEnter);

    $scope.remove = remove;
    $scope.showUsers = showUsers;
    $scope.hideUserListModal = hideUserListModal;
    $scope.addFriend = addFriend;
    $scope.joinChatRoom = joinChatRoom;

    SocketService.on('addedFriend', onAddedFriend);

    $ionicModal.fromTemplateUrl('app/views/friend-list/modal/user-list-modal.html', {
      scope : $scope,
      animation : 'slide-in-down'
    }).then(function (userListModal) {
      $scope.userListModal = userListModal;
    });

    function remove(friend) {
      console.log('remove friend : ', friend);
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
      if ($scope.friends.length === 0) {
        _initializeFriends($scope.user);
      }
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
          backViewId : viewId
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
  }
})();
