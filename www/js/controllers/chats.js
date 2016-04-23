/**
 * @author Hana Lee
 * @since 2016-04-23 20:46
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
/*global angular */

angular.module('translate-chat.chats-controller', [])
  .controller('ChatsCtrl', function ($scope, Chats) {
    'use strict';

    $scope.chats = Chats.all();
    $scope.remove = function (chat) {
      Chats.remove(chat);
    };
  });
