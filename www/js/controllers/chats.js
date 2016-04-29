/**
 * @author Hana Lee
 * @since 2016-04-23 20:46
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
/*global angular */

angular.module('translate-chat.chats-controller', [])
  .controller('ChatsCtrl', function ($scope, Chats, UserService, $state, $ionicHistory) {
    'use strict';

    $scope.chats = [];
    $scope.user = {};
    var user = UserService.get();
    user.then(function (result) {
      $scope.user = result;
      Chats.all(result).then(function (result) {
        $scope.chats = result;
      });
    });

    $scope.joinChatRoom = function(chat) {
      Chats.join(chat.chat_room_id, $scope.user, chat.friend).then(function () {
        var viewId = $ionicHistory.viewHistory().currentView.viewId;
        $state.go('tab.chat-room', {chatRoomId : chat.chat_room_id, backViewId : viewId});
      }, function (error) {
        console.log('joining chat room error : ', JSON.stringify(error));
      });
    };

    $scope.remove = function (chat) {
      Chats.remove(chat);
    };
  });
