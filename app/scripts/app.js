'use strict';

/**
 * @ngdoc overview
 * @name localResourcesApp
 * @description
 * # localResourcesApp
 *
 * Main module of the application.
 */
angular
  .module('localResourcesApp', [
    'ngAnimate',
    'ngTouch'
  ]).run(['$rootScope', '$window', function($rootScope, $window) {

    // $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
    //   if(Authentication.user && toState.name === 'home') {
    //     event.preventDefault();
    //     $state.go('listActions');
    //   }
    // });
    //
    // $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    //   $window.scrollTo(0, 0);
    // });
  }
]);
