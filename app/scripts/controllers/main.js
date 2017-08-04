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
    //$scope.user.byLegal = false;
    $scope.user.org_type = ['legal', 'community', 'govt'];
    $scope.user.userTags = [];
    $scope.user.housingType = '';
    $scope.user.housingCourtStatus = false;
    $scope.user.eligibilityTags = [];
    $scope.user.issueTags = [];
    $scope.user.finishedIntake = false;
    $scope.user.editSearchOpen = false; //change
    $scope.user.currentIntake = 1;
    $scope.user.intakeNavOpen = [false,true,false,false,false];
    $scope.user.intakeNavDisabled = [false, false, true, true, true];
    //if(!$location.search().showResults) $location.search('showResults', false);

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
          $scope.user.editSearchOpen = true;
          console.log('edit search open is ', $scope.user.editSearchOpen);

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
            $scope.user.editSearchOpen = true;
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
          } else {
            $scope.error = true;
            $scope.user.loadingLoc = false;
            $scope.$apply();
            console.error('Geocode was not successful for the following reason: ' + status);
          }
        });
      });
    };

    $scope.openPanel = function(panel){
      $scope.user.intakeNavOpen = [false,false,false,false,false];
      $scope.user.intakeNavOpen[panel] = true;
      $scope.user.intakeNavDisabled[panel] = false;
      console.log ('panels: ', panel);
    }

    $scope.isPanelOpen = function(panel){
      return ($scope.user.intakeNavOpen[panel]);
    }

    $scope.isPanelDisabled = function(panel){
      return ($scope.user.intakeNavDisabled[panel]);
    }

    $scope.toggleOrgType = function(type) {
      /*if(byLegal) {
        $location.search('type', 'legal');
      } else {
        $location.search('type', 'community');
      }
      $scope.user.byLegal = byLegal;*/
      $scope.updateTags($scope.user.org_type,type);
      $location.search('type', $scope.user.org_type);
      $scope.update();
    };

    $scope.updateHousingType = function(tag){
      $location.search('housing', tag);
      $scope.user.housingType = tag;
      console.log('user tags: ', $scope.user.userTags);
    }
    $scope.updateHousingCourt = function(status){
      $location.search('court', status);
      $scope.user.housingCourtStatus = status;
      console.log('housing court status: ', $scope.user.housingCourtStatus);
      //$scope.update();
    }

    $scope.containsTag = function(arr, tag){
      return (arr.indexOf(tag) > -1);
    }

    $scope.updateTags = function(arr, tag){
      if ($scope.containsTag(arr, tag)){
        arr.splice(arr.indexOf(tag), 1);
        console.log('removed tag: ', tag);
      }
      else{
        arr.push(tag);
      }
    }

    $scope.updateEligibilityTags = function(tag){
      $scope.updateTags($scope.user.eligibilityTags, tag);
      $location.search('you', $scope.user.eligibilityTags);
    }
    $scope.updateIssueTags = function(tag){
      $scope.updateTags($scope.user.issueTags, tag);
      $location.search('issues', $scope.user.issueTags);
    }
//Update function is called when intake screener is completed or edited, to make a new query
    $scope.update = function() {
      $scope.user.finishedIntake = true;
      $scope.user.editSearchOpen = false;
      console.log('edit search open? ', $scope.user.editSearchOpen);
      //document.getElementById("housingType").innerHTML = $scope.user.housingType;
      var lat = $scope.user.lat;
      var lng = $scope.user.lng;
      $scope.user.userTags = [$scope.user.housingType].concat( $scope.user.issueTags, $scope.user.eligibilityTags);
      console.log('USER TAGS ARRAY: ', $scope.user.userTags);
      $scope.updateCartoMap(lat, lng, $scope.user.org_type, $scope.user.housingCourtStatus, $scope.user.userTags);
      $scope.updateCartoList(lat, lng, $scope.user.org_type, $scope.user.housingCourtStatus, $scope.user.userTags);
      console.log('will query for ', $scope.user.org_type, ' org type for housing type ', $scope.user.housingType, ' and status in housing court ', $scope.user.housingCourtStatus, ' specializing in ', $scope.user.eligibilityTags);
    };

    $scope.updateCartoList = function(lat, lng, orgType, housingCourtStatus, userTags) {

      CartoDB.queryByLatLng(lat, lng, orgType, housingCourtStatus, userTags)
        .done(function (data) {
          console.log('FINISHED LIST');
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

    var currentIntakeQuestion = function(num){
      return ($scope.user.currentIntake == num);
    }

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

    $scope.toArray = function(object){
      if (typeof object == "string") object = [object];
      return object;
    }

    if ($location.search().showResults) $location.search('showResults', !$scope.user.finishedIntake && $scope.user.editSearchOpen);

//Load results from url based on pre-existing search parameters
    if($location.search().search) {
      console.log('ADDRESS', $location.search().search);
      $scope.user.address = $location.search().search;
      $scope.searchAddr();
    }
    if($location.search().type) {
      $scope.user.org_type = $scope.toArray($location.search().type);
      console.log('ORG TYPE', $scope.user.org_type);
    }
    if($location.search().housing){
      $scope.user.housingType = $location.search().housing;
      console.log('HOUSING TYPE', $scope.user.housingType);
    }
    if($location.search().court){
      $scope.user.housingCourtStatus = $location.search().court;
      console.log('COURT STATUS', $scope.user.housingCourtStatus);

    }

    if($location.search().you){
      //toArray: If single search param is encoded as a string instead of array, convert to array before assigning to eligibilityTags
      $scope.user.eligibilityTags = $scope.toArray($location.search().you);
      console.log('ELIGIBILITY', $scope.user.eligibilityTags);
    }
    if($location.search().issues){
      $scope.user.issueTags = $scope.toArray($location.search().issues);
      console.log('ISSUE TAGS', $scope.user.issueTags);
    }




}]);
