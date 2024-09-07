/* 
David Gilson, Sep 6, 2024
NOTES:
  I have un-obfuscated the original code
  Upgraded to latest GoogleMaps Platform
*/

// Written by David Gilson, Copyright NQN and David Gilson 2010

// The crime markers do not represent specific addresses, they are designed to point to the streets where property crime has occurred. 
// This data records property crime reported over periods beginning 12.01pm Monday, Wednesday or Friday until 12 noon on the listed date.

let map;
const xmlPath = "xml/";
const datesXMLFile = "dates.xml";
let eventDates;
let selectedDateID;
let currentMarkers;

function formatString(str) {
    return str.toLowerCase().replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
}

async function load() {

    map = await initMap();
    eventDates = await loadParseDatesXML();
    currentMarkers = await loadMarkers(eventDates[0].FileName); // Load markers xml for first date
    selectedDateID = 0;

    currentMarkers.forEach(pin => {
        addMarker(pin); // Adding the first markers on first date
    });
}

let currentCircle;

async function initMap(date) {
    
    // Location set to Townsville City
    const centerPosition = { lat: -19.285221, lng: 146.773911 };
    // Request needed libraries.
    //@ts-ignore
    const { Map } = await google.maps.importLibrary("maps");
    
    map = new Map(document.getElementById("map"), {
        zoom: 12,
        center: centerPosition,
        mapId: "CRIME_MAP_ID",
    });

    currentCircle = new google.maps.Circle({
        strokeColor: "#0000FF",
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: "#0000FF",
        fillOpacity: 0.25,
        radius: 300,
      });

    return map;
}

let lastOpenedInfoWindow;

async function addMarker(pin) {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    const { InfoWindow } = await google.maps.importLibrary("maps");

    const icon = document.createElement("img");
    icon.width = 24;
    icon.height = 24;
    icon.src = "images/siren.svg";

    const faPin = new PinElement({
      glyph: icon,
      background: "white",
      borderColor: "blue",
      scale: 1,
    });

    const marker = new AdvancedMarkerElement({
      map: map,
      position: pin.Position,
      content: faPin.element,
      title: pin.Address
    });

    let propertyTakenList = "<ul>";
    pin.PropertyTaken.split(";").forEach(item => {
        propertyTakenList += "<li><b>" + item + "</b></li>";
    });
    propertyTakenList += "</ul>";

    let markerDiv = "<div class='marker'>";
    markerDiv += "<p>An alleged <b>" + pin.Type + "</b> event occurred at a <b>" + pin.Location + ".</b>";
    markerDiv += "<br>The perpetrators gained entry by <b>" + pin.Entry +"</b>";
    markerDiv += " and removed: " + propertyTakenList + "</p>";
    markerDiv += "<p>Date Reported: <b>" + eventDates[selectedDateID].DateString + "</b></p>";
    
    // gMapUrl = 'https://www.google.com/maps/search/?api=1&query=' + pin.Position.lat + ',' + pin.Position.lng;
    gMapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURI (pin.Address + ',QLD, Australia');

    markerDiv += '<a target="_blank" href="' + gMapUrl + '" tabindex="0"> <span>View on Google Maps</span> </a>'
    
    const infoWindow = new InfoWindow({
        content: markerDiv,
    });

    infoWindow.setHeaderContent(formatString (pin.Address));
    
    // Add a click event listener to the marker
    marker.addListener("click", () => {
        if (lastOpenedInfoWindow) { lastOpenedInfoWindow.close(); };
        if (currentCircle) { currentCircle.setMap(null); };
        infoWindow.open(map, marker);
        lastOpenedInfoWindow = infoWindow;

        currentCircle.setMap (map);
        currentCircle.setCenter (pin.Position);
        map.setCenter (pin.Position)
    });

    infoWindow.addListener("closeclick", () => {
        lastOpenedInfoWindow = null;
        currentCircle.setMap(null);
    });
}

async function loadParseDatesXML() {
    try {
        const response = await fetch(xmlPath + datesXMLFile);
        const data = await response.text();
        return parseDatesXML(data);
    } catch (error) {
        console.error('Error fetching the XML file:', error);
        throw error;
    }
}

function parseDatesXML(data) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml')
    
    const dateElements = xmlDoc.getElementsByTagName('date');
    const dates = [];

    for (let i = 0; i < dateElements.length; i++) {
        const dateString = dateElements[i].getAttribute('DateString');
        const fileName = dateElements[i].getAttribute('File');
        const date = dateElements[i].getAttribute('Date');
        dates.push({
            DateString: dateString, 
            FileName: fileName, 
            Date: new Date(date)
        });
    }

    console.log('DateStrings:', dates);
    return dates;
}

async function loadMarkers(file) {
    try {
        const response = await fetch(xmlPath + file);
        const data = await response.text();
        return parseMarkersXML(data);
    } catch (error) {
        console.error('Error fetching the XML file:', error);
        throw error;
    }
}

