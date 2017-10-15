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

    closestShelter();
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

    map.panTo(coordinates);
    updateText(underwater);
}

function updateText(underwater) {
    if (underwater) {
        document.getElementById("title").innerHTML = "We hope you're taking swimming lessons";
    } else {
        document.getElementById("title").innerHTML = "You should be safe"
    }
}

var coordinates = [
    [-73.96648921670807, 40.649708582993064],
    [-73.86622748089125, 40.838205858215275],
    [-73.96139358097575, 40.6688589933076],
    [-73.92619138163855, 40.85559869189675],
    [-73.97644081210666, 40.688955817188834],
    [-73.91417582805788, 40.88805858303743],
    [-73.9117213739499, 40.66795481413876],
    [-73.97097165235431, 40.791461599835635],
    [-74.00453928492661, 40.65280553248585],
    [-73.97869546474965, 40.66930777410636],
    [-73.8853081324496, 40.81586895931827],
    [-73.9357073749906, 40.83935802569437],
    [-73.89046989887038, 40.84375984151174],
    [-73.91928775501131, 40.697693632530274],
    [-73.95609685370634, 40.81078944886271],
    [-73.98563038662456, 40.774899959763246],
    [-73.9663563303682, 40.75929963022644],
    [-73.99360201070182, 40.71623837083559],
    [-73.94581431348983, 40.8147115976589],
    [-73.9446461562353, 40.82999707805981],
    [-73.82402972837741, 40.758453450203675],
    [-73.89006273089697, 40.728696727390556],
    [-73.76682865353507, 40.745078241808976],
    [-73.92516451426961, 40.75612679344865],
    [-73.89722928081869, 40.854433752750495],
    [-73.90699064822998, 40.831893585490285],
    [-73.8731565648259, 40.68917494755177],
    [-73.98834759450574, 40.69463226130131],
    [-73.93644096788611, 40.66206795359305],
    [-73.93228484422491, 40.701455732544524],
    [-73.93237354807005, 40.68793814772119],
    [-73.9132600390299, 40.67449093632245],
    [-73.99578336323263, 40.62178403159182],
    [-73.97720245197735, 40.615246661358086],
    [-73.95147508866324, 40.65641422300907],
    [-73.86582315889937, 40.74931524379376],
    [-74.15897931892695, 40.581388990509105],
    [-73.85266908917056, 40.888220095065755],
    [-74.02453258829522, 40.63345140169942],
    [-73.99235077956067, 40.736110371584786],
    [-74.10434506993518, 40.60899601014512],
    [-73.91076904016273, 40.85138734697534],
    [-74.1448917169114, 40.623017156185085],
    [-73.919664554437, 40.83549265459259],
    [-73.80266512114586, 40.70965641897956],
    [-73.92945375815141, 40.74349499260163],
    [-73.90963486079305, 40.71126606472361],
    [-73.84476052923438, 40.72978179399705],
    [-73.91902100546525, 40.82747699295518],
    [-73.821357047386, 40.73497558794615],
    [-73.78520179472864, 40.7076654262842],
    [-73.88742394122187, 40.754262411740015],
    [-73.78970200437473, 40.764987261857435],
    [-73.7288655611345, 40.74445728670098],
    [-73.9041547375515, 40.699182428130115],
    [-73.82133980529291, 40.679760456715826],
    [-73.89704424213798, 40.86993370687484],
    [-73.90087575096457, 40.82733480011778],
    [-74.21396005256327, 40.54198980345471],
    [-74.07901917090253, 40.64282884762186]
]

function closestShelter() {
    var minX, minY = 0;
    var min = Number.MAX_SAFE_INTEGER;
    for (var i in coordinates){
        var x = (coordinates[i][0] - lng);
        var y = (coordinates[i][1] - lat);
        var distance = Math.sqrt(x*x + y*y);

        if (distance < min) {
            min = distance;
            minX = coordinates[i][0];
            minY = coordinates[i][1];
        }
    }

    map.addLayer({
        "id": "shelter",
        "type": "symbol",
        "source": {
            "type": "geojson",
            "data": {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [minX, minY]
                }
            }
        },
        "layout": {
            "icon-image": "circle-15"
        }
    });

    var midpointX = (minX + lng)/2;
    var midpointY = (minY + lat)/2;

    console.log(minX, minY);

}
