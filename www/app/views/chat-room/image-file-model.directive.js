/**
 * @author Hana Lee
 * @since 2016-05-09 21:06
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .directive('imageFileModel', imageFileModel);

  imageFileModel.$inject = ['$parse'];

  function imageFileModel($parse) {
    return {
      restrict : 'A',
      link : link
    };

    function link(scope, element, attrs) {
      var model = $parse(attrs.imageFileModel);
      var modelSetter = model.assign;

      element.bind('change', function () {
        scope.$apply(function () {
          modelSetter(scope, element[0].files[0]);
        });
      });
    }
  }
})();
