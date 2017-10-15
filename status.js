mapboxgl.accessToken = 'pk.eyJ1IjoiamFja2Nvb2szNiIsImEiOiJjajhybmFpZmQweG45MndxaTA5bWZzdHM0In0.TMB_ZQ0YiCwQNjA3ihOQ4A';

var url = new URL(window.location.href);
var lat = parseFloat(url.searchParams.get("lat"));
var lng = parseFloat(url.searchParams.get("lng"));

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jackcook36/cj8roqx69bon22rpf45j7b5zp',
    center: [lng, lat],
    zoom: 13
});

map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {
    map.addLayer({
        "id": "location",
        "type": "symbol",
        "source": {
            "type": "geojson",
            "data": {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]
                }
            }
        },
        "layout": {
            "icon-image": "circle-15"
        }
    });
    
    var point = map.project({lat: lat, lng: lng});
    var features = map.queryRenderedFeatures(point);
    
    var underwater = false;
    
    for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        var id = feature["layer"]["id"];
        
        if (features[i]["layer"]["id"] == "dcp-wos-slr2020s02in-6g5vyq") {
            underwater = true;
            break;
        }
    }
    
    updateText(underwater);
});

function updateText(underwater) {
    if (underwater) {
        document.getElementById("title").innerHTML = "We hope you're taking swimming lessons";
    } else {
        document.getElementById("title").innerHTML = "You should be safe"
    }
}
