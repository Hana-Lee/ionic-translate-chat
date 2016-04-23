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
/*global angular, ionic, io */
angular.module('translate-chat.services', ['ionic'])

  .service('UserService', function ($q, $sqliteService) {
    'use strict';

    this.createUser = function (username, Socket) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      var query = "Select * FROM Users";
      console.log('get data', $q.when($sqliteService.getItems('SELECT * FROM Users')));

      Socket.emit('createUser', {username : username});
      Socket.on('createdUser', function (data) {
        var result = $sqliteService.executeSql(
          'INSERT INTO Users (user_id, user_name) VALUES (?, ?)', [data.user_id, data.user_name]
        );

        if (result) {
          deferred.resolve('OK');
        }
      });
      return promise;
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
  .factory('Friends', function () {
    'use strict';

    console.log('friends service');
  })
  .factory('User', function () {
    'use strict';

    console.log('User service');
  })
  .factory('Users', function () {
    'use strict';
    var hana = {
      id : '204adf928ce0ea2449d03a5d07707021',
      name : '이하나',
      face : 'img/hana.jpg',
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

    return {
      all : function () {
        return users;
      },
      get : function (userId) {
        var usersLength = users.length;
        var i;
        for (i = 0; i < usersLength; i++) {
          if (users[i].id === userId) {
            return users[i];
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
