/**
 * @author Hana Lee
 * @since 2016-05-05 12:22
 */

(function () {
  'use strict';
  
  angular.module('translate-chat')
    .constant('CONFIG', {
      serverUrl : '@@serverUrl',
      serverPort : '@@serverPort'
    });
})();
