mapboxgl.accessToken = 'pk.eyJ1IjoiamFja2Nvb2szNiIsImEiOiJjajhybmFpZmQweG45MndxaTA5bWZzdHM0In0.TMB_ZQ0YiCwQNjA3ihOQ4A';

var url = new URL(window.location.href);
var lat = parseFloat(url.searchParams.get("lat"));
var lng = parseFloat(url.searchParams.get("lng"));

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jackcook36/cj8s0ki30748b2rmi7mmcmg0t',
    center: [lng, lat],
    zoom: 13
});

var point_feature_id = 0;

map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {
    var coordinates = {lat: lat, lng: lng};
    checkStatus(coordinates);
});

map.on("click", function (e) {
    checkStatus(e.lngLat);
});

function checkStatus(coordinates) {
    if (map.getLayer("location" + point_feature_id)) {
        map.removeLayer("location" + point_feature_id);
        point_feature_id += 1;
    }
    
    map.addLayer({
        "id": "location" + point_feature_id,
        "type": "symbol",
        "source": {
            "type": "geojson",
            "data": {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [coordinates.lng, coordinates.lat]
                }
            }
        },
        "layout": {
            "icon-image": "circle-15"
        }
    });
    
    var point = map.project({lat: coordinates.lat, lng: coordinates.lng});
    var features = map.queryRenderedFeatures(point);
    
    var flood_zones = [];
    
    for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        var id = feature["layer"]["id"];
        
        // this is the format for a custom tileset id
        var dcp_regex = /dcp-wos-slr(\d{4})s(\d{2})in-[\w]{6}/;
        var matches = id.match(dcp_regex);
        
        if (matches && matches.length == 3) {
            var year = parseInt(matches[1]);
            var inches = parseInt(matches[2]);
            
            flood_zones.push({
                "year": year,
                "inches": inches
            });
        }
    }
    
    if (map.getZoom() == 13) {
        map.panTo(coordinates);
    } else {
        map.flyTo({center: coordinates, zoom: 13});
    }
    
    updateText(flood_zones);
}

function updateText(flood_zones) {
    if (flood_zones.length > 0) {
        document.getElementById("title").innerHTML = "We hope you're taking swimming lessons";
        document.getElementById("status").innerHTML = "You're in " + flood_zones.length + " flood zones";
    } else {
        document.getElementById("title").innerHTML = "You should be safe"
    }
}
