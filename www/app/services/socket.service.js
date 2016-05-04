/**
 * @author Hana Lee
 * @since 2016-05-04 15:04
 */

(function () {
  'use strict';

  angular.module('translate-chat').factory('SocketService', SocketService);

  SocketService.$inject = ['socketFactory'];

  /* @ngInject */
  function SocketService(socketFactory) {
    // var server = 'http://ihanalee.com:3739'; // 회사
    var server = 'http://192.168.200.114:3000'; // 회사
    // var server = 'http://172.30.1.47:3000'; // 투썸
    // var server = 'http://10.0.1.5:3000'; // 집
    // var server = 'http://192.168.1.48:3000'; // 할리스 커피
    // var server = 'http://172.30.1.30:3000'; // Coffine cafe

    var socket = io.connect(server, {
      reconnect : true,
      'reconnection delay' : 500,
      'max reconnection attempts' : 10
    });

    return socketFactory({
      ioSocket : socket
    });
  }
})();
