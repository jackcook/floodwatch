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
            "Have you bought your life raft yet?",
            "Get ready to dive in"
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

                var shelter = findNearestShelter();
                calculateRoute(currentCoords, shelter.coordinates, function(minutes) {
                    document.getElementById("status").innerHTML = "We are " + (probability * 100) + "% certain that you will be submerged " + year_text + ". However, flash flooding could cause the sea level to temporarily rise even sooner than that. In case that happens, you should be mindful of the nearest hurricane shelter at " + shelter.name + ". The fastest route there takes " + minutes + " minutes by car. (<a href=\"#\" onclick=\"panToClosestShelter()\">See on map</a>)";
                    document.getElementById("status").style.textAlign = "justify";
                });

                break;
            }
        }
    } else {
        document.getElementById("title").innerHTML = "It looks like you're safe";
        document.getElementById("status").innerHTML = "You'll be okay... for now.";
        document.getElementById("status").style.textAlign = "center";
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

var shelters = [
    [-73.96648921670807, 40.649708582993064, "PS 249\n18 Marlborough Road, Brooklyn, NY 11226"],
    [-73.86622748089125, 40.838205858215275, "PS 102\n1827 Archer Street, Bronx, NY 10460"],
    [-73.96139358097575, 40.6688589933076, "Clara Barton HS\n901 Classon Avenue, Brooklyn, NY 11225"],
    [-73.92619138163855, 40.85559869189675,"George Washington Educational Campus\n549 Audobon Avenue, New York, NY 10040"],
    [-73.97644081210666, 40.688955817188834, "Brooklyn Tech HS\n29 Ft Greene Place, Brooklyn, NY 11217"],
    [-73.91417582805788, 40.88805858303743, "MS - HS 141\n660 W 237 Street, Bronx, NY 10463"],
    [-73.9117213739499, 40.66795481413876, "PS 327\n111 Bristol Street, Brooklyn, NY 11212"],
    [-73.97097165235431, 40.791461599835635, "IS 118\n154 W 93 Street, New York, NY 10025"],
    [-74.00453928492661, 40.65280553248585, "PS 24\n427 38 Street, Brooklyn, NY 11232"],
    [-73.97869546474965, 40.66930777410636, "John Jay Educational Campus\n237 7th Avenue, Brooklyn, NY 11215"],
    [-73.8853081324496, 40.81586895931827, "IS 201\n730 Bryant Avenue, Bronx, NY 10474"],
    [-73.9357073749906, 40.83935802569437, "IS 90\n21 Jumel Place, New York, NY 10023"],
    [-73.89046989887038, 40.84375984151174, "PS 211\n1919 Prospect Avenue, Bronx, NY 10457"],
    [-73.91928775501131, 40.697693632530274, "IS 383\n1300 Greene Avenue, Brooklyn, NY 11237"],
    [-73.95609685370634, 40.81078944886271, "PS 125\n425 W 123 Street, New York, NY 10027"],
    [-73.98563038662456, 40.774899959763246, "Martin Luther King Jr. HS\n122 Amsterdam Avenue, New York, NY 10023"],
    [-73.9663563303682, 40.75929963022644, "Midtown East Campus (PS 59)\n233 E 56 Street, New York, NY 10022"],
    [-73.99360201070182, 40.71623837083559, "IS 131\n100 Hester Street, New York, NY 10002"],
    [-73.94581431348983, 40.8147115976589, "PS 92\n222 W 134 Street, New York, NY 10030"],
    [-73.9446461562353, 40.82999707805981, "PS - IS 210\n501-503 W 152 Street, New York, NY 10031"],
    [-73.82402972837741, 40.758453450203675, "PS 20\n142-30 Barclay Avenue, Flushing, NY 11355"],
    [-73.89006273089697, 40.728696727390556, "7PS 58\n2-24 Grand Avenue, Maspeth, NY 11378"],
    [-73.76682865353507, 40.745078241808976, "IS 74\n61-15 Oceania Street, Bayside, NY 11362"],
    [-73.92516451426961, 40.75612679344865, "Frank Sinatra HS\n35-12 35Th Avenue, Long Island City, NY 11101"],
    [-73.89722928081869, 40.854433752750495, "IS 391\n2225 Webster Avenue, Bronx, NY 10457"],
    [-73.90699064822998, 40.831893585490285, "1PS 132\n245 Washington Avenue, Bronx, NY 10456"],
    [-73.8731565648259, 40.68917494755177, "PS 7\n858 Jamaica Avenue, Brooklyn, NY 11208"],
    [-73.98834759450574, 40.69463226130131, "Adams Street Educational Campus\n283 Adams Street, Brooklyn, NY 11201"],
    [-73.93644096788611, 40.66206795359305, "IS 391\n790 East New York Avenue, Brooklyn, NY 11203"],
    [-73.93228484422491, 40.701455732544524, "PS 145\n100 Noll Street, Brooklyn, NY 11206"],
    [-73.93237354807005, 40.68793814772119, "IS 324\n800 Gates Avenue, Brooklyn, NY 11221"],
    [-73.9132600390299, 40.67449093632245, "IS 55\n2021 Bergen Street, Brooklyn, NY 11233"],
    [-73.99578336323263, 40.62178403159182, "IS 227\n6500 16 Avenue, Brooklyn, NY 11204"],
    [-73.97720245197735, 40.615246661358086, "PS 226\n6006 23 Avenue, Brooklyn, NY 11204"],
    [-73.95147508866324, 40.65641422300907, "IS 2\n655 Parkside Avenue, Brooklyn, NY 11226"],
    [-73.86582315889937, 40.74931524379376, "PS 207\n40-20 100 Street,C orona, NY 11368"],
    [-74.15897931892695, 40.581388990509105, "Jerome Parker Campus\n100 Essex Drive, Staten Island, NY 10314"],
    [-73.85266908917056, 40.888220095065755, "IS - HS 362\n921 E 228 Street,Bronx,NY 10466"],
    [-74.02453258829522, 40.63345140169942, "PS - IS 30\n7002 4 Avenue, Brooklyn, NY 11209"],
    [-73.99235077956067, 40.736110371584786, "Clinton School\n10 E 15 Street, New York, NY 10003"],
    [-74.10434506993518, 40.60899601014512, "Petrides Complex\n715 Ocean Terrace, Staten Island, NY 10301"],
    [-73.91076904016273, 40.85138734697534, "PS 306\n40 West Tremont Avenue, Bronx, NY 10453"],
    [-74.1448917169114, 40.623017156185085, "IS 51\n20 Houston Street, Staten Island, NY 10302"],
    [-73.919664554437, 40.83549265459259, "PS - IS 218\n1220 Gerard Avenue, Bronx, NY 10452"],
    [-73.80266512114586, 40.70965641897956, "Hillcrest HS\n160-05 Highland Avenue, Jamaica, NY 11432"],
    [-73.92945375815141, 40.74349499260163, "Aviation HS\n45-30 36 Street, Long Island City, NY 11101"],
    [-73.90963486079305, 40.71126606472361, "Grover Cleveland HS\n21-27 Himrod Street, Ridgewood, NY 11385"],
    [-73.84476052923438, 40.72978179399705, "Forest Hills HS\n67-01 110 Street, Forest Hills, NY 11375"],
    [-73.91902100546525, 40.82747699295518, "HS of Law, Gov't and Justice\n244 E 163 Street, Bronx, NY 10451"],
    [-73.821357047386, 40.73497558794615, "Townsend Harris HS\n149-11 Melbourne Avenue, Flushing, NY 11367"],
    [-73.78520179472864, 40.7076654262842, "PS - IS 268\n92-07 175 Street, Jamaica, NY 11433"],
    [-73.88742394122187, 40.754262411740015, "IS 145\n33-34 80 Street, Jackson Heights, NY 11372"],
    [-73.78970200437473, 40.764987261857435, "IS 25\n34-65 192 Street, Flushing, NY 11355"],
    [-73.7288655611345, 40.74445728670098, "HS of Teaching, Lib Arts and Sci\n74-20 Commonwealth Blvd, Bellerose, NY 11426"],
    [-73.9041547375515, 40.699182428130115, "PS 239\n17-15 Weirfield Street, Ridgewood, NY 11385"],
    [-73.82133980529291, 40.679760456715826, "PS 100\n111-11 118 Street, South Ozone Park, NY 11420"],
    [-73.89704424213798, 40.86993370687484, "Walton HS\n2780 Reservoir Avenue, Bronx, NY 10468"],
    [-73.90087575096457, 40.82733480011778, "IS 158\n800 Home Street, Bronx, NY 10456"],
    [-74.21396005256327, 40.54198980345471, "PS 56\n250 Kramer Avenue, Staten Island, NY 10309"],
    [-74.07901917090253, 40.64282884762186, "Ralph McKee HS\n290 St Marks Place, Staten Island, NY 10301"]
];

function generateShelters() {
    for (var i in shelters) {
        var coords = {lat: shelters[i][1], lng: shelters[i][0]};
        addPoint("shelter", coords, "hospital-15");
    }
}

function findNearestShelter() {
    var minShelter;
    var min = Number.MAX_SAFE_INTEGER;

    for (var i in shelters) {
        var coords = {lat: shelters[i][1], lng: shelters[i][0]};
        addPoint("shelter", coords, "hospital-15");

        var x = coords.lng - currentCoords.lng;
        var y = coords.lat - currentCoords.lat;
        var distance = Math.sqrt(x*x + y*y);

        if (distance < min) {
            min = distance;
            minShelter = shelters[i];
        }
    }

    return {
        coordinates: {
            lat: minShelter[1],
            lng: minShelter[0]
        },
        name: minShelter[2]
    };
}

function panToClosestShelter() {
    var coordinates = findNearestShelter().coordinates;
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

function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(document.getElementById("searchbar"), {types: ["geocode"]});
    autocomplete.addListener("place_changed", fillInAddress);
}

function fillInAddress() {
    var place = autocomplete.getPlace();
    var lat = place.geometry.location.lat();
    var lng = place.geometry.location.lng();

    location.href = "status.html?lat=" + lat + "&lng=" + lng;
}
