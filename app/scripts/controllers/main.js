'use strict';

/**
 * @ngdoc function
 * @name localResourcesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the localResourcesApp
 */


angular.module('localResourcesApp')
  .controller('MainCtrl', ['$scope', '$window', 'CartoDB', function ($scope, $window, CartoDB) {

    $scope.user = {};
    //$scope.user.address = '654 park place brooklyn';


    if(!$window.Geocoder) alert('warning: no geocoder set');
    //var Geocoder = new google.maps.Geocoder();

    $scope.searchAddr = function() {
      $window.Geocoder.geocode({ 'address': $scope.user.address }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          var lat = results[0].geometry.location.lat();
          var lng = results[0].geometry.location.lng();
          // console.log(lat, lng);
          $scope.update(lat,lng);

        } else {
          alert('Geocode was not successful for the following reason: ' + status);
        }
      });
    };

    $scope.update = function(lat, lng) {
      $scope.updateCartoMap(lat, lng);
      $scope.updateCartoList(lat, lng);
    };

    $scope.updateCartoList = function(lat, lng) {
      CartoDB.queryByLatLng(lat, lng)
        .done(function (data) {
           $scope.resources = data.rows;
           // need to use $apply() because the callback is from cartodb.SQL, not $http
           $scope.$apply();
        }).error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });
      };


}]);
