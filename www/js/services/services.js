/**
 * @author Hana Lee
 * @since 2016-04-15 14:13
 */

angular.module('translate-chat.services', ['ionic'])

  .service('UserService', function ($q, $sqliteService, Device, Socket) {
    'use strict';

    this.user = undefined;
    this.users = [];

    this.createUserOnServer = function (userData) {
      console.log('create user on server', userData);
      var deferred = $q.defer();
      var promise = deferred.promise;

      Socket.emit('createUser', userData);
      Socket.on('createdUser', function (data) {
        Socket.removeListener('createdUser');
        if (data.error) {
          deferred.reject(data);
        } else {
          localStorage.setItem('translate-chat-user-id', data.result.user_id);
          localStorage.setItem('translate-chat-user-name', data.result.user_name);
          localStorage.setItem('translate-chat-device-id', data.result.device_id);
          localStorage.setItem('translate-chat-device-token', data.result.device_token);
          localStorage.setItem('translate-chat-user-info', JSON.stringify(data.result));
          this.user = data.result;
          deferred.resolve(data.result);
        }
      }.bind(this));
      return promise;
    };

    this.get = function () {
      console.log('get user');
      var deferred = $q.defer();
      var promise = deferred.promise;
      if (!this.user) {
        var deviceId = localStorage.getItem('translate-chat-device-id');
        if (!deviceId) {
          Device.getId();
        }
        console.log('get user execute query', deviceId);
        $sqliteService.getFirstItem(translateChat.QUERIES.SELECT_USER_BY_DEVICE_ID, [deviceId])
          .then(function (result) {
            console.log('select user by device id result : ', result);
            this.user = result;
            deferred.resolve(result);
          }.bind(this), function (error) {
            console.error('select user by device id error : ', error);
            deferred.reject(error);
          });
      } else {
        deferred.resolve(this.user);
      }
      return promise;
    };

    this.getByUserId = function (userId) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      this.getByUserIdFromLocal(userId).then(function (result) {
        deferred.resolve(result);
      }, function (localError) {
        console.error('get user by user id from local error : ', localError);
        this.getByUserIdFromServer(userId).then(function (result) {
          deferred.resolve(result);
        }, function (serverError) {
          console.error('get user by user id from server error : ', serverError);
          deferred.reject(serverError);
        });
      }.bind(this));

      return promise;
    };
    this.getByUserIdFromLocal = function (userId) {
      return $q.when($sqliteService.getFirstItem(translateChat.QUERIES.SELECT_USER_BY_USER_ID, [userId]));
    };

    this.getByUserIdFromServer = function (userId) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      console.log('user id ', userId);
      Socket.emit('retrieveUserByUserId', {user_id : userId});
      Socket.on('retrievedUserByUserId', function (data) {
        Socket.removeListener('retrievedUserByUserId');

        if (data.error) {
          deferred.reject(data.error);
        } else {
          deferred.resolve(data.result);
        }
      });

      return promise;
    };

    this.createUserOnLocal = function (userData) {
      console.log('create user on local', userData);
      var deferred = $q.defer();
      var promise = deferred.promise;

      $q.when($sqliteService.executeSql(
        translateChat.QUERIES.INSERT_USER,
        [
          userData.user_id, userData.user_name, userData.user_face, userData.device_token,
          userData.device_id, userData.device_type, userData.device_version,
          userData.socket_id, userData.online, userData.connection_time, userData.created
        ]
      )).then(function () {
        deferred.resolve(userData);
      }.bind(this), function (error) {
        deferred.reject(error);
      });

      return promise;
    };

    this.retrieveAlreadyRegisteredUserByDeviceIdOnServer = function (userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      Socket.emit('retrieveAlreadyRegisteredUserByDeviceId', userData);
      Socket.on('retrievedAlreadyRegisteredUserByDeviceId', function (data) {
        Socket.removeListener('retrievedAlreadyRegisteredUserByDeviceId');

        console.log('retrieveAlreadyRegisteredUserByDeviceIdOnServer result - service : ', JSON.stringify(data));
        if (data.error) {
          deferred.reject(data);
        } else {
          this.user = data.result;
          deferred.resolve(data.result);
        }
      }.bind(this));

      return promise;
    };

    this.retrieveAlreadyRegisteredUserByDeviceIdOnLocal = function (userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      $q.when($sqliteService.getFirstItem(translateChat.QUERIES.SELECT_USER_BY_DEVICE_ID, [userData.device_id]))
        .then(function (result) {
          console.log('select user by device id result : ', JSON.stringify(result));
          this.user = result;
          deferred.resolve(result);
        }.bind(this), function (error) {
          console.log('select user by device id error : ', JSON.stringify(error));
          deferred.reject(error);
        });

      return promise;
    };

    this.getAllUserFromServer = function (userData) {
      console.log('get all user from server', this.users);
      var deferred = $q.defer();
      var promise = deferred.promise;
      Socket.emit('retrieveAllUsers');
      Socket.on('retrievedAllUsers', function (data) {
        Socket.removeListener('retrievedAllUsers');

        if (data.error) {
          deferred.reject(data);
        } else {
          this.users = [];
          console.log('retrieve all users : ', data.result);
          data.result.forEach(function (user) {
            console.log('user list', user, userData);
            if (user.user_id !== userData.user_id) {
              this.users.push(user);
            }
          }.bind(this));
          deferred.resolve(this.users);
        }
      }.bind(this));
      return promise;
    };
  })

  .factory('Device', function ($cordovaDevice) {
    'use strict';
    return {
      getId : function () {
        var deviceId = localStorage.getItem('translate-chat-device-id');
        if (deviceId) {
          return deviceId;
        }
        if (!ionic.Platform.isNativeBrowser) {
          try {
            return $cordovaDevice.getUUID();
          } catch (e) {
            return null;
          }
        }
        return new Date().getTime().toString();
      },
      getVersion : function () {
        console.log('platform version : ', window.navigator.appVersion);
        if (ionic.Platform.isNativeBrowser) {
          return window.navigator.appVersion;
        }
        return ionic.Platform.version();
      },
      getType : function () {
        if (ionic.Platform.isNativeBrowser) {
          return 'WEB_BROWSER';
        }
        return ionic.Platform.platform().toUpperCase();
      },
      getToken : function () {
        var deviceToken = localStorage.getItem('translate-chat-device-token');
        if (deviceToken) {
          return deviceToken;
        }

        return '';
      }
    };
  })

  .factory('Chats', function ($q, $sqliteService, Socket, _, Friends, UserService) {
    'use strict';

    console.log('chats factory');

    var chats = [];
    var chatRoomIds = [];

    return {
      create : function () {
        var deferred = $q.defer();
        var promise = deferred.promise;
        this.createOnServer().then(function (serverResult) {
          console.log('create chat room on server complete : ', serverResult);
          this.createOnLocal(serverResult.chat_room_id).then(function (localResult) {
            console.log('create chat room on local complete : ', localResult);
            chatRoomIds.push(serverResult.chat_room_id);
            deferred.resolve(serverResult.chat_room_id);
          }, function (error) {
            console.error('create chat room on local error : ', error);
            deferred.reject(error);
          });
        }.bind(this), function (error) {
          console.error('create chat room on server error : ', error);
          deferred.reject(error);
        });

        return promise;
      },
      createOnServer : function () {
        var deferred = $q.defer();
        var promise = deferred.promise;
        Socket.emit('createChatRoom');
        Socket.on('createdChatRoom', function (data) {
          Socket.removeListener('createdChatRoom');

          if (data.error) {
            deferred.reject(data.error);
          } else {
            deferred.resolve(data.result);
          }
        });

        return promise;
      },
      createOnLocal : function (chatRoomId) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        $q.when(
          $sqliteService.executeSql(translateChat.QUERIES.INSERT_CHAT_ROOM, [chatRoomId])
        ).then(function (result) {
          deferred.resolve(result);
        }, function (error) {
          deferred.reject(error);
        });

        return promise;
      },
      join : function (chatRoomId, user, friend) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        Socket.emit('joinChatRoom', {
          chat_room_id : chatRoomId,
          user_id : user.user_id,
          user_name : user.user_name,
          to_user_id : friend.user_id
        });
        Socket.on('joinedChatRoom', function (data) {
          Socket.removeListener('joinedChatRoom');

          if (data.error) {
            console.error('joining chat room error : ', data.error);
            deferred.reject(data.error);
          } else {
            var chat = [{
              friend : friend,
              chat_room_id : chatRoomId,
              last_text : ''
            }];
            if (chats.length === 0) {
              chats = chat;
            } else {
              chats = _.uniq(_.union(chats, chat), false, function (item) {
                return item.chat_room_id;
              });
            }
            deferred.resolve('OK');
          }
        });

        return promise;
      },
      all : function (userData) {
        var deferred = $q.defer();
        var promise = deferred.promise;

        if (chats.length === 0) {
          Friends.getAll(userData).then(function (result) {
            console.log('result : ', result);
            Socket.emit('retrieveAllChatRoomIdsAndFriendIdAndLastTextByUserId', userData);
            Socket.on('retrievedAllChatRoomIdsAndFriendIdAndLastTextByUserId', function (data) {
              Socket.removeListener('retrievedAllChatRoomIdsAndFriendIdAndLastTextByUserId');
              console.log('data : ', data);
              if (data.error) {
                deferred.reject(data.error);
              } else if (data.result) {
                data.result.forEach(function (/** @prop {String} r.friend_id */r) {
                  var friend = _.find(result, function (f) {
                    return r.friend_id === f.user_id;
                  });
                  chats.push({
                    friend : friend,
                    chat_room_id : r.chat_room_id,
                    last_text : r.last_text
                  });
                });
                deferred.resolve(chats);
              } else {
                chats = [];
                deferred.resolve([]);
              }
            });
          }, function (error) {
            console.log('get friends error : ', error);
            deferred.reject(error);
          });
        } else {
          deferred.resolve(chats);
        }
        return promise;
      },
      remove : function (chat) {
        chats.splice(chats.indexOf(chat), 1);
      },
      getChatRoomIdByUserAndFriend : function (user, friend) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        Socket.emit('retrieveChatRoomIdByUserIdAndToUserId', {
          user_id : user.user_id, to_user_id : friend.user_id
        });
        Socket.on('retrievedChatRoomIdByUserIdAndToUserId', function (data) {
          Socket.removeListener('retrievedChatRoomIdByUserIdAndToUserId');

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

        return promise;
      },
      getToUser : function (userData) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        this.getToUserIdFromLocal(userData).then(function (localResult) {
          UserService.getByUserId(localResult.user_id).then(function (result) {
            deferred.resolve(result);
          }, function (error) {
            console.error('get by user id error : ', error);
            deferred.reject(error);
          });
        }.bind(this), function (localError) {
          console.error('get to user from local error : ', localError);
          this.getToUserIdFromServer(userData).then(function (serverResult) {
            UserService.getByUserId(serverResult.user_id).then(function (result) {
              deferred.resolve(result);
            }, function (error) {
              console.error('get by user id error : ', error);
              deferred.reject(error);
            });
          }, function (serverError) {
            console.error('get to user from server error : ', serverError);
          });
        }.bind(this));

        return promise;
      },
      getToUserIdFromLocal : function (userData) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        $q.when(
          $sqliteService.getFirstItem(
            translateChat.QUERIES.SELECT_TO_USER_ID_BY_CHAT_ROOM_ID_AND_USER_ID,
            [userData.chat_room_id, userData.user_id]
          )
        ).then(function (result) {
          deferred.resolve(result);
        }, function (error) {
          deferred.reject(error);
        });
        return promise;
      },
      getToUserIdFromServer : function (userData) {
        var deferred = $q.defer();
        var promise = deferred.promise;

        Socket.emit('retrieveToUserIdByChatRoomIdAndUserId', {
          chat_room_id : userData.chat_room_id, user_id : userData.user_id
        });
        Socket.on('retrievedToUserIdByChatRoomIdAndUserId', function (data) {
          Socket.removeListener('retrievedToUserIdByChatRoomIdAndUserId');

          if (data.error) {
            deferred.reject(data.error);
          } else {
            deferred.resolve(data.result);
          }
        });

        return promise;
      },
      get : function (chatId) {
        var chatsLength = chats.length;
        var i;
        for (i = 0; i < chatsLength; i++) {
          if (chats[i].id === chatId) {
            return chats[i];
          }
        }
        return null;
      }
    };
  })
  .factory('Friends', function ($q, $sqliteService, Socket) {
    'use strict';

    var friends = [];

    return {
      add : function (userData, friend) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        this.addToServer(userData, friend).then(function (serverResult) {
          console.log('create friend on server success : ', serverResult);
          this.addToLocal(userData, friend).then(function (localResult) {
            console.log('create friend on local success : ', localResult);
            deferred.resolve(localResult);
          }, function (localError) {
            console.error('create friend on local error : ', localError);
            deferred.reject(localError);
          });
        }.bind(this), function (serverError) {
          console.error('create friend on server error : ', JSON.stringify(serverError));
          deferred.reject(serverError);
        });

        return promise;
      },
      addToServer : function (userData, friend) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        Socket.emit('createFriend', {user : userData, friend : friend});
        Socket.on('createdFriend', function (data) {
          Socket.removeListener('createdFriend');
          console.log('creation friend on server', data);
          if (data.error) {
            deferred.reject(data);
          } else {
            deferred.resolve(data);
          }
        });

        return promise;
      },
      addToLocal : function (userData, friend) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        $q.when($sqliteService.executeSql(translateChat.QUERIES.INSERT_FRIEND, [userData.user_id, friend.user_id]))
          .then(function (result) {
            deferred.resolve(result);
          }, function (error) {
            console.error('create friend on local error : ', JSON.stringify(error));
            deferred.reject(error);
          });

        return promise;
      },
      getAll : function (userData) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        $q.when($sqliteService.getItems(translateChat.QUERIES.SELECT_ALL_FRIENDS_BY_USER_ID, [userData.user_id]))
          .then(function (result) {
            console.log('get all friend : ', result);
            deferred.resolve(result);
          }, function (error) {
            console.error('get all friend error : ', error);
            deferred.reject(error);
          });

        return promise;
      },
      get : function (friendId) {
        var usersLength = friends.length;
        var i;
        for (i = 0; i < usersLength; i++) {
          if (friends[i].user_id === friendId) {
            return friends[i];
          }
        }
        return null;
      }
    };
  })
  .factory('Socket', function (socketFactory, Device) {
    'use strict';
    // if use promise then https://gist.github.com/jrthib/4ce016449a29811d71b5
    // var socket = io.connect('http://ihanalee.com:3000');
    var deviceId = Device.getId();
    var server = 'http://192.168.200.114:3000'; // 회사
    // var server = 'http://172.30.1.47:3000'; // 투썸
    // var server = 'http://10.0.1.5:3000'; // 집
    // var server = 'http://192.168.1.48:3000'; // 할리스 커피
    // var server = 'http://172.30.1.30:3000'; // Coffine cafe

    var socket = io.connect(server, {
      query : 'device_id=' + deviceId,
      reconnect : true,
      'reconnection delay' : 500,
      'max reconnection attempts' : 10
    });

    return socketFactory({
      ioSocket : socket
    });
  });
