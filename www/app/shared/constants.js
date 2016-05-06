/**
 * @author Hana Lee
 * @since 2016-05-06 11:57
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .constant('STORAGE_KEYS', {
      USER : 'translate-chat-user',
      TOKEN : 'translate-chat-device-token',
      DEVICE_ID : 'translate-chat-device-id',
      FRIENDS : 'translate-chat-friends',
      CHATS : 'translate-chat-chats'
    });
})();
