'use strict';

/**
 * @ngdoc function
 * @name localResourcesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the localResourcesApp
 */


angular.module('localResourcesApp')
  .controller('MainCtrl', ['$scope', '$window', '$location', 'CartoDB', function ($scope, $window, $location, CartoDB) {

    $scope.user = {};
    $scope.user.loadingLoc = false;
    $scope.user.byLegal = false;
    if(!$location.search().type) $location.search('type', 'community');

    if(!$window.Geocoder) {
      // $log.info('ERROR: no geocoder set.');
      if(typeof Rollbar !== "undefined") { Rollbar.error("No geocoder set."); }
      console.error('warning: no geocoder set');
    } else {
      var boundsNYC = new google.maps.LatLngBounds(
          new google.maps.LatLng('40.496044', '-74.255735'),
          new google.maps.LatLng('40.915256', '-73.700272')
      );
    }
    //var Geocoder = new google.maps.Geocoder();

//main function:
    $scope.searchAddr = function() {
      // $log.info('SEARCHED=' + $scope.user.address);
      // $window.Geocoder.geocode({ 'address': $scope.user.address }, function(results, status) {
      $window.Geocoder.geocode({
        address: $scope.user.address,
        bounds: boundsNYC
      }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          $scope.user.lat = results[0].geometry.location.lat();
          $scope.user.lng = results[0].geometry.location.lng();
          $scope.error = false;
          $scope.user.address = results[0].formatted_address;
          $scope.user.borough = getUserBorough(results[0].formatted_address);
          // $log.info('FOUND=' + results[0].formatted_address);
          $location.search('search', results[0].formatted_address);
          if(typeof Rollbar !== "undefined") {
            Rollbar.info("Search", {
              searched: $scope.user.address,
              found: results[0].formatted_address
            });
          }
          ga('send', 'event', 'Map', 'search-found', 'Initial');
          $scope.update();
        } else {
          $scope.error = true;
          $scope.$apply();
          if(typeof Rollbar !== "undefined") { Rollbar.error("Geocode was not successful for the following reason: " + status); }
          console.error('Geocode was not successful for the following reason: ' + status);
        }
      });
    };

    $scope.searchGeolocation = function() {
      $scope.user.loadingLoc = true;
      getGeolocation(function (pos) {
        console.log(pos);
        var _lng = pos.coords.longitude;
        var _lat = pos.coords.latitude;
        var latlng = { lat: _lat, lng: _lng };
        $window.Geocoder.geocode({ 'location': latlng }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            $scope.user.lat = results[0].geometry.location.lat();
            $scope.user.lng = results[0].geometry.location.lng();
            $scope.error = false;
            $scope.user.loadingLoc = false;
            $scope.user.address = results[0].formatted_address;
            $scope.user.borough = getUserBorough(results[0].formatted_address);
            ga('send', 'event', 'Map', 'geolocation', 'Initial');
            // $log.info('GEOCODED=' + results[0].formatted_address);
            if(typeof Rollbar !== "undefined") {
              Rollbar.info("Geocoded", {
                found: results[0].formatted_address
              });
            }
            $scope.update();
          } else {
            $scope.error = true;
            $scope.user.loadingLoc = false;
            $scope.$apply();
            console.error('Geocode was not successful for the following reason: ' + status);
          }
        });
      });
    };

    $scope.toggleOrgType = function(byLegal) {
      if(byLegal) {
        $location.search('type', 'legal');
      } else {
        $location.search('type', 'community');
      }
      $scope.user.byLegal = byLegal;
      $scope.update();
    };



    $scope.update = function() {
      var lat = $scope.user.lat;
      var lng = $scope.user.lng;
      $scope.updateCartoMap(lat, lng, $scope.user.byLegal);
      $scope.updateCartoList(lat, lng, $scope.user.byLegal);
    };

    $scope.updateCartoList = function(lat, lng, orgType) {
      CartoDB.queryByLatLng(lat, lng, orgType)
        .done(function (data) {

          if(data.rows.length == 0) {
            // $log.info('NO RESULTS=' + $scope.user.address);
            if(typeof Rollbar !== "undefined") {
              Rollbar.info("No results", {
                address: $scope.user.address
              });
            }
            // orgType = false means trying for community groups
            // if(!orgType) $scope.toggleOrgType(true);
          }

          // if(!borough) $scope.hasLocal = true;
          $scope.resources = data.rows;
          // need to use $apply() because the callback is from cartodb.SQL, not $http
          $scope.$apply();

        }).error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });
      };

    var getUserBorough = function(addr) {
      if(/Brooklyn/i.test(addr)) return 'Brooklyn';
      if(/Queens/i.test(addr)) return 'Queens';
      if(/Manhattan/i.test(addr)) return 'Manhattan';
      if(/Bronx/i.test(addr)) return 'Bronx';
      if(/Staten Island/i.test(addr)) return 'Staten Island';
      return '';
    };

    var getGeolocation = function(callback) {
      if (navigator.geolocation) {
        var timeoutVal = 10 * 1000 * 1000;
        navigator.geolocation.getCurrentPosition(
          callback,
          alertError
        );
      }
      else {
        alert("Geolocation is not supported by this browser");
      }

      function alertError(error) {
        var errors = {
          1: 'Permission denied',
          2: 'Position unavailable',
          3: 'Request timeout'
        };
        alert("Error: " + errors[error.code]);
      }
    };

    if($location.search().search) {
      console.log('search', $location.search().search);
      $scope.user.address = $location.search().search;
      $scope.searchAddr();
    }
    if($location.search().type) {
      switch($location.search().type) {
        case 'legal':
          $scope.user.byLegal = true;
          break;
        case 'community':
          $scope.user.byLegal = false;
          break;
       default:
         $scope.user.byLegal = false;
         break;
      }
    }

}]);
