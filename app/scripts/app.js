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
    'ngTouch',
    'logglyLogger',
    'ui.router'
  ]).config( function( LogglyLoggerProvider ) {
	   LogglyLoggerProvider.inputToken( '664962ee-b2be-41fa-bda6-86ea45769419	' ).sendConsoleErrors(true).logToConsole(false);
  })
  .config(function($stateProvider, $urlRouterProvider) {
    //
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/");
    //
    // Now set up the states
    $stateProvider
      .state('home', {
        url: "/",
        templateUrl: "views/main.html"
      })
      .state('about', {
        url: "/about",
        templateUrl: "views/about.html"
      });
  })
  .run(['$rootScope', '$window', 'LogglyLogger', '$log', function($rootScope, $window, LogglyLogger, $log) {

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
