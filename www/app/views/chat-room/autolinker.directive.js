/**
 * @author Hana Lee
 * @since 2016-05-09 21:08
 */

/*globals Autolinker */
(function () {
  'use strict';

  angular
    .module('translate-chat')
    .directive('autolinker', autolinker);

  autolinker.$inject = ['$timeout'];

  function autolinker($timeout) {
    return {
      restrict : 'A',
      link : link
    };
    function link(scope, element) {
      console.debug('autolinker scope : ', scope);
      $timeout(function () {
        var eleHtml = element.html();

        if (eleHtml === '') {
          return false;
        }

        //noinspection NodeModulesDependencies
        var text = Autolinker.link(eleHtml, {
          className : 'autolinker',
          newWindow : false
        });

        element.html(text);

        var autolinks = element[0].getElementsByClassName('autolinker');
        var autolinksLength = autolinks.length;
        var i;

        function onLinkClick(e) {
          var href = e.target.href;
          console.log('autolinkClick, href: ' + href);

          if (href) {
            window.open(href, '_blank');
          }

          e.preventDefault();
          return false;
        }

        for (i = 0; i < autolinksLength; i++) {
          angular.element(autolinks[i]).bind('click', onLinkClick);
        }
      }, 0);
    }
  }
})();
