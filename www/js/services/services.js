/**
 * @author Hana Lee
 * @since 2016-04-15 14:13
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
/*global angular, ionic, io, translateChat */
angular.module('translate-chat.services', ['ionic'])

  .service('UserService', function ($q, $sqliteService) {
    'use strict';

    this.user = {};

    this.createUserOnServer = function (userData, Socket) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      Socket.emit('createUser', userData);
      Socket.on('createdUser', function (data) {
        deferred.resolve(data);
        this.user.user_id = data.user_id;
        this.user.user_name = data.username;
        this.user.device_id = data.device_id;
        localStorage.setItem('translate-chat-user-id', data.user_id);
        localStorage.setItem('translate-chat-user-name', data.username);
        localStorage.setItem('translate-chat-device-id', data.device_id);
      });
      return promise;
    };

    this.get = function () {
      this.user.user_id = localStorage.getItem('translate-chat-user-id');
      this.user.user_name = localStorage.getItem('translate-chat-user-name');
      this.user.device_id = localStorage.getItem('translate-chat-device-id');

      return this.user;
    };

    this.createUserOnLocal = function (userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      $q.when($sqliteService.executeSql(
        translateChat.QUERIES.INSERT_USER, [userData.user_id, userData.username, userData.device_id]
      )).then(function (result) {
        deferred.resolve(result);
      }, function (error) {
        deferred.reject(error);
      });

      return promise;
    };

    this.retrieveAlreadyRegisteredUserByDeviceIdOnServer = function (userData, Socket) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      Socket.emit('retrieveAlreadyRegisteredUserByDeviceId', userData);
      Socket.on('retrievedAlreadyRegisteredUserByDeviceId', function (data) {
        console.log('retrieveAlreadyRegisteredUserByDeviceIdOnServer result : ', data);
        deferred.resolve(data);
      });

      return promise;
    };

    this.retrieveAlreadyRegisteredUserByDeviceIdOnLocal = function (userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      $q.when($sqliteService.getFirstItem(translateChat.QUERIES.SELECT_USER_BY_DEVICE_ID, [userData.device_id]))
        .then(function (result) {
          console.log('select user by device id result', result);
          deferred.resolve(result);
        }, function (error) {
          console.log('select user by device id error', error, userData);
          deferred.reject(error);
        });

      return promise;
    };

    this.retrieveAlreadyRegisteredUserByUserNameOnServer = function (userData, Socket) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      Socket.emit('retrieveAlreadyRegisteredUserByUserName', userData);
      Socket.on('retrievedAlreadyRegisteredUserByUserName', function (data) {
        console.log('retrieveAlreadyRegisteredUserByUserName result : ', data);
        deferred.resolve(data);
      });

      return promise;
    };

    this.retrieveAlreadyRegisteredUserByUserNameOnLocal = function (userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      $q.when($sqliteService.getFirstItem(translateChat.QUERIES.SELECT_USER_BY_USER_NAME, [userData.username]))
        .then(function (result) {
          console.log('select user by user name result', result);
          deferred.resolve(result);
        }, function (error) {
          console.log('select user by user name error', error, userData);
          deferred.reject(error);
        });

      return promise;
    };
  })

  .factory('Device', function ($cordovaDevice) {
    'use strict';
    return {
      getId : function () {
        if (ionic.Platform.isAndroid() && ionic.Platform.isIOS()) {
          return $cordovaDevice.getUUID();
        }
        return new Date().getTime().toString();
      }
    };
  })

  .factory('Chats', function () {
    'use strict';

    // Might use a resource here that returns a JSON array

    // Some fake testing data
    var chats = [{
      id : 'f1d2067a7e0de9048b0a372653bf140b',
      name : '구여신',
      lastText : '사랑합니다.',
      face : 'img/sarah.png'
    }];

    if (ionic.Platform.isAndroid()) {
      chats[0].name = '이하나';
      chats[0].face = 'img/hana.jpg';
    }

    return {
      all : function () {
        return chats;
      },
      remove : function (chat) {
        chats.splice(chats.indexOf(chat), 1);
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
  .factory('Users', function ($q, Socket) {
    'use strict';

    console.log('User service');
    var users = [];
    return {
      all : function (userData) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        Socket.emit('retrieveAllUsers');
        Socket.on('retrievedAllUsers', function (data) {
          data.forEach(function (user) {
            if (user.user_id !== userData.user_id) {
              users.push(user);
            }
          });
          deferred.resolve(users);
        });
        return promise;
      }
    };
  })
  .factory('Friends', function ($q, $sqliteService) {
    'use strict';
    var hana = {
      id : '204adf928ce0ea2449d03a5d07707021',
      name : '이하나',
      face : 'img/sarah.png',
      lastTime : '04-19'
    };
    var sarah = {
      id : '6bd0303195b3ec9709149a095577e36f',
      name : '구여신',
      face : 'img/sarah.png',
      lastTime : '04-19'
    };
    var users = [];

    if (ionic.Platform.isAndroid()) {
      users.push(hana);
    } else {
      users.push(sarah);
    }

    var friends = [];

    return {
      add : function (userData, friendId) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        $q.when($sqliteService.executeSql(translateChat.QUERIES.INSERT_FRIEND, [userData.user_id, friendId]))
          .then(function (result) {
            deferred.resolve('OK');
        });

        return promise;
      },
      all : function (userData) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        $q.when($sqliteService.getItems(translateChat.QUERIES.SELECT_ALL_FRIENDS_BY_USER_ID, [userData.user_id]))
          .then(function (result) {
            result.map(function (r) {
              r.face = 'img/sarah.png';
              return r;
            });
            deferred.resolve(result);
          }, function (error) {
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
  .factory('Socket', function (socketFactory) {
    'use strict';
    // if use promise then https://gist.github.com/jrthib/4ce016449a29811d71b5
    // var socket = io.connect('http://ihanalee.com:3000');
    var socket = io.connect('http://localhost:3000');

    return socketFactory({
      ioSocket : socket
    });
  });
