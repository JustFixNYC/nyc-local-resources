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
  //search criteria:
  $scope.user.org_type = ['legal', 'community', 'govt'];
  $scope.user.userTags = []; //composite of all tags (incl housingType, eligibilityTags, and issueTags)
  $scope.user.housingType = ''; //answer to intake question 1
  $scope.user.housingCourtStatus = ''; //answer to intake question 2
  $scope.user.eligibilityTags = []; //intake question 3
  $scope.user.issueTags = []; //intake question 4
  //eligibility screener status
  $scope.user.finishedIntake = false;
  $scope.user.editSearchOpen = false;
  $scope.user.intakeNavOpen = [false,false,false,false,false];
  $scope.user.intakeNavDisabled = [false, false, false, false, false];
  $scope.user.showBookmarks = false;
  $scope.bookmarks = [];
  $scope.intake = {};
  $scope.intake.eligibility = {
    'income': {tag: 'income', question: 'I receive public assistance', madlibs: 'are low-income'},
    'seniors': {tag: 'seniors', question: 'I am 62 years of age or older', madlibs: 'are 62 years old or older'},
    'disability': {tag: 'disability', question: 'I have a disability', madlibs: 'have a disability'},
    'lgbtq': {tag: 'lgbtq', question: 'I identify as LGBTQ+', madlibs: 'identify as LGBTQ+'},
    'children': {tag: 'children', question: 'I have dependent children', madlibs: 'have dependent children'},
    'health': {tag: 'health', question: 'I face serious/chronic health issues', madlibs: 'have serious health issues'},
  }; //eventually use this to clean up html/reformat madlibs

  $scope.tagDict = {
    'income': 'receives public benefits',
    'seniors':'is 62 years old or older',
    'disability': 'has a disability',
    'lgbtq': 'identifies as LGBTQ+',
    'children': 'has dependent children',
    'health': 'has serious health issues',
    'RS': 'rent-stabilized',
    'MR': 'market-rate',
    'SSH': 'senior/supportive',
    'SL': 'sublet',
    'ML': 'Mitchell-lama',
    'NYCHA': 'NYCHA/Section 8',
    'o': ' ',
    'eviction': 'eviction',
    'repairs': 'getting repairs',
    'overcharge': 'rent overcharge',
    'rent': 'paying rent',
    'lease': 'lease renewal',
    'succession': 'succession rights',
    'benefits': 'subsidies/benefits',
    'harassment': 'landlord harassment',
    'rights': 'learning about tenant rights',
    'organizing': 'organizing tenants',
    court_status: {
      true : 'active court case',
      false : 'no case'
    }
    //'mediation': 'tenant-landlord mediation'
  }

  $scope.colorCodeOrgType = {
    'community' : 'color:#CD4968',
    'legal' : 'color:#FD7603',
    'govt' : 'color:#0096D7'
  }


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
  $scope.searchAddr = function(callback) {
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
        if (callback && $location.search().search) callback(); //only open search once address has been loaded- this is not working
        $scope.$apply();
      } else {
        $scope.error = true;
        $scope.$apply();
        if(typeof Rollbar !== "undefined") { Rollbar.error("Geocode was not successful for the following reason: " + status); }
        console.error('Geocode was not successful for the following reason: ' + status);
        $scope.user.editSearchOpen = false;
        $location.search('edit', false);
      }
    });
  };

  $scope.searchGeolocation = function(callback) {
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
          $location.search('search', $scope.user.address); //changed
          console.log('address: ', $scope.user.address);
          $scope.user.borough = getUserBorough(results[0].formatted_address);
          ga('send', 'event', 'Map', 'geolocation', 'Initial');
          // $log.info('GEOCODED=' + results[0].formatted_address);
          if(typeof Rollbar !== "undefined") {
            Rollbar.info("Geocoded", {
              found: results[0].formatted_address
            });
          }
          if (callback && $location.search().search) callback(); //only open search once address has been loaded- this is not working
          $scope.$apply();
        } else {
          $scope.error = true;
          $scope.user.loadingLoc = false;
          $scope.$apply();
          console.error('Geocode was not successful for the following reason: ' + status);
        }
      });
    });
  };

  //Opens the panel at panelNum of eligibility screener accordion
  $scope.openPanel = function(panelNum){
    //if ($scopeuser.intakeNavOpen[panelNum]) $scope.user.intakeNavOpen[panelNum] = false;
    $scope.user.intakeNavOpen = [false,false,false,false,false];
    $scope.user.intakeNavOpen[panelNum] = true;
    $scope.user.intakeNavDisabled[panelNum] = false;
    console.log ('panels: ', panelNum);
  }

  //Returns true if array arr contains element tag
  $scope.containsTag = function(arr, tag){
    return (arr.indexOf(tag) > -1);
  }

  //Toggles inclusion of element 'tag' in array 'arr'
  $scope.updateTags = function(arr, tag){
    if ($scope.containsTag(arr, tag)){
      arr.splice(arr.indexOf(tag), 1); //remove existing tag
    }
    else{
      arr.push(tag); //add new tag
    }
  }

