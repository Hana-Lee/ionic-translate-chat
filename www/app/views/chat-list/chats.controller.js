/**
 * @author Hana Lee
 * @since 2016-04-23 20:46
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .controller('ChatsCtrl', ChatListController);

  ChatListController.$inject = [
    '$scope', 'ChatService', 'UserService', '$state', '$ionicHistory', '$ionicTabsDelegate'
  ];

  function ChatListController($scope, ChatService, UserService, $state, $ionicHistory, $ionicTabsDelegate) {
    $scope.chats = [];
    $scope.user = UserService.get();

    $scope.$on('$ionicView.enter', onEnter);
    $scope.$on('$ionicView.beforeEnter', onBeforeEnter);

    $scope.joinChatRoom = joinChatRoom;
    $scope.remove = remove;

    function onEnter() {
      ChatService.getAllRoom($scope.user).then(function (result) {
        $scope.chats = result;
      });
    }

    function onBeforeEnter() {
      $ionicTabsDelegate.showBar(true);
    }

    function joinChatRoom(chat) {
      ChatService.joinChatRoom($scope.user, chat.friend, chat.chat_room_id).then(function () {
        var viewId = $ionicHistory.viewHistory().currentView.viewId;
        $state.go('tab.chat-room', {chatRoomId : chat.chat_room_id, backViewId : viewId});
      }, function (error) {
        console.log('joining chat room error : ', JSON.stringify(error));
      });
    }

    function remove(chat) {
      ChatService.remove(chat);
    }
  }
})();
