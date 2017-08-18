'use strict';

/**
* @ngdoc directive
* @name localResourcesApp.directive:cartoMap
* @description
* # cartoMap
*/

/*
Performs queries to display CARTO map
*/
angular.module('localResourcesApp')
.directive('cartoMap', ['$rootScope', 'CartoDB', function ($rootScope, CartoDB) {
  return {
    restrict: 'E',
    template: '<div id="map" class="panel"></div>',
    scope: false,
    link: function postLink(scope, element, attrs) {

      /*** init map ***/
      var map = L.map('map', {
        scrollWheelZoom: false,
        // center: [40.6462615921222, -73.96270751953125],
        center: [40.7127, -73.96270751953125],
        zoom: 10
      });

      // L.control.attribution.addAttribution('© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>');
      L.Icon.Default.imagePath = "images/leaflet";

      // L.tileLayer('https://{s}.tiles.mapbox.com/v4/dan-kass.pcd8n3dl/{z}/{x}/{y}.png?access_token={token}', {
      //     attribution: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      //     subdomains: ['a','b','c','d'],
      //     token: 'pk.eyJ1IjoiZGFuLWthc3MiLCJhIjoiY2lsZTFxemtxMGVpdnVoa3BqcjI3d3Q1cCJ9.IESJdCy8fmykXbb626NVEw'
      // }).addTo(map);

      // https://github.com/mapbox/mapbox-gl-leaflet
      var gl = L.mapboxGL({
        accessToken: 'pk.eyJ1IjoiZGFuLWthc3MiLCJhIjoiY2lsZTFxemtxMGVpdnVoa3BqcjI3d3Q1cCJ9.IESJdCy8fmykXbb626NVEw',
        style: 'mapbox://styles/dan-kass/cilljc5nu004d9vkngyozkhzb',
        attributionControl: true
      }).addTo(map);

      map.attributionControl.removeFrom(map);
      map.attributionControl.setPrefix('');
      var credits = L.control.attribution().addTo(map);
      credits.addAttribution("© <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a> © <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"); //HTTP FIXED

      // map.on('click', function(e) {
      //     var tempLat = scope.user.lat = e.latlng.lat;
      //     var tempLng = scope.user.lng = e.latlng.lng;
      //     scope.updateCartoMap(tempLat, tempLng, scope.user.byBorough);
      //     scope.updateCartoList(tempLat, tempLng, scope.user.byBorough);
      // });

      var mainSublayer;
      var userMarker;

      /*** init carto layers ***/
      var layerSource = {
        user_name: 'mayuka',
        type: 'cartodb',

        sublayers: [{
          sql: "SELECT * FROM nyc_cbos_locations_final",
          cartocss: "#nyc_cbos_locations_final{marker-fill-opacity:.9;marker-line-color:#FFF;marker-line-width:1;marker-line-opacity:1;marker-placement:point;marker-type:ellipse;marker-width:10;marker-fill:#5F4690;marker-allow-overlap:true}#layer[org_type='community']{marker-fill:#CD4968;}#layer[org_type='legal']{marker-fill:#FD7603;}#layer[org_type='govt']{marker-fill:#0096D7;}"
        }]
      };

      cartodb.createLayer(map, layerSource)
      .addTo(map)
      .done(function(layer) {
        mainSublayer = layer.getSubLayer(0);
        // do stuff
        //console.log("Layer has " + layer.getSubLayerCount() + " layer(s).");
      })
      .error(function(err) {
        // report error
        console.log("An error occurred: " + err);
      });

      scope.updateCartoMap = function(lat, lng, orgType, housingCourt, userTags) {
        var locations_database = 'nyc_cbos_locations_master_9_14_17'; //name of carto database with locations
        var catchment_database = 'final_nyc_cbos_service_areas_copy_new_entries_copy'; //name of carto database with service areas
        var orgString = orgType.toString();
        var housingCourtStatusQuery = housingCourt ? ' AND loc.housing_court = true' : '';
        var userTagString = userTags.toString();
        var prioritizeLegal = (userTags.indexOf('eviction') > -1) ? 1 : 0;

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
        query += "SELECT loc.cartodb_id, loc.the_geom, loc.the_geom_webmercator, loc.org_type, ";

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

        //Existing requirements logic only works when there is a single requirement listed for an organization - this logic should be fixed
        query += "AND (position(loc.requirements in '" +userTagString+ "') != 0 OR loc.requirements = '') ";

        //matches organizations between location and service area database by name
        query += "AND loc.organization = sa.organization ";

        //if there is an active housing court case, only show orgs tagged as "true" for relevance in housing court
        query += housingCourt ? ' AND loc.housing_court = true' : '';

        //check if org is one of the org types selected by user.
        query +=" AND (position(loc.org_type in '" + orgString + "') != 0 )) ";

        //limits the number of results shown
        query += "T LIMIT 20";

        if(userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([lat,lng]);
        userMarker.addTo(map);

        mainSublayer.set({
          sql: query,
          cartocss:
          "#nyc_cbos_locations_final{marker-fill-opacity:.9;marker-line-color:#FFF;marker-line-width:1;marker-line-opacity:1;marker-placement:point;marker-type:ellipse;marker-width:10;marker-allow-overlap:true}#nyc_cbos_locations_final::labels{text-name:[rownum];text-face-name:'DejaVu Sans Book';text-size:20;text-label-position-tolerance:10;text-fill:#000;text-halo-fill:#FFF;text-halo-radius:2;text-dy:-10;text-allow-overlap:true;text-placement:point;text-placement-type:simple}#layer[org_type='community']{marker-fill:#CD4968;}#layer[org_type='legal']{marker-fill:#FD7603;}#layer[org_type='govt']{marker-fill:#0096D7;}"
        });
        CartoDB.getSQL().getBounds(query).done(function(bounds) {
          bounds.push([lat,lng]);
          map.fitBounds(bounds, { padding: [10,10] });
        });
      };
    }
  };
}]);