function parseMarkersXML(data) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml')
    
    const markerElements = xmlDoc.getElementsByTagName('marker');
    const markers = [];

    // Sample:
    // <marker address="BARRYMAN ST, PIMLICO" lat="-19.2733145" lng="146.7888844" 
    // type="Steal from vehicle" location="Shopping area" propertyTaken="Phone" entry="Unknown"/>
	// -19.2542771,146.823100
    for (let i = 0; i < markerElements.length; i++) {
        const lat = markerElements[i].getAttribute('lat');
        const lng = markerElements[i].getAttribute('lng');
        const address = markerElements[i].getAttribute('address');
        const type = markerElements[i].getAttribute("type");
        const propertyTaken = markerElements[i].getAttribute("propertyTaken");
        const location = markerElements[i].getAttribute("location");
        const entry = markerElements[i].getAttribute("entry");

        // DG NOTE: There was incorrect attributes for lat, lng in XML:
        // For Example:
        //   'Sir Leslie Thiess Dr, Townsville City'
        //   GMaps Correct: -19.2543634, 146.8255609
        //   in XML:        -19.2568164, 146.8235810
        //   differences:     0.002453,    0.0019799
        //  Calculated Difference using Math.abs(correct, xml) and applied to property, works for most.
        //      Position: { lat: parseFloat(lat) + 0.002453, lng: parseFloat(lng) + 0.0019799 }, 
            
        markers.push({
            Position: { lat: parseFloat(lat) + 0.002453, lng: parseFloat(lng) + 0.0019799 }, 
            Address: address,
            PropertyTaken: propertyTaken,
            Type: type,
            Location: location,
            Entry: entry,
        });
    }

    console.log('Markers:', markers);
    return markers;
}



///// OLD CODE: ////////////////////////

var crimeFiles = [];

function datesDownloadComplete(xml) {
    var eventsXML = GXml.parse(xml);
    try {
        var dates = eventsXML.documentElement.getElementsByTagName("date");
    } catch (ex) {
        return;
    }
    for (var index = 0; index < dates.length; index++) {
        var dateString = dates[index].getAttribute("DateString");
        var dateHeaderHTML = "<div class='crimeListDateHeading' id='heading_" + index + "'><a href='#' onclick='loadMarkers(" + index + "); return false'><img src='images/plus.gif' class='pmimg' id='pmimg_" + index + "' width=11 height=11 ></a></div>";
        dateHeaderHTML += "<div class='crimeListDIV' id='crimes_" + index + "'></div>";
        document.getElementById("crimeList").innerHTML += dateHeaderHTML;
        crimeFiles.push("xml/" + dates[index].getAttribute("File"));
    }
    document.getElementById("crimeList").innerHTML += " ";
    selectedDateID = null;
    loadMarkers(0);
}

function downloadComplete66(xml) {
  var eventsXML = GXml.parse(xml);

  try {
      var addresses = eventsXML.documentElement.getElementsByTagName("address");
  } catch (ex) {
      return;
  }

  var tmp = [];
  document.getElementById("marker" + selectedDateID).src = "type";

  for (var index = 0; index < addresses.length; index++) {
      var location = addresses[index].getAttribute("location");
      var propertyTaken = addresses[index].getAttribute("propertyTaken");
      var entry = addresses[index].getAttribute("entry");
      var lat = addresses[index].getAttribute("lat");
      var lng = addresses[index].getAttribute("lng");
      var gLatLang = new GLatLng(parseFloat(addresses[index].getAttribute("lat")), parseFloat(addresses[index].getAttribute("lng")));
      markerOptions = {
          icon: iconCrime
      };
      var markerDiv = "<div class='marker'>";
      markerDiv += "<div class='addressDIV' style='background-image: url(images/police_banner.jpg);'>";
      markerDiv += "<div class='addressLabel'>" + location + "</div>";
      markerDiv += "<div class='addressShadow'>" + location + "</div>";
      markerDiv += "</div>";
      markerDiv += "<div class='markerBody'>";
      markerDiv += "<table cellpadding='1' cellspacing='1' width='340'>";
      markerDiv += "<tr><td width='120'>Crime:</td><td><b>" + propertyTaken + "</b></td></tr>";
      markerDiv += "<tr><td>Location Type:</td><td><b>" + entry + "</b></td></tr>";
      markerDiv += "<tr><td>Property Taken:</td><td><b>" + lat + "</b></td></tr>";
      markerDiv += "<tr><td>Entry Gained by:</td><td><b>" + lng + "</b></td></tr>";
      markerDiv += "</table></div></div>";
      addToList(index, location);
      var gMarker = createMarker(gLatLang, markerOptions, markerDiv);
      crimeMarkers.push(gMarker);
  }

  CrimeMarkers = crimeMarkers;
  mgr.refresh(tmp, 1);
  mgr.scrollTop();
  document.getElementById("crimeList").scrollTop = document.getElementById("pmimg_" + selectedDateID).offsetTop - 4;
}

function addToList(event, location, propertyTaken) {
  var markerDiv = "<div><a class='listItem' href='#' onmouseover='highlightMarker(" + event + ",true);' ";
  markerDiv += "onmouseout='highlightMarker(" + event + ",false);' ";
  markerDiv += "onclick='showMarker(" + event + "); return false'>" + location + "</a></div>";
  document.getElementById("pmimg_" + selectedDateID).innerHTML += markerDiv;
}

function createMarker(gLatLang, src, markerDiv) {
  var gMarker = new GMarker(gLatLang, src);

  GEvent.addListener(gMarker, "click", function() {
      gMarker.openInfoWindowHtml(markerDiv);
  });

  GEvent.addListener(gMarker, "mouseover", function() {
      try {
          gMarker.setImage("images/police_light_over.png");
      } catch (e) {}
  });

  GEvent.addListener(gMarker, "mouseout", function() {
      try {
          gMarker.setImage("images/police_light.png");
      } catch (e) {}
  });

  return gMarker;
}

function showMarker(event) {
  GEvent.trigger(CrimeMarkers[event], "click");
}

function highlightMarker(event, action) {
  if (action) {
      GEvent.trigger(CrimeMarkers[event], "mouseover");
  } else {
      GEvent.trigger(CrimeMarkers[event], "mouseout");
  }
}
