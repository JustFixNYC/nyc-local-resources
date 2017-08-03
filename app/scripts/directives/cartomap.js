'use strict';

/**
 * @ngdoc directive
 * @name localResourcesApp.directive:cartoMap
 * @description
 * # cartoMap
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
        credits.addAttribution("© <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>");

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
            cartocss: "#nyc_cbos_locations_final{marker-fill-opacity:0;marker-line-color:#FFF;marker-line-width:1;marker-line-opacity:1;marker-placement:point;marker-type:ellipse;marker-width:10;marker-fill:#F60;marker-allow-overlap:true}"
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

          //var boroughString = borough ? '' : 'NOT';
          //var orgString = orgType ? 'legal' : 'community';
          var orgString = orgType.toString();
          var housingCourtStatusQuery = housingCourt ? ' AND loc.housing_court = true' : '';
          var userTagString = userTags.toString();
          console.log(orgString, ' <<ORG TYPE STRING [MAPS]');
          console.log(userTagString, ' <<USER TAG STRING [MAPS]');
          var query = "SELECT *, row_number() OVER (ORDER BY dist) as rownum FROM ( SELECT loc.cartodb_id, loc.the_geom, loc.the_geom_webmercator, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, loc.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM nyc_cbos_locations_final AS loc, nyc_cbos_service_areas_copy_new_entries AS sa WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), sa.the_geom ) AND (position(loc.requirements in '" +userTagString+ "') != 0 OR loc.requirements = '') AND loc.organization = sa.organization " + housingCourtStatusQuery + " AND (position(loc.org_type in '" + orgString + "') != 0 ) ) T LIMIT 10";

          /*var query = "SELECT *, row_number() OVER (ORDER BY dist ASC, score DESC) as rownum FROM ( SELECT loc.organization, loc.contact_information, loc.address, loc.services, loc.requirements, loc.housing_court, char_length(tags) AS score, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, loc.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM nyc_cbos_locations_final AS loc, nyc_cbos_service_areas_copy_new_entries AS sa WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), sa.the_geom ) AND (position(loc.requirements in '" +userTagString+ "') != 0 OR loc.requirements = '') AND loc.organization = sa.organization "+ housingCourtStatusQuery + " AND (position(loc.org_type in '" + orgString + "') != 0 )) T LIMIT 20"*/

          console.log('MAP QUERY: ', query);
          if(userMarker) map.removeLayer(userMarker);
          userMarker = L.marker([lat,lng]);
          userMarker.addTo(map);

          mainSublayer.set({
            sql: query,
            cartocss: "#nyc_cbos_locations_final{marker-fill-opacity:.9;marker-line-color:#FFF;marker-line-width:1;marker-line-opacity:1;marker-placement:point;marker-type:ellipse;marker-width:10;marker-fill:#5F4690;marker-allow-overlap:true}#nyc_cbos_locations::labels{text-name:[rownum];text-face-name:'DejaVu Sans Book';text-size:20;text-label-position-tolerance:10;text-fill:#000;text-halo-fill:#FFF;text-halo-radius:2;text-dy:-10;text-allow-overlap:true;text-placement:point;text-placement-type:simple}"


            /*cartocss:
            "#nyc_cbos_locations_final{marker-fill-opacity:.9;marker-line-color:#FFF;marker-line-width:1;marker-line-opacity:1;marker-placement:point;marker-type:ellipse;marker-width:10;marker-fill:ramp([nyc_cbos_locations_final.org_type], (#5F4690, #1D6996, #38A6A5, #0F8554), ('community', 'govt', 'legal', null), '=');marker-allow-overlap:true}#nyc_cbos_locations::labels{text-name:[rownum];text-face-name:'DejaVu Sans Book';text-size:20;text-label-position-tolerance:10;text-fill:#000;text-halo-fill:#FFF;text-halo-radius:2;text-dy:-10;text-allow-overlap:true;text-placement:point;text-placement-type:simple}"*/
          });

          CartoDB.getSQL().getBounds(query).done(function(bounds) {
            //console.log(lat,lng);
            bounds.push([lat,lng]);
            //console.log(bounds);
          //$rootScope.cartoSQL.getBounds(query).done(function(bounds) {
            map.fitBounds(bounds, { padding: [10,10] });
          });
        };

      }
    };
}]);
