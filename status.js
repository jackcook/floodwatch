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
    
    var underwater = false;
    
    for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        var id = feature["layer"]["id"];
        
        if (features[i]["layer"]["id"] == "dcp-wos-slr2100s75in-72a32u") {
            underwater = true;
            break;
        }
    }
    
    if (map.getZoom() == 13) {
        map.panTo(coordinates);
    } else {
        map.flyTo({center: coordinates, zoom: 13});
    }
    
    updateText(underwater);
}

function updateText(underwater) {
    if (underwater) {
        document.getElementById("title").innerHTML = "We hope you're taking swimming lessons";
    } else {
        document.getElementById("title").innerHTML = "You should be safe"
    }
}
