/**
 * @author Hana Lee
 * @since 2016-05-09 20:14
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('Utils', Utils);

  Utils.$inject = ['md5'];

  function Utils(md5) {
    var _seed = null;

    return {
      createUID : createUID
    };

    function createUID(value) {
      if (!_seed) {
        _seed = new Date().getTime();
      }
      _seed++;

      return md5.createHash(_seed + value);
    }
  }

})();
