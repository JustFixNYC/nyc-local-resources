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
    var cartoSQL = new cartodb.SQL({ user: 'dan-kass' });

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
      queryByLatLng: function(lat, lng) {
        var query = "SELECT *, row_number() OVER (ORDER BY dist) as rownum FROM ( SELECT bcl.organization, bcl.contact_information, bcl.service_area_type, bcl.address, bcl.services, bcl.neighborhoods, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, bcl.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM brooklyn_cbos_locations AS bcl, brooklyn_cbos AS bc WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), bc.the_geom ) AND bc.cartodb_id = bcl.cartodb_id AND bcl.service_area_type NOT IN ('borough') ORDER BY dist ASC ) T";
        //console.log(query);
        return cartoSQL.execute(query);
      },
      getSQL: function() { return cartoSQL; }
    }
}]);