//Toggles search based on org_type filters applied
  $scope.toggleOrgType = function(type) {
    $scope.updateTags($scope.user.org_type,type);
    $location.search('type', $scope.user.org_type);
    $scope.update(); //updates entire search (re-calls query)
  };

//Assigns selected housing type
  $scope.updateHousingType = function(tag){
    $location.search('housing', tag);
    $scope.user.housingType = tag;
    $scope.user.intakeNavDisabled[1] = false;
    //console.log('user tags: ', $scope.user.userTags);
  }
  $scope.updateHousingCourt = function(status){
    $location.search('court', status);
    $scope.user.housingCourtStatus = status;
    //console.log('housing court status: ', $scope.user.housingCourtStatus);
  }
  $scope.updateEligibilityTags = function(tag){
    $scope.updateTags($scope.user.eligibilityTags, tag);
    $location.search('issues', $scope.user.eligibilityTags);
    console.log('adding tag ', tag);
  }
  $scope.updateIssueTags = function(tag){
    $scope.updateTags($scope.user.issueTags, tag);
    $location.search('issues', $scope.user.issueTags);
    //adds "mediation" tag if any of the following issue tags are selected by user
    /*if (['repairs', 'overcharge', 'rent', 'lease', 'succession', 'harassment'].indexOf('mediation') == -1 && (!$scope.containsTag($scope.user.issueTags, 'mediation'))) {
      $scope.user.issueTags.push('mediation');
    }*/
    $location.search('you', $scope.user.eligibilityTags);
  }

//togggles whether or not the eligibility screener is showing/hidden
  $scope.toggleSearch = function(){
    console.log('toggling search');
    $scope.user.editSearchOpen = !$scope.user.editSearchOpen;
    $location.search('edit',$scope.user.editSearchOpen);
  }

  //Update function is called when search parameters of eligibility screener are completed or edited, to make a new query
  $scope.update = function() {
    $scope.user.finishedIntake = true;
    $scope.user.editSearchOpen = false;
    $scope.user.intakeNavDisabled = [false, false, false, false, false];
    $location.search('done', true);
    $location.search('edit', false);
    var lat = $scope.user.lat;
    var lng = $scope.user.lng;
    $scope.user.userTags = [$scope.user.housingType].concat( $scope.user.issueTags, $scope.user.eligibilityTags); //assembles user tag array
    console.log('USER TAGS ARRAY: ', $scope.user.userTags);
    $scope.updateCartoMap(lat, lng, $scope.user.org_type, $scope.user.housingCourtStatus, $scope.user.userTags);
    $scope.updateCartoList(lat, lng, $scope.user.org_type, $scope.user.housingCourtStatus, $scope.user.userTags);
    console.log('query for ', $scope.user.org_type, ' org type for housing type ', $scope.user.housingType, ' and status in housing court ', $scope.user.housingCourtStatus, ' specializing in ', $scope.user.eligibilityTags);
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
      }
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

//If single search param is encoded as a string instead of array, use this function to convert to array before assigning to an array type
  var stringToArray = function(object){
    if (typeof object == "string") object = [object];
    return object;
  }

  //Load data from url based on pre-existing search parameters
  if($location.search().search) {
    console.log('ADDRESS', $location.search().search);
    $scope.user.address = $location.search().search;
    $scope.searchAddr();
  }
  if($location.search().type) {
    $scope.user.org_type = stringToArray($location.search().type);
    console.log('ORG TYPE', $scope.user.org_type);
  }
  if($location.search().housing){
    $scope.user.housingType = $location.search().housing;
    console.log('HOUSING TYPE', $scope.user.housingType);
  }
  if($location.search().court){
    $scope.user.housingCourtStatus = ($location.search().court == true);
    console.log('COURT STATUS', $scope.user.housingCourtStatus);
  }
  if($location.search().you){
    $scope.user.eligibilityTags = stringToArray($location.search().you);
    console.log('ELIGIBILITY', $scope.user.eligibilityTags);
  }
  if($location.search().issues){
    $scope.user.issueTags = stringToArray($location.search().issues);
    console.log('ISSUE TAGS', $scope.user.issueTags);
  }
  if($location.search().done){
    $scope.user.finishedIntake = $location.search().done;
  }
  if($location.search().edit){
    $scope.user.editSearchOpen = $location.search().edit;
  }

}]);
