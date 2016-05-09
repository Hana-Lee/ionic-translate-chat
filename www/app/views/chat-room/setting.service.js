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
      updateTranslateSetting : updateTranslateSetting,
      getSettingsList : getSettingsList
    };

    function updateTranslateSetting(userData) {
      var deferred = $q.defer();

      SocketService.emit('updateChatRoomSettingsTranslateKo', userData);
      SocketService.on('updatedChatRoomSettingsTranslateKo', function (data) {
        SocketService.removeListener('updatedChatRoomSettingsTranslateKo');

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
