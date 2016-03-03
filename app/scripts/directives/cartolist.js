'use strict';

/**
 * @ngdoc directive
 * @name localResourcesApp.directive:cartoList
 * @description
 * # cartoList
 */
angular.module('localResourcesApp')
  .directive('cartoList', function () {
    return {
      template: '<div></div>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        element.text('this is the cartoList directive');
      }
    };
  });
