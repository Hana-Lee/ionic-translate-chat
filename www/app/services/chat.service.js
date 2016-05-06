/**
 * @author Hana Lee
 * @since 2016-05-04 13:37
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('ChatService', ChatService);

  ChatService.$inject = [
    '$q', 'SocketService', '_', 'FriendService', 'STORAGE_KEYS'
  ];

  function ChatService($q, SocketService, _, FriendService, STORAGE_KEYS) {
    var chatRoomList = [];

    if (localStorage.getItem(STORAGE_KEYS.CHATS)) {
      chatRoomList = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS));
    }

    return {
      getChatRoom : getChatRoom,
      joinChatRoom : joinChatRoom,
      getToUserByChatRoomId : getToUserByChatRoomId,
      getAllRoom : getAllRoom
    };

    function getChatRoom(friend) {
      return _.find(chatRoomList, function (chatRoom) {
        return chatRoom.friend.user_id === friend.user_id;
      });
    }

    function joinChatRoom(user, friend, chatRoomId) {
      var deferred = $q.defer();

      SocketService.emit('joinChatRoom', {
        chat_room_id : chatRoomId,
        user : user,
        friend : friend
      });
      SocketService.on('joinedChatRoom', function (data) {
        SocketService.removeListener('joinedChatRoom');

        if (data.error) {
          deferred.reject(data);
        } else {
          var chat = {
            friend : friend,
            chat_room_id : data.result.chat_room_id,
            last_text : ''
          };

          if (!chatRoomId) {
            chatRoomList.push(chat);
            localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chatRoomList));
          }

          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function getToUserByChatRoomId(chatRoomId) {
      var chatRoom = _.find(chatRoomList, function (chatRoom) {
        return chatRoom.chat_room_id === chatRoomId;
      });

      if (chatRoom) {
        return chatRoom.friend;
      }

      return null;
    }

    function getAllRoom(userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      if (chatRoomList.length === 0) {
        FriendService.getAll(userData).then(function (result) {
          console.log('result : ', result);
          SocketService.emit('retrieveAllChatRoomIdsAndFriendIdAndLastTextByUserId', userData);
          SocketService.on('retrievedAllChatRoomIdsAndFriendIdAndLastTextByUserId', function (data) {
            SocketService.removeListener('retrievedAllChatRoomIdsAndFriendIdAndLastTextByUserId');
            console.log('data : ', data);
            if (data.error) {
              deferred.reject(data);
            } else if (data.result) {
              data.result.forEach(function (/** @prop {String} r.friend_id */r) {
                var friend = _.find(result, function (f) {
                  return r.friend_id === f.user_id;
                });
                chatRoomList.push({
                  friend : friend,
                  chat_room_id : r.chat_room_id,
                  last_text : r.last_text
                });
              });
              deferred.resolve(chatRoomList);
            } else {
              chatRoomList = [];
              deferred.resolve([]);
            }
          });
        }, function (error) {
          console.log('get friends error : ', error);
          deferred.reject(error);
        });
      } else {
        deferred.resolve(chatRoomList);
      }
      return promise;
    }
  }

})();
