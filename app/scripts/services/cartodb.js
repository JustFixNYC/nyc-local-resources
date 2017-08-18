'use strict';

/**
* @ngdoc service
* @name localResourcesApp.cartoDB
* @description
* # cartoDB
* Service in the localResourcesApp.
*/
angular.module('localResourcesApp')
.service('CartoDB', [function () {
  var cartoSQL = new cartodb.SQL({ user: 'mayuka' }); //change user here
  var locations_database = 'nyc_cbos_locations_master_9_14_17'; //name of carto database with locations
  var catchment_database = 'final_nyc_cbos_service_areas_copy_new_entries_copy'; //name of carto database with service areas

  /* public functions */
  return {
    queryByLatLng: function(lat, lng, orgType, housingCourt, userTags) {
      var orgString = orgType.toString();
      var housingCourtStatusQuery = housingCourt ? ' AND loc.housing_court = true' : '';
      var userTagString = userTags.toString();

      /*BUILD CARTO QUERY*/

      var query = "SELECT *, row_number() OVER ";
      //formula for scoring
      query += "(ORDER BY (legal_score*scope_score*govt_score";

      //all tags in userTags are assigned a score depending on whether or not they were "matched" by organization
      //the sum of all these sub-scores is the total number of tags that were satisfied by the organization
      for (var tag in userTags) {
        query += " + "+userTags[tag]+""; //bonus points added for each matching tag
      }

      //Control ordering score by subtracting distance, so that organizations that have a smaller distance will yield a bigger score
      query +=")/(dist+.5) DESC) as rownum FROM ( "; //add .5 to distance to prevent  division by zero

      //all the variables we want from the database
      query += "SELECT loc.organization, loc.contact_information, loc.address, loc.services, loc.requirements, loc.housing_court, loc.website, loc.hours, loc.org_type, loc.tags, loc.cartodb_id, ";

      //if there is an active housing court case, put legal orgs at the top
      //if not, "penalize" legal orgs by putting them at the bottom
      query += housingCourt ? "case when (loc.org_type='legal') then 3 else 1 end " : (userTags.indexOf('eviction') > -1 ? "case when (loc.org_type='legal') then .2 else 5 end " : "case when (loc.org_type='legal') then .1 else 10 end ");
      query += "as legal_score, ";

      //for every user tag, assign a score of 1 to the tag if the org satisfies that tag, and 0 if it doesn't
      //to customize weights, add "tag weights" to intake dictionaries and replace 1 with tag weight variable
      for (var tag in userTags) {
        query += userTags.indexOf(userTags[tag]) > -1 ? "case when (position('"+userTags[tag]+"' in loc.tags) != 0) then 2 else 0 end as "+userTags[tag]+", " : "0 as "+userTags[tag]+", ";
      }

      //if user satisfies requirements, multiply score by 2 (user falls into special scope of organization)
      query += "case when (position(loc.requirements in '" +userTagString+ "') != 0) then 2 else 1 end as scope_score, ";

      //calculate distance between user address and org address
      query += "round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, loc.the_geom::geography ) / 1609)::numeric, 1 ) AS dist, ";

      //put elected officials at the bottom of the list
      query += orgString.indexOf('govt') > -1 ? "case when (loc.org_type='govt') then .05 else 1 end as govt_score " : "1 as govt_score ";

      //aliases for databases
      query += "FROM "+ locations_database +" AS loc, "+ catchment_database +" AS sa ";

      //check if address is in catchment area of organization
      query += "WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), sa.the_geom ) ";


      query += "AND (position(loc.requirements in '" +userTagString+ "') != 0 OR loc.requirements = '') ";

      /*for (tag in userTags) {
        query += "CASE "
        query += "WHEN SUBSTRING(loc.requirements, )"
      }*/

      //matches organizations between location and service area database by name
      query += "AND loc.organization = sa.organization ";

      //if there is an active housing court case, only show orgs tagged as "true" for relevance in housing court
      query += housingCourt ? ' AND loc.housing_court = true' : '';

      //check if org is one of the org types selected by user.
      query +=" AND (position(loc.org_type in '" + orgString + "') != 0 )) ";

      //limits the number of results shown
      query += "T LIMIT 20";

      return cartoSQL.execute(query);
    },
    getSQL: function() { return cartoSQL; }
  };
}]);
