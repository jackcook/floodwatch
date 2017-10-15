mapboxgl.accessToken = "pk.eyJ1IjoiamFja2Nvb2szNiIsImEiOiJjajhybmFpZmQweG45MndxaTA5bWZzdHM0In0.TMB_ZQ0YiCwQNjA3ihOQ4A";

var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/jackcook36/cj8rqhq4hbp1u2rk5xz65r6u4",
    center: [-73.9654, 40.7829],
    zoom: 10
});

map.addControl(new mapboxgl.NavigationControl());

document.getElementById("year-dropdown").onchange = function(selection) {
    var styleId = selection.target[selection.target.selectedIndex].value;
    map.setStyle("mapbox://styles/jackcook36/" + styleId);
};

var autocomplete;

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
