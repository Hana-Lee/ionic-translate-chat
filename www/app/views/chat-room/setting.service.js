/**
 * @author Hana Lee
 * @since 2016-05-09 21:02
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('SettingService', SettingService);

  SettingService.$inject = ['$q', 'SocketService'];

  function SettingService($q, SocketService) {
    return {
      updateSettings : updateSettings,
      getSettingsList : getSettingsList
    };

    function updateSettings(userData) {
      var deferred = $q.defer();

      SocketService.emit('updateChatRoomSettings', userData);
      SocketService.on('updatedChatRoomSettings', function (data) {
        SocketService.removeListener('updatedChatRoomSettings');

        if (data.error) {
          deferred.reject(data.error);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function getSettingsList(userData) {
      var deferred = $q.defer();

      SocketService.emit('retrieveChatRoomSettingsList', userData);
      SocketService.on('retrievedChatRoomSettingsList', function (data) {
        SocketService.removeListener('retrievedChatRoomSettingsList');

        if (data.error) {
          deferred.reject(data.error);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }
  }

})();
