var map = L.map('map').setView([40.22366, -118.79777], 4.5);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiYWpsZW9uMTgwIiwiYSI6ImNsYTQ4ZDVqcTA5cHYzd21seGszbWI3eDIifQ.yaXUrccsnQ_RHZqxu7UKNw'
}).addTo(map);

var drawnItems = L.featureGroup().addTo(map);

var tableData = L.layerGroup().addTo(map);
var url = "https://178.128.228.240:4000/sql?q=";
// change the Query below by replacing lab_7_name with your table name
var sqlQuery = "SELECT * FROM bird_sighting";
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b>Species of Bird:  </b>" + feature.properties.input_bird + "<br>" +
        "<b>Number of Birds:  </b>" + feature.properties.input_num + "<br>" +
        "<b>Entry Date:  </b>" + feature.properties.input_date + "<br>" +
        "<b>User Name:  </b>" + feature.properties.input_name //+ "</b><br>" +
        // feature.properties.input_photo + "</b><br>" +
        // feature.properties.input_video + "</b><br>" +
        // feature.properties.input_audio
    );
}

fetch(url + sqlQuery)
    .then(function(response) {
    return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(tableData);
    });

new L.Control.Draw({
    draw : {
        polygon : true,
        polyline : true,
        rectangle : false,     // Rectangles disabled
        circle : false,        // Circles disabled
        circlemarker : false,  // Circle markers disabled
        marker: true
    },
    edit : {
        featureGroup: drawnItems
    }
}).addTo(map);

function createFormPopup() {
    var popupContent = 
        '<form id=popup>' + 
        'Species of Bird:<br><input type="text" id="input_bird"><br>' +
        'Number of Birds:<br><input type="int" id="input_num"><br>' +
        'Date of Sighting:<br><input type="date" id="input_date"><br>' +
        'User\'s Name:<br><input type="text" id="input_name"><br>' +
        //I originallu planned to add buttons for users to add videos, audio, and photos of birds, but it sounds like the database does not support those file types.  I have commented out the buttons and future references to video, audio, and photos in the javascript.  I have left the columns in my table for posterity.
        // 'Take a Photo:<input type="file" id="input_photo" capture="environment" accept="image/*"><br>' +
        // 'Take a Video<input type="file" id="input_video" capture="environment" accept="video/*"><br>' +
        // 'Take an Audio Recording:<br><input type="file" id="input_audio" capture="environment" accept="audio/*"><br>' +
        '<input type="button" value="Submit" id="submit">' + 
        '</form>'
    drawnItems.bindPopup(popupContent).openPopup();
};

map.addEventListener("draw:created", function(e) {
    e.layer.addTo(drawnItems);
    createFormPopup();
});

function setData(e) {

    if(e.target && e.target.id == "submit") {

        // Get user name and description
        var enteredBird = document.getElementById("input_bird").value;
        var enteredBirdNum = document.getElementById("input_num").value;
        var enteredDate = document.getElementById("input_date").value;
        var enteredUsername = document.getElementById("input_name").value;
        // var enteredPhoto = document.getElementById("input_photo").value;
        // var enteredVideo = document.getElementById("input_video").value;
        // var enteredAudio = document.getElementById("input_audio").value;

        // For each drawn layer
        drawnItems.eachLayer(function(layer) {
                
            // Create SQL expression to insert layer
            var drawing = JSON.stringify(layer.toGeoJSON().geometry);
            var sql =
                "INSERT INTO bird_sighting (geom, input_bird, input_num, input_date, input_name, input_photo, input_video, input_audio) " +
                "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
                drawing + "'), 4326), '" +
                enteredBird + "', '" +
                enteredBirdNum + "', '" +
                enteredDate + "', '" +
                enteredUsername + "', '" + "');";
                // enteredPhoto + "', '" +
                // enteredVideo + "', '" +
                // enteredAudio + "');";
            console.log(sql);

            // Send the data
            fetch(url + encodeURI(sql))
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                console.log("Data saved:", data);
            })
            .catch(function(error) {
                console.log("Problem saving the data:", error);
            });

            // Transfer submitted drawing to the tableData layer so it persists on the map without you having to refresh the page.
            var newData = layer.toGeoJSON();
            newData.properties.input_bird = enteredBird;
            newData.properties.input_num = enteredBirdNum;
            newData.properties.input_date = enteredDate;
            newData.properties.input_name = enteredUsername;
            // newData.properties.input_photo = enteredPhoto;
            // newData.properties.input_video = enteredVideo;
            // newData.properties.input_audio = enteredAudio;
            L.geoJSON(newData, {onEachFeature: addPopup}).addTo(tableData);

        });

        // Clear drawn items layer
        drawnItems.closePopup();
        drawnItems.clearLayers();

    }
}

document.addEventListener("click", setData);

map.addEventListener("draw:editstart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function(e) {
    drawnItems.openPopup();
});
map.addEventListener("draw:deletestop", function(e) {
    if(drawnItems.getLayers().length > 0) {
        drawnItems.openPopup();
    }
});
