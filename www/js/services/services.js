/**
 * @author Hana Lee
 * @since 2016-04-15 14:13
 */
angular.module('translate-chat.services', ['ionic'])

  .factory('Chats', function () {
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
        for (var i = 0; i < chatsLength; i++) {
          if (chats[i].id === chatId) {
            return chats[i];
          }
        }
        return null;
      }
    };
  })
  .factory('Users', function() {
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
        for (var i = 0; i < usersLength; i++) {
          if (users[i].id === userId) {
            return users[i];
          }
        }
        return null;
      }
    };
  })
  .factory('Socket', function (socketFactory) {
    var socket = io.connect('http://ihanalee.com:3000');

    return socketFactory({
      ioSocket : socket
    });
  });
