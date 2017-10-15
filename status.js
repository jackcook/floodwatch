mapboxgl.accessToken = 'pk.eyJ1IjoiamFja2Nvb2szNiIsImEiOiJjajhybmFpZmQweG45MndxaTA5bWZzdHM0In0.TMB_ZQ0YiCwQNjA3ihOQ4A';

var defaultZoomFactor = 13;

var url = new URL(window.location.href);
var lat = parseFloat(url.searchParams.get("lat"));
var lng = parseFloat(url.searchParams.get("lng"));

var currentCoords = {};

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jackcook36/cj8s0ki30748b2rmi7mmcmg0t',
    center: [lng, lat],
    zoom: defaultZoomFactor,
    minZoom: 11
});

var locationPointId = "";

map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {
    var coordinates = {lat: lat, lng: lng};
    checkStatus(coordinates);
    generateShelters();
});

map.on("click", function (e) {
    checkStatus(e.lngLat);
});

function checkStatus(coordinates) {
    if (map.getLayer(locationPointId)) {
        map.removeLayer(locationPointId);
    }

    locationPointId = addPoint("location", coordinates, "star-15");

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

            var probabilities = {
                2020: {2: 0.9, 4: 0.75, 6: 0.5, 8: 0.25, 10: 0.1},
                2050: {8: 0.9, 11: 0.75, 16: 0.5, 21: 0.25, 30: 0.1},
                2080: {13: 0.9, 18: 0.75, 29: 0.5, 39: 0.25, 58: 0.1},
                2100: {15: 0.9, 22: 0.75, 36: 0.5, 50: 0.25, 75: 0.1}
            };

            flood_zones.push({
                "year": year,
                "inches": inches,
                "probability": probabilities[year][inches]
            });
        }
    }

    currentCoords = coordinates;

    moveToPoint(coordinates);
    updateText(flood_zones);
    
    displayAnimatedImage(flood_zones.length > 0);
}

function updateText(flood_zones) {
    document.getElementById("status").innerHTML = "";

    if (flood_zones.length > 0) {
        var underwater_titles = [
            "We hope you're taking swimming lessons",
            "Have you bought your life raft yet?"
        ];

        document.getElementById("title").innerHTML = underwater_titles[Math.floor(Math.random() * underwater_titles.length)];

        var probabilities = {2020: 0, 2050: 0, 2080: 0, 2100: 0};

        for (var i = 0; i < flood_zones.length; i++) {
            var zone = flood_zones[i];
            if (probabilities[zone.year] < zone.probability) {
                probabilities[zone.year] = zone.probability;
            }
        }

        if (probabilities[2020] == 0.9) {
            document.getElementById("status").innerHTML = "You're already underwater.";
            return;
        }

        var probability_objects = [];

        for (var year in probabilities) {
            if (probabilities[year] > 0) {
                probability_objects.push({year: year, probability: probabilities[year]})
            }
        }

        for (var i = 0; i < probability_objects.length; i++) {
            var probability = probability_objects[i].probability;
            var year = probability_objects[i].year;
            if (probability > 0) {
                var year_text = "by the year " + probability_objects[i].year;

                if (year == 2020) {
                    year_text = "<strong>in three years</strong>";
                }

                var shelterCoords = findNearestShelter();
                calculateRoute(currentCoords, shelterCoords, function(minutes) {
                    document.getElementById("status").innerHTML = "We are " + (probability * 100) + "% certain that you will be submerged " + year_text + ". However, flash flooding could cause the sea level to temporarily rise even sooner than that. In case that happens, you should be mindful of the nearest hurricane shelter. The fastest route there takes " + minutes + " minutes by car. (<a href=\"#\" onclick=\"panToClosestShelter()\">See on map</a>)";
                });

                break;
            }
        }
    } else {
        document.getElementById("title").innerHTML = "It looks like you're safe";
        document.getElementById("status").innerHTML = "You'll be okay... for now.";
    }
}

function addPoint(id, coordinates, icon) {
    var random_num = Math.random() * 1000000;

    map.addLayer({
        "id": id + random_num,
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
            "icon-image": icon
        }
    });

    return id + random_num;
}

function moveToPoint(coordinates) {
    if (map.getZoom() == defaultZoomFactor) {
        map.panTo(coordinates);
    } else {
        map.flyTo({center: coordinates, zoom: defaultZoomFactor});
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
];

function generateShelters() {
    for (var i in coordinates) {
        var coords = {lat: coordinates[i][1], lng: coordinates[i][0]};
        addPoint("shelter", coords, "hospital-15");
    }
}

function findNearestShelter() {
    var minX, minY = 0;
    var min = Number.MAX_SAFE_INTEGER;

    for (var i in coordinates) {
        var coords = {lat: coordinates[i][1], lng: coordinates[i][0]};
        addPoint("shelter", coords, "hospital-15");

        var x = coords.lng - currentCoords.lng;
        var y = coords.lat - currentCoords.lat;
        var distance = Math.sqrt(x*x + y*y);

        if (distance < min) {
            min = distance;
            minX = coords.lng;
            minY = coords.lat;
        }
    }

    return {lat: minY, lng: minX};
}

function panToClosestShelter() {
    var coordinates = findNearestShelter();
    moveToPoint(coordinates);
}

function calculateRoute(from, to, callback) {
    var start = from.lat + "," + from.lng;
    var end = to.lat + "," + to.lng;
    var request = {
        origin: start,
        destination: end,
        travelMode: 'DRIVING'
    };

    new google.maps.DirectionsService().route(request, function(result, status) {
        var minutes = parseInt(result.routes[0].legs[0].duration.value / 60);
        callback(minutes);
    });
}

function displayAnimatedImage(flood) {
    var offset = Math.floor(Math.random() * 50);
    var query = flood ? "flood" : "happy";
    
    var req = new XMLHttpRequest();
    req.open("GET", "https://api.giphy.com/v1/gifs/search?api_key=Zfa9rq145Mi27M0tk4SidKkliNxDl11v&q=" + query + "&limit=1&offset=" + offset + "&rating=G&lang=en");
    req.send();
    
    req.onload = function() {
        var imageUrl = JSON.parse(req.responseText)["data"][0]["images"]["original"]["url"];
        document.getElementById("animated").setAttribute("src", imageUrl);
    };
}
