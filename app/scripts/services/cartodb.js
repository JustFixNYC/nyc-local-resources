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
      queryByLatLng: function(lat, lng, orgType) {

        //var boroughString = borough ? '' : 'NOT';
        var orgString = orgType ? 'legal' : 'community';
        var housingCourt = false;
        var housingCourtStatusQuery = housingCourt ? ' AND loc.housing_court = true' : '';

        var userTags = ['seniors', 'disability', 'health', 'eviction', 'income'];
        var userTagString = userTags.toString();
        console.log(userTagString, ' <<USER TAG STRING');
        // var query = "SELECT *, row_number() OVER (ORDER BY dist) as rownum FROM ( SELECT bcl.organization, bcl.contact_information, bcl.address, bcl.services, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, bcl.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM brooklyn_cbos_locations AS bcl, brooklyn_cbos AS bc WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), bc.the_geom ) AND bc.cartodb_id = bcl.cartodb_id AND bc.service_area_type " + boroughString + " IN ('borough') ORDER BY dist ASC ) T";

        //var query = "SELECT *, row_number() OVER (ORDER BY dist) as rownum FROM ( SELECT loc.organization, loc.contact_information, loc.address, loc.services, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, loc.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM nyc_cbos_locations_2 AS loc, nyc_cbos_service_areas AS sa WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), sa.the_geom ) AND loc.organization = sa.organization AND loc.org_type IN ('" + orgString + "') ORDER BY dist ASC ) T LIMIT 10";


        var query = "SELECT *, row_number() OVER (ORDER BY dist ASC, score DESC) as rownum FROM ( SELECT loc.organization, loc.contact_information, loc.address, loc.services, loc.requirements, loc.housing_court, char_length(tags) AS score, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, loc.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM nyc_cbos_locations_2 AS loc, nyc_cbos_service_areas AS sa WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), sa.the_geom ) AND (position(loc.requirements in '" +userTagString+ "') != 0 OR loc.requirements = '') AND loc.organization = sa.organization "+ housingCourtStatusQuery + " AND loc.org_type IN ('" + orgString + "') ) T LIMIT 5"; //currently only works for a single requirement

        console.log('QUERY: ', query);
        return cartoSQL.execute(query);
      },
      getSQL: function() { return cartoSQL; }
    };
}]);
