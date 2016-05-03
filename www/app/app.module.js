/**
 * @author Hana Lee
 * @since 2016-04-15 14:13
 */

/*globals Ionic */
(function () {
  'use strict';
  angular.module('translate-chat',
    [
      'ionic', 'ngCordova',
      'translate-chat.friends-controller',
      'translate-chat.chats-controller',
      'translate-chat.chatRooms-controller',
      'translate-chat.account-controller',
      'translate-chat.services',
      'monospaced.elastic', 'angularMoment', 'btford.socket-io', 'underscore', 'angular-md5'
    ]);
})();
