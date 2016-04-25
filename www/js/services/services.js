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

  .service('UserService', function ($q, $sqliteService, Socket) {
    'use strict';

    this.user = {};
    this.users = [];

    this.createUserOnServer = function (userData) {
      console.log('create user on server', userData);
      var deferred = $q.defer();
      var promise = deferred.promise;

      Socket.emit('createUser', userData);
      Socket.on('createdUser', function (data) {
        if (data.error) {
          deferred.reject(data);
        } else {
          localStorage.setItem('translate-chat-user-id', data.result.user_id);
          localStorage.setItem('translate-chat-user-name', data.result.user_name);
          localStorage.setItem('translate-chat-device-id', data.result.device_id);
          localStorage.setItem('translate-chat-user-info', JSON.stringify(data.result));
          deferred.resolve(data.result);
        }
      }.bind(this));
      return promise;
    };

    this.get = function () {
      this.user = JSON.parse(localStorage.getItem('translate-chat-user-info'));
      return this.user;
    };

    this.createUserOnLocal = function (userData) {
      console.log('create user on local', userData);
      var deferred = $q.defer();
      var promise = deferred.promise;

      $q.when($sqliteService.executeSql(
        translateChat.QUERIES.INSERT_USER,
        [userData.user_id, userData.user_name, userData.device_id, userData.device_type, userData.device_version, '']
      )).then(function (result) {
        deferred.resolve(result);
      }, function (error) {
        deferred.reject(error);
      });

      return promise;
    };

    this.retrieveAlreadyRegisteredUserByDeviceIdOnServer = function (userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      Socket.emit('retrieveAlreadyRegisteredUserByDeviceId', userData);
      Socket.on('retrievedAlreadyRegisteredUserByDeviceId', function (data) {
        console.log('retrieveAlreadyRegisteredUserByDeviceIdOnServer result - service : ', JSON.stringify(data));
        if (data.error) {
          deferred.reject(data);
        } else {
          deferred.resolve(data.result);
        }
      });

      return promise;
    };

    this.retrieveAlreadyRegisteredUserByDeviceIdOnLocal = function (userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      $q.when($sqliteService.getFirstItem(translateChat.QUERIES.SELECT_USER_BY_DEVICE_ID, [userData.device_id]))
        .then(function (result) {
          console.log('select user by device id result : ', JSON.stringify(result));
          deferred.resolve(result);
        }, function (error) {
          console.log('select user by device id error : ', JSON.stringify(error));
          deferred.reject(error);
        });

      return promise;
    };

    this.getAllUserFromServer = function (userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      Socket.emit('retrieveAllUsers');
      Socket.on('retrievedAllUsers', function (data) {
        if (data.error) {
          deferred.reject(data);
        } else {
          this.users = [];
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
        if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
          try {
            return $cordovaDevice.getUUID();
          } catch(e) {
            return null;
          }
        }
        return new Date().getTime().toString();
      },
      getVersion : function () {
        console.log('platform version : ', window.navigator.userAgent);
        if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
          return ionic.Platform.version();
        }
        return window.navigator.userAgent;
      },
      getType : function () {
        console.log('platform type : ', window.navigator.userAgent, ionic.Platform.platform());
        if (ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
          return ionic.Platform.isAndroid() ? 'ANDROID' : 'IOS';
        }
        return window.navigator.userAgent;
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
  .factory('Friends', function ($q, $sqliteService, Socket) {
    'use strict';

    var friends = [];

    return {
      add : function (userData, friend) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        $q.when($sqliteService.executeSql(translateChat.QUERIES.INSERT_FRIEND, [userData.user_id, friend.user_id]))
          .then(function (result) {
            console.log('insert friend on local success : ', result);
            Socket.emit('createFriend', {user : userData, friend : friend});
            Socket.on('createdFriend', function (data) {
              console.log('creation friend on server', data);
              if (data.error) {
                deferred.reject(data);
              } else {
                deferred.resolve(result);
              }
            });
          }, function (error) {
            console.log('insert friend on local error : ', JSON.stringify(error));
            deferred.reject(error);
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
            console.log('insert friend on local error : ', JSON.stringify(error));
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
    var socket = io.connect('http://192.168.200.114:3000', {query:'device_id=' + deviceId});

    return socketFactory({
      ioSocket : socket
    });
  });
