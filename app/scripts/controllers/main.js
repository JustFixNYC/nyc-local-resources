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
  $scope.bookmarks = []; //when bookmark feature is added, add cartodb_id to this array
  $scope.intake = {};

  //Housing tags and their translations for display

  /*tag: recorded in arrays
    question: text for buttons in intake form
    madlibs: text for "madlibs" section and display on accordion headers*/
  $scope.intake.housing = {
    'RS': {tag: 'RS', question: 'Rent-stabilized', madlibs: 'rent-stabilized'},
    'MR': {tag: 'MR', question: 'Market-rate', madlibs:'market-rate'},
    'SSH': {tag: 'SSH', question: 'Senior/supportive housing', madlibs: 'senior/supportive'},
    'SL': {tag: 'SL', question: 'Sublet', madlibs: 'sublet'},
    'ML': {tag: 'ML', question: 'Mitchell-lama', madlibs: 'Mitchell-lama'},
    'NYCHA': {tag: 'NYCHA', question: 'NYCHA/public housing', madlibs: 'NYCHA/public'},
    'SECT8': {tag: 'SECT8', question: 'Section 8 voucher', madlibs: 'Section 8 voucher'},
    'otherhousing': {tag: 'otherhousing', question: 'Other/Unsure', madlibs: 'other'}
  }

  //Eligibility tags and their translations for display
  $scope.intake.court = {
    true : 'in an active court case',
    false : 'not in a court case'
  }

  //Eligibility tags and their translations for display
  $scope.intake.eligibility = {
    'income': {tag: 'income', question: 'I receive public assistance', madlibs: 'receives public benefits'},
    'seniors': {tag: 'seniors', question: 'I am 62 years of age or older', madlibs: 'is 62 years old or older'},
    'disability': {tag: 'disability', question: 'I have a disability', madlibs: 'has a disability'},
    'lgbtq': {tag: 'lgbtq', question: 'I identify as LGBTQ+', madlibs: 'identifies as LGBTQ+'},
    'children': {tag: 'children', question: 'I have dependent children', madlibs: 'has dependent children'},
    'health': {tag: 'health', question: 'I face serious/chronic health issues', madlibs: 'has serious health issues'},
  }; //eventually use this to clean up html/reformat madlibs

  //Issue tags and their translations for display
  $scope.intake.issues = {
    'eviction': {tag: 'eviction', question: ($scope.user.housingCourtStatus===true) ? 'Eviction' : 'Eviction Prevention', madlibs: 'eviction'},
    'repairs': {tag: 'repairs', question: 'Getting repairs', madlibs: 'getting repairs'},
    'overcharge': {tag: 'overcharge', question: 'Rent overcharge', madlibs: 'rent overcharge'},
    'rent': {tag: 'rent', question: 'Paying my rent', madlibs: 'rent overcharge'},
    'lease': {tag: 'lease', question: 'Lease Renewal', madlibs: 'lease renewal'},
    'succession': {tag: 'succession', question: 'Succession rights', madlibs: 'succession'},
    'benefits': {tag: 'benefits', question: 'Subsidies/benefits', madlibs: 'subsidies/benefits'},
    'harassment': {tag: 'harassment', question: 'Landlord harassment', madlibs: 'landlord harassment'},
    'rights': {tag: 'rights', question: 'Learning my tenant rights', madlibs: 'learning my tenant rights'},
    'organizing': {tag: 'organizing', question: 'Organizing my building', madlibs: 'tenant organizing'},
    'scrie': {tag: 'scrie', question: 'Applying for SCRIE/DRIE', madlibs: 'applying for SCRIE/DRIE'},
    'otherissue': {tag: 'otherissue', question: 'Other issues', madlibs: 'other issues'}
  };

  //array of tags that should not be displayed in referral cards:
  $scope.hiddenTags = ['income', 'RS', 'MR', 'SSH', 'SL', 'ML', 'otherissue', 'otherhousing'];

  //mini-database of hotlines -- as more are added consider making an external database or integrating with database
  $scope.hotlines = [
    {
      'tag': 'HCR',
      'organization': 'New York State Homes and Community Renewal (HCR)',
      'contact_information': '7187396400',
      'services': 'HCR enforces the housing laws regarding rent-controlled or rent-stabilized apartments. Contact HCR to investigate rent overcharges, succession rights, and access rental history.'
    },
    {
      'tag': 'HCA',
      'organization' : 'Housing Court Answers',
      'contact_information': '2129624795',
      'hours': 'Mon-Thurs, 9am - 5pm',
      'services': 'Provides information about Court procedures, landlord/tenant rules and regulations, enforcement of housing code violations, referrals for free legal help, and referrals to community organizations that help with housing problems.'
    },
    {
      'tag': 'MetCouncil',
      'organization': 'MetCouncil on Housing',
      'contact_information': '2129790611',
      'hours': 'Mon-Wed 1:30 - 8:00pm; Fridays 1:30pm - 5pm',
      'services': 'The Metropolitan Council on Housing tenant rights telephone hotline is free and open to any tenant living in New York City.'
    }
  ]

  if(!$window.Geocoder) {
    if(typeof Rollbar !== "undefined") { Rollbar.error("No geocoder set."); }
    console.error('warning: no geocoder set');
  } else {
    var boundsNYC = new google.maps.LatLngBounds(
      new google.maps.LatLng('40.496044', '-74.255735'),
      new google.maps.LatLng('40.915256', '-73.700272')
    );
  }

  //main function:
  $scope.searchAddr = function() {
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
        $location.search('search', results[0].formatted_address); //updates url with user address
        if(typeof Rollbar !== "undefined") {
          Rollbar.info("Search", {
            searched: $scope.user.address,
            found: results[0].formatted_address
          });
        }
        ga('send', 'event', 'Map', 'search-found', 'Initial');
        $scope.$apply();
      } else {
        $scope.error = true;
        $scope.$apply();
        if(typeof Rollbar !== "undefined") { Rollbar.error("Geocode was not successful for the following reason: " + status); }
        //if address fails, don't open search
        $scope.user.editSearchOpen = false;
        $location.search('edit', false);
      }
    });
  };

  $scope.searchGeolocation = function(callback) {
    $scope.user.loadingLoc = true;
    getGeolocation(function (pos) {
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
          $scope.user.borough = getUserBorough(results[0].formatted_address);
          ga('send', 'event', 'Map', 'geolocation', 'Initial');
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
    update(); //updates entire search (re-calls query)
  };

  //Assigns selected housing type to stored variable
  $scope.updateHousingType = function(tag){
    $location.search('housing', tag);
    $scope.user.housingType = tag;
    $scope.user.intakeNavDisabled[1] = false;
  }
  //Assigns selected housing court status to stored variable
  $scope.updateHousingCourt = function(status){
    $location.search('court', status);
    $scope.user.housingCourtStatus = status;
  }
  //Assigns selected tags to stored array of eligibility
  $scope.updateEligibilityTags = function(tag){
    $scope.updateTags($scope.user.eligibilityTags, tag);
    $location.search('you', $scope.user.eligibilityTags);
  }
  //Assigns selected tags to stored array of issues
  $scope.updateIssueTags = function(tag){
    $scope.updateTags($scope.user.issueTags, tag);
    $location.search('issues', $scope.user.issueTags);
  }
  //Settings when user edits search from output page
  $scope.editSearch = function(){
    toggleSearch();
    $scope.user.intakeNavDisabled = [false, false, false, false, false];
  }

  //Settings when user exits eligibility screener and views updated output
  $scope.doneSearch = function(){
    toggleSearch();
    $scope.user.org_type = ['legal','community', 'govt'];
    update();
  }

  //Settings when user begins screener for the first time
  $scope.openIntake = function(){
    $scope.searchAddr();
    toggleSearch();
    $scope.openPanel(1);
    $scope.user.intakeNavDisabled = [false, false, true, true, true];
  }

  //togggles whether or not the eligibility screener is showing/hidden
  var toggleSearch = function(){
    $scope.user.editSearchOpen = !$scope.user.editSearchOpen;
    $location.search('edit',$scope.user.editSearchOpen);
  }

  //Update function is called when search parameters of eligibility screener are completed or edited, to make a new query
  var update = function() {
    $scope.user.finishedIntake = true;
    $scope.user.editSearchOpen = false;
    $scope.user.intakeNavDisabled = [false, false, false, false, false];
    $location.search('done', true);
    $location.search('edit', false);
    var lat = $scope.user.lat;
    var lng = $scope.user.lng;
    $scope.user.userTags = [$scope.user.housingType].concat( $scope.user.issueTags, $scope.user.eligibilityTags); //assembles user tag array
    $scope.updateCartoMap(lat, lng, $scope.user.org_type, $scope.user.housingCourtStatus, $scope.user.userTags);
    $scope.updateCartoList(lat, lng, $scope.user.org_type, $scope.user.housingCourtStatus, $scope.user.userTags);
  };

  $scope.updateCartoList = function(lat, lng, orgType, housingCourtStatus, userTags) {
    CartoDB.queryByLatLng(lat, lng, orgType, housingCourtStatus, userTags)
    .done(function (data) {
      if(data.rows.length == 0) {
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
    $scope.user.address = $location.search().search;
    $scope.searchAddr();
  }
  if($location.search().type) {
    $scope.user.org_type = stringToArray($location.search().type);
  }
  if($location.search().housing){
    $scope.user.housingType = $location.search().housing;
  }
  if($location.search().court){
    $scope.user.housingCourtStatus = ($location.search().court == true);
  }
  if($location.search().you){
    $scope.user.eligibilityTags = stringToArray($location.search().you);
  }
  if($location.search().issues){
    $scope.user.issueTags = stringToArray($location.search().issues);
  }
  if($location.search().done){
    $scope.user.finishedIntake = $location.search().done;
  }
  if($location.search().edit){
    $scope.user.editSearchOpen = $location.search().edit;
  }

}]);
