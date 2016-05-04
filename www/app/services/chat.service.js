/**
 * @author Hana Lee
 * @since 2016-05-04 13:37
 */

(function () {
  'use strict';

  angular.module('translate-chat').factory('ChatService', ChatService);

  ChatService.$inject = ['$q', 'SocketService', 'SqliteService', '_', 'FriendService', 'UserService'];

  /* @ngInject */
  function ChatService($q, SocketService, SqliteService, _, FriendService, UserService) {
    var chatRoomIds = [];
    var chatRoomList = [];

    return {
      createRoom : createRoom,
      createRoomOnServer : createRoomOnServer,
      createRoomOnLocal : createRoomOnLocal,
      join : join,
      getAllRoom : getAllRoom,
      getChatRoomIdByUserAndFriend : getChatRoomIdByUserAndFriend,
      getToUser : getToUser,
      getToUserIdFromLocal : getToUserIdFromLocal,
      getToUserIdFromServer : getToUserIdFromServer
    };

    function createRoom() {
      var deferred = $q.defer();

      createRoomOnServer().then(function (serverResult) {
        console.log('create chat room on server complete : ', serverResult);
        createRoomOnLocal(serverResult.chat_room_id).then(function (localResult) {
          console.log('create chat room on local complete : ', localResult);
          chatRoomIds.push(serverResult.chat_room_id);
          deferred.resolve(serverResult.chat_room_id);
        }, function (error) {
          console.error('create chat room on local error : ', error);
          deferred.reject(error);
        });
      }, function (error) {
        console.error('create chat room on server error : ', error);
        deferred.reject(error);
      });

      return deferred.promise;
    }

    function createRoomOnServer() {
      var deferred = $q.defer();
      SocketService.emit('createChatRoom');
      SocketService.on('createdChatRoom', function (data) {
        SocketService.removeListener('createdChatRoom');

        if (data.error) {
          deferred.reject(data.error);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function createRoomOnLocal(chatRoomId) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      $q.when(
        SqliteService.executeSql(translateChat.QUERIES.INSERT_CHAT_ROOM, [chatRoomId])
      ).then(function (result) {
        deferred.resolve(result);
      }, function (error) {
        deferred.reject(error);
      });

      return promise;
    }

    function join(chatRoomId, user, friend) {
      var deferred = $q.defer();
      SocketService.emit('joinChatRoom', {
        chat_room_id : chatRoomId,
        user_id : user.user_id,
        user_name : user.user_name,
        to_user_id : friend.user_id
      });
      SocketService.on('joinedChatRoom', function (data) {
        SocketService.removeListener('joinedChatRoom');

        if (data.error) {
          console.error('joining chat room error : ', data.error);
          deferred.reject(data.error);
        } else {
          var chat = [{
            friend : friend,
            chat_room_id : chatRoomId,
            last_text : ''
          }];
          if (chatRoomList.length === 0) {
            chatRoomList = chat;
          } else {
            chatRoomList = _.uniq(_.union(chatRoomList, chat), false, function (item) {
              return item.chat_room_id;
            });
          }
          deferred.resolve('OK');
        }
      });

      return deferred.promise;
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
              deferred.reject(data.error);
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

    function getChatRoomIdByUserAndFriend(user, friend) {
      var deferred = $q.defer();
      SocketService.emit('retrieveChatRoomIdByUserIdAndToUserId', {
        user_id : user.user_id, to_user_id : friend.user_id
      });
      SocketService.on('retrievedChatRoomIdByUserIdAndToUserId', function (data) {
        SocketService.removeListener('retrievedChatRoomIdByUserIdAndToUserId');

        if (data.error) {
          deferred.reject(data.error);
        } else {
          if (data.result && data.result.chat_room_id) {
            deferred.resolve(data.result.chat_room_id);
          } else {
            deferred.reject('not data');
          }
        }
      });

      return deferred.promise;
    }

    function getToUser(userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      getToUserIdFromLocal(userData).then(function (localResult) {
        UserService.getByUserId(localResult.user_id).then(function (result) {
          deferred.resolve(result);
        }, function (error) {
          console.error('get by user id error : ', error);
          deferred.reject(error);
        });
      }, function (localError) {
        console.error('get to user from local error : ', localError);
        getToUserIdFromServer(userData).then(function (serverResult) {
          UserService.getByUserId(serverResult.user_id).then(function (result) {
            deferred.resolve(result);
          }, function (error) {
            console.error('get by user id error : ', error);
            deferred.reject(error);
          });
        }, function (serverError) {
          console.error('get to user from server error : ', serverError);
        });
      });

      return promise;
    }

    function getToUserIdFromLocal(userData) {
      console.log('get to user ', userData);
      var deferred = $q.defer();
      $q.when(
        SqliteService.getFirstItem(
          translateChat.QUERIES.SELECT_TO_USER_ID_BY_CHAT_ROOM_ID_AND_USER_ID,
          [userData.chat_room_id, userData.user_id]
        )
      ).then(function (result) {
        deferred.resolve(result);
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise;
    }

    function getToUserIdFromServer(userData) {
      var deferred = $q.defer();

      SocketService.emit('retrieveToUserIdByChatRoomIdAndUserId', {
        chat_room_id : userData.chat_room_id, user_id : userData.user_id
      });
      SocketService.on('retrievedToUserIdByChatRoomIdAndUserId', function (data) {
        SocketService.removeListener('retrievedToUserIdByChatRoomIdAndUserId');

        if (data.error) {
          deferred.reject(data.error);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }
  }

})();
