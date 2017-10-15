mapboxgl.accessToken = 'pk.eyJ1IjoiamFja2Nvb2szNiIsImEiOiJjajhybmFpZmQweG45MndxaTA5bWZzdHM0In0.TMB_ZQ0YiCwQNjA3ihOQ4A';

var defaultZoomFactor = 13;

var url = new URL(window.location.href);
var origLat = parseFloat(url.searchParams.get("lat"));
var origLng = parseFloat(url.searchParams.get("lng"));

document.getElementById("searchbar").value = url.searchParams.get("q");

var currentCoords = {};

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jackcook36/cj8s0ki30748b2rmi7mmcmg0t',
    center: [origLng, origLat],
    zoom: defaultZoomFactor,
    minZoom: 11
});

var locationPointId = "";

map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {
    generateShelters();
});

map.on("click", function (e) {
    var features = map.queryRenderedFeatures(e.point);
    
    for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        if (feature.layer.id == "places") {
            new mapboxgl.Popup()
                .setLngLat(feature.geometry.coordinates)
                .setHTML(feature.properties.description)
                .addTo(map);
            return;
        }
    }
    
    // Move to this point if no place was selected
    checkStatus(e.lngLat);
});

map.on("mouseenter", "places", function () {
    map.getCanvas().style.cursor = "pointer";
});

map.on("mouseleave", "places", function () {
    map.getCanvas().style.cursor = "";
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
    updateTwitterButton();
}

function updateText(flood_zones) {
    document.getElementById("status").innerHTML = "";

    if (flood_zones.length > 0) {
        document.getElementById("text").style.display = "block";
        
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
        document.getElementById("text").style.display = "none";
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
                },
                "properties": {
                    "description": "Testing"
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

var shelters = [];

function generateShelters() {
    var evacuationRequest = new XMLHttpRequest();
    evacuationRequest.open("GET", "https://data.cityofnewyork.us/api/views/addd-ji6a/rows.json");
    evacuationRequest.send(async=false);

    evacuationRequest.onload = function() {
        var features = [];
        var shelterData = JSON.parse(evacuationRequest.responseText)["data"];
        
        for (var i = 0; i < shelterData.length; i++) {
            var shelter = shelterData[i];
            
            var geometry = shelter[11];
            var coordinate_regex = /POINT \(([-\d.]+) ([-\d.]+)\)/;
            var matches = geometry.match(coordinate_regex);
            
            var coords = {lat: parseFloat(matches[2]), lng: parseFloat(matches[1])};
            // addPoint("shelter", coords, "hospital-15");
            
            var shelter = {
                coordinates: coords,
                name: shelter[10],
                address: shelter[8] + ", " + shelter[9] + ", " + shelter[12] + " " + shelter[13]
            }
            
            shelters.push(shelter);
            
            features.push({
                type: "Feature",
                properties: {
                    description: "<strong>" + shelter.name + "</strong><br>" + shelter.address,
                    icon: "hospital"
                },
                geometry: {
                    type: "Point",
                    coordinates: [coords.lng, coords.lat]
                }
            });
        }
        
        map.addLayer({
            "id": "places",
            "type": "symbol",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": features
                }
            },
            "layout": {
                "icon-image": "{icon}-15",
                "icon-allow-overlap": true
            }
        });
        
        var originalCoordinates = {lat: origLat, lng: origLng};
        checkStatus(originalCoordinates);
    };
}

function findNearestShelter() {
    var minShelter;
    var min = Number.MAX_SAFE_INTEGER;

    for (var i = 0; i < shelters.length; i++) {
        var coords = shelters[i].coordinates;
        
        var x = coords.lng - currentCoords.lng;
        var y = coords.lat - currentCoords.lat;
        var distance = Math.sqrt(x*x + y*y);

        if (distance < min) {
            min = distance;
            minShelter = shelters[i];
        }
    }

    return {
        coordinates: minShelter.coordinates,
        name: minShelter.name
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
    var name = document.getElementById("searchbar").value;

    location.href = "status.html?lat=" + lat + "&lng=" + lng + "&q=" + name;
}

var checkboxes = Array.from(document.getElementsByTagName("input")).filter(function(elem) {
    return elem.getAttribute("type") == "checkbox";
});

for (var i = 0; i < checkboxes.length; i++) {
    var checkbox = checkboxes[i];
    checkbox.checked = localStorage.getItem(checkbox.name) == "true";
    checkbox.addEventListener("change", function(event) {
        localStorage.setItem(event.target.name, event.target.checked);
    });
}

function updateTwitterButton() {
    var twitterButton = document.getElementsByClassName("twitter-share-button")[0];
    twitterButton.parentNode.removeChild(twitterButton);
    
    var newTwitterButton = document.createElement("a");
    newTwitterButton.setAttribute("class", "twitter-share-button");
    newTwitterButton.setAttribute("href", "https://twitter.com/intent/tweet");
    newTwitterButton.setAttribute("data-size", "large");
    newTwitterButton.setAttribute("data-text", "Looks like I'm safe from flooding in NYC for the next 100 years! Check your status at floodwatch.xyz!");
    newTwitterButton.setAttribute("data-url", "http://floodwatch.xyz/status.html?lat=" + currentCoords.lat + "&lng=" + currentCoords.lng);
    
    var socialContainer = document.getElementById("social-container");
    socialContainer.appendChild(newTwitterButton);
    twttr.widgets.load();
}
