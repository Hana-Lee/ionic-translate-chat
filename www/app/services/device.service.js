/**
 * @author Hana Lee
 * @since 2016-05-04 13:31
 */
(function () {
  'use strict';

  angular.module('translate-chat').factory('DeviceService', DeviceService);

  DeviceService.$inject = ['$cordovaDevice'];

  /* @ngInject */
  function DeviceService($cordovaDevice) {
    return {
      getId : getId,
      getVersion : getVersion,
      getType : getType,
      getToken : getToken
    };

    function getId() {
      var deviceId = localStorage.getItem('translate-chat-device-id');
      if (deviceId) {
        return deviceId;
      }
      if (!ionic.Platform.isNativeBrowser) {
        return $cordovaDevice.getUUID();
      }
      return new Date().getTime().toString();
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
      var deviceToken = localStorage.getItem('translate-chat-device-token');
      if (deviceToken) {
        return deviceToken;
      }

      return '';
    }
  }

})();
