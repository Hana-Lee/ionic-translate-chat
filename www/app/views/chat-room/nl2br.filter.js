/**
 * @author Hana Lee
 * @since 2016-05-09 21:07
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .filter('nl2br', nl2br);

  function nl2br() {
    return nl2brFilter;

    function nl2brFilter(data) {
      if (!data) {
        return data;
      }
      return data.replace(/\n\r?/g, '<br />');
    }
  }
})();
