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

  //var cartoUrl = "https://dan-kass.cartodb.com/api/v2/sql?q=";
  //var cartoSQL = new cartodb.SQL({ user: 'dan-kass' });
  var cartoSQL = new cartodb.SQL({ user: 'mayuka' }); //changed user

  // sql.execute(query)
  //   .done(function(data) {
  //     console.log(data.rows);
  //   })
  //   .error(function(errors) {
  //     // errors contains a list of errors
  //     console.log("errors:" + errors);
  //   });

  /* public functions */
  return {
    queryByLatLng: function(lat, lng, orgType, housingCourt, userTags) {

      //var boroughString = borough ? '' : 'NOT';
      var orgString = orgType.toString();
      console.log(orgString, ' <<ORG TYPE STRING');
      //var housingCourt = false;
      var housingCourtStatusQuery = housingCourt ? ' AND loc.housing_court = true' : '';
      var userTagString = userTags.toString();
      var mediationTags = ['repairs', 'rent', 'overcharge', 'renewal', 'harassment'];
      var mediation = 0;
      for (var tag in mediationTags){
        if (userTags.indexOf(mediationTags[tag]) > -1) mediation = mediation + 1;
        console.log(mediationTags[tag]);
      }
      // var query = "SELECT *, row_number() OVER (ORDER BY dist) as rownum FROM ( SELECT bcl.organization, bcl.contact_information, bcl.address, bcl.services, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, bcl.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM brooklyn_cbos_locations AS bcl, brooklyn_cbos AS bc WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), bc.the_geom ) AND bc.cartodb_id = bcl.cartodb_id AND bc.service_area_type " + boroughString + " IN ('borough') ORDER BY dist ASC ) T";

      //var query = "SELECT *, row_number() OVER (ORDER BY dist) as rownum FROM ( SELECT loc.organization, loc.contact_information, loc.address, loc.services, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, loc.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM nyc_cbos_locations_2 AS loc, nyc_cbos_service_areas AS sa WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), sa.the_geom ) AND loc.organization = sa.organization AND loc.org_type IN ('" + orgString + "') ORDER BY dist ASC ) T LIMIT 10";

      /*
      var query = "SELECT *, row_number() OVER (ORDER BY dist ASC, score DESC) as rownum FROM ( SELECT loc.organization, loc.contact_information, loc.address, loc.services, loc.requirements, loc.housing_court, char_length(tags) AS score, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, loc.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM nyc_cbos_locations_FINAL AS loc, nyc_cbos_service_areas_copy_new_entries AS sa WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), sa.the_geom ) AND (position(loc.requirements in '" +userTagString+ "') != 0 OR loc.requirements = '') AND loc.organization = sa.organization "+ housingCourtStatusQuery + " AND (position(loc.org_type in '" + orgString + "') != 0 )) T LIMIT 20"; //currently only works for a single requirement
      */
      var query = "SELECT *, row_number() OVER ";
      //formula for scoring
      query += "(ORDER BY (legal_score + scope_score + govt_score";
      //all tags in userTags are assigned a score depending on whether or not they were "matched" by organization
      //the sum of all these sub-scores is the total number of tags that were satisfied by the organization
      for (var tag in userTags) {
        query += " + "+userTags[tag]+"";
      }

      //Control ordering score by subtracting distance, so that organizations that have a smaller distance will yield a bigger score
      query +=") - dist DESC) as rownum FROM ( "; //add variable for dist weight

      //all the variables we want from the database
      query += "SELECT loc.organization, loc.contact_information, loc.address, loc.services, loc.requirements, loc.housing_court, loc.website, loc.hours, loc.org_type, loc.tags, loc.cartodb_id, ";

      //if there is an active housing court case, put legal orgs at the top
      //if not, "penalize" legal orgs by putting them at the bottom
      query += housingCourt ? "case when (loc.org_type='legal') then 3 else 0 end " : (userTags.indexOf('eviction') > -1 ? "case when (loc.org_type='legal') then -5 else 0 end " : "case when (loc.org_type='legal') then -5 else 5 end ");
      query += "as legal_score, ";

      //for every user tag, assign a score of 1 to the tag if the org satisfies that tag, and 0 if it doesn't
      //to customize weights, add "tag weights" to tagDict and replace 1 with tag weight variable
      for (var tag in userTags) {
        query += userTags.indexOf(userTags[tag]) > -1 ? "case when (position('"+userTags[tag]+"' in loc.tags) != 0) then 1 else 0 end as "+userTags[tag]+", " : "0 as "+userTags[tag]+", ";
      }

      //if
      query += "case when (position(loc.requirements in '" +userTagString+ "') != 0) then 2 else 0 end as scope_score, ";
      query += "round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, loc.the_geom::geography ) / 1609)::numeric, 1 ) AS dist, ";
      //put elected officials at the bottom of the list
      query += orgString.indexOf('govt') > -1 ? "case when (loc.org_type='govt') then -10 else 0 end as govt_score " : "0 as govt_score ";

      query += "FROM nyc_cbos_locations_master_9_14_17 AS loc, final_nyc_cbos_service_areas_copy_new_entries_copy AS sa ";

      //check if address is in catchment area of organization
      query += "WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), sa.the_geom ) ";


      query += "AND (position(loc.requirements in '" +userTagString+ "') != 0 OR loc.requirements = '') ";
      query += "AND loc.organization = sa.organization ";
      query += housingCourt ? ' AND loc.housing_court = true' : '';
      query +=" AND (position(loc.org_type in '" + orgString + "') != 0 )) ";

      //number of results shown
      query += "T LIMIT 20";







      /*
      var query = "SELECT *, row_number() OVER (ORDER BY (((legal_score + eviction_relevance)*"+ evictionScore +") + mediation_score*" + mediation + " + scope_score) DESC, dist ASC) as rownum FROM ( SELECT loc.organization, loc.contact_information, loc.address, loc.services, loc.requirements, loc.housing_court, loc.website, loc.hours, loc.org_type, loc.tags, loc.cartodb_id, case when (loc.org_type='legal') then 2 else 0 end as legal_score, case when (position('eviction' in loc.tags) != 0) then 2 when (position('eviction' in loc.services) != 0) then 2 else 0 end as eviction_relevance, case when (position(loc.requirements in '" +userTagString+ "') != 0) then 2 else 1 end as scope_score, case when (position('mediation' in loc.tags) != 0) then 2 else 0 end as mediation_score, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, loc.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM nyc_cbos_locations_master_9_9_17 AS loc, nyc_cbos_service_areas_copy_new_entries AS sa WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), sa.the_geom ) AND (position(loc.requirements in '" +userTagString+ "') != 0 OR loc.requirements = '') AND loc.organization = sa.organization "+ housingCourtStatusQuery + " AND (position(loc.org_type in '" + orgString + "') != 0 )) T LIMIT 20";
*/

//case when (position(loc.requirements in '" +userTagString+ "') != 0 AND loc.requirements != '') then 2 else 1 as scope_score

      //for (tag in userTags) if (tag in loc.tags) score++
      //(SELECT loc.org_type as org, case when (org='legal') then 20 else 1 end) as legal,


      console.log('LIST QUERY: ', query);
      return cartoSQL.execute(query);
    },
    getSQL: function() { return cartoSQL; }
  };
}]);
