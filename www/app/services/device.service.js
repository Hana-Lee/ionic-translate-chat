/**
 * @author Hana Lee
 * @since 2016-05-04 13:31
 */
(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('DeviceService', DeviceService);

  DeviceService.$inject = ['$cordovaDevice', 'SocketService', 'STORAGE_KEYS'];

  function DeviceService($cordovaDevice, SocketService, STORAGE_KEYS) {
    return {
      getId : getId,
      getVersion : getVersion,
      getType : getType,
      getToken : getToken,
      setToken : setToken,
      updateToken : updateToken
    };

    function getId() {
      var deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      if (deviceId) {
        return deviceId;
      }

      if (!ionic.Platform.isNativeBrowser) {
        deviceId = $cordovaDevice.getUUID();
      } else {
        deviceId = new Date().getTime().toString();
      }

      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);

      return deviceId;
    }

    function getVersion() {
      if (ionic.Platform.isNativeBrowser) {
        return window.navigator.appVersion;
      }
      return ionic.Platform.version();
    }

    function getType() {
      if (ionic.Platform.isNativeBrowser) {
        return 'WEB_BROWSER';
      }
      return ionic.Platform.platform().toUpperCase();
    }

    function getToken() {
      var deviceToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (deviceToken) {
        return deviceToken;
      }

      return '';
    }

    function setToken(token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }

    function updateToken(user) {
      SocketService.emit('updateDeviceToken', {user : user});
    }
  }

})();
