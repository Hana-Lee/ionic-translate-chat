/**
 * @author Hana Lee
 * @since 2016-05-04 15:04
 */

(function () {
  'use strict';

  angular.module('translate-chat').factory('SocketService', SocketService);

  SocketService.$inject = ['socketFactory', 'CONFIG'];

  /* @ngInject */
  function SocketService(socketFactory, CONFIG) {
    var server = CONFIG.serverUrl + ':' + CONFIG.serverPort;

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
