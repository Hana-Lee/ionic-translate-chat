/**
 * @author Hana Lee
 * @since 2016-05-04 15:04
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('SocketService', SocketService);

  SocketService.$inject = ['socketFactory', 'CONFIG', 'STORAGE_KEYS'];

  function SocketService(socketFactory, CONFIG, STORAGE_KEYS) {
    var server = CONFIG.serverUrl + ':' + CONFIG.serverPort;
    var options = {
      reconnect : true,
      'reconnection delay' : 500,
      'max reconnection attempts' : 10
    };
    var user = localStorage.getItem(STORAGE_KEYS.USER);
    console.log('socket service : ', user);
    if (user) {
      options.query = 'user_id=' + JSON.parse(user).user_id;
    }
    var socket = io.connect(server, options);

    return socketFactory({
      ioSocket : socket
    });
  }
})();
