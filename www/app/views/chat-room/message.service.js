/**
 * @author Hana Lee
 * @since 2016-05-09 21:04
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('MessageService', MessageService);

  MessageService.$inject = ['$q', 'SocketService'];

  function MessageService($q, SocketService) {
    return {
      getUserMessages : getUserMessages,
      sendMessage : sendMessage,
      registerNewMessageCallback : registerNewMessageCallback,
      removeNewMessageCallback : removeNewMessageCallback
    };

    function getUserMessages(chatRoomId) {
      var deferred = $q.defer();

      SocketService.emit('retrieveAllChatMessagesByChatRoomId', {
        chat_room_id : chatRoomId
      });
      SocketService.on('retrievedAllChatMessagesByChatRoomId', function (data) {
        SocketService.removeListener('retrievedAllChatMessagesByChatRoomId');

        if (data.error) {
          deferred.reject(data.error);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function sendMessage(options) {
      SocketService.emit('newMessage', {
        chat_room_id : options.chat_room_id,
        type : options.type,
        text : options.text,
        user : options.user,
        to_user : options.toUser
      });
    }

    function registerNewMessageCallback(callback) {
      SocketService.on('newMessage', callback);
    }

    function removeNewMessageCallback(callback) {
      SocketService.removeListener('newMessage', callback);
    }
  }

})();
