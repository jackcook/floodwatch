var url = new URL(window.location.href);
var lat = parseFloat(url.searchParams.get("lat"));
var lng = parseFloat(url.searchParams.get("lng"));

mapboxgl.accessToken = 'pk.eyJ1IjoiamFja2Nvb2szNiIsImEiOiJjajhybmFpZmQweG45MndxaTA5bWZzdHM0In0.TMB_ZQ0YiCwQNjA3ihOQ4A';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jackcook36/cj8roqx69bon22rpf45j7b5zp',
    center: [lng, lat],
    zoom: 13
});
map.addControl(new mapboxgl.NavigationControl());

// map.on('mousemove', function (e) {
//     console.log(e.point);
//     var features = map.queryRenderedFeatures(e.point);
//     // console.log(features);
// });

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
    
    var rect = document.getElementById("map").getBoundingClientRect();
    var point = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
    };
    
    Object.setPrototypeOf(point, mapboxgl.Point.prototype);
    // point.prototype = mapboxgl.Point.prototype;
    
    var features = map.queryRenderedFeatures(point);
    
    console.log(features);
    
    var underwater = false;
    
    for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        var id = feature["layer"]["id"];
        
        console.log(features[i]["layer"]["id"]);
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
