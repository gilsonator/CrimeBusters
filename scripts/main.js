"use strict";
/* 
David Gilson, Sep 6, 2024
NOTES:
  I have un-obfuscated the original code
  * Upgraded to latest GoogleMaps Platform
  * Upgraded to HTML5 ES6 Modules
*/

// Written by David Gilson, Copyright NQN and David Gilson 2010

// The crime markers do not represent specific addresses, they are designed to point to the streets where property crime has occurred. 
// This data records property crime reported over periods beginning 12.01pm Monday, Wednesday or Friday until 12 noon on the listed date.
import { XMLParser } from './XMLParser.js';

let map;
let eventDates;
let selectedDateID;
let currentMarkers = [];
let currentMarker;
let lastOpenedInfoWindow;
let currentCircle;

const xmlPath = "xml/";
const datesXMLFile = 'dates.xml';
const parser = new XMLParser(xmlPath);

function formatString(str) {
    return str.toLowerCase().replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
}

export async function load() {
    map = await initMap();

    try {
        const dates = await parser.loadParseDatesXML(datesXMLFile);
        console.log('Parsed Dates:', dates);
        eventDates = dates;

        if (eventDates.length > 0) {
            const events = await parser.loadParseEventsXML(eventDates[0].FileName);
            console.log('Parsed Events:', events);

            selectedDateID = 0;
            events.forEach(event => {
                addMarker(event); // Adding the first markers on first date
            });
        } else {
            console.error('No event dates found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function initMap(date) {
    
    // Location set to Townsville City
    const centerPosition = { lat: -19.285221, lng: 146.773911 };
    // Request needed libraries.
    //@ts-ignore
    const { Map } = await google.maps.importLibrary("maps");
    
    map = new Map(document.getElementById("map"), {
        zoom: 12,
        center: centerPosition,
        mapId: "DG202409CSMAP",
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

async function addMarker(eventDetails) {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    const { InfoWindow } = await google.maps.importLibrary("maps");

    const defaultIcon = 'images/siren.svg';
    // const hoverIcon = 'images/siren-over.svg';

    const icon = document.createElement("img");
    icon.width = 24;
    icon.height = 24;
    icon.src = defaultIcon;

    const faPin = new PinElement({
      glyph: icon,
      background: "white",
      borderColor: "blue",
      scale: 1,
    });

    const marker = await new AdvancedMarkerElement({
      map: map,
      position: eventDetails.Position,
      content: faPin.element,
      title: eventDetails.Address
    });

    let propertyTakenList = `
  <ul>
    ${eventDetails.PropertyTaken.split(";").map(item => `<li><b>${item}</b></li>`).join('')}
  </ul>
`;

    const markerDiv = `
  <div class='marker'>
    <p>An alleged <b>${eventDetails.Type}</b> event occurred at a <b>${eventDetails.Location}</b>.</p>
    <p>The perpetrators gained entry by <b>${eventDetails.Entry}</b> and stole: ${propertyTakenList}</p>
    <p>Date Reported: <b>${eventDates[selectedDateID].DateString}</b></p>
    <a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURI(eventDetails.Address + ',QLD,Australia')}" tabindex="0">
      <span>View on Google Maps</span>
    </a>
    <p class="marker-note"><b>NOTE:</b> The crime markers do not represent specific addresses, they are designed to point to the streets where property crime has occurred.</p>
  </div>
`;    
    const infoWindow = new InfoWindow({
        content: markerDiv,
    });

    infoWindow.setHeaderContent(formatString (eventDetails.Address));
    
    // Add a click event listener to the marker
    marker.addListener("click", () => {
        if (lastOpenedInfoWindow) { lastOpenedInfoWindow.close(); };
        if (currentCircle) { currentCircle.setMap(null); };
        infoWindow.open(map, marker);
        lastOpenedInfoWindow = infoWindow;

        currentCircle.setMap (map);
        map.panTo (eventDetails.Position)
        currentCircle.setCenter (eventDetails.Position);
    });

    // Change glyph on mouse over
    // Was just a test, didn't want to change maps theme
    /*
    marker.content.addEventListener('mouseover', () => {
        icon.src = hoverIcon;
    });

    marker.content.addEventListener('mouseout', () => {
        icon.src = defaultIcon;
    });
    */
    infoWindow.addListener("closeclick", () => {
        lastOpenedInfoWindow = null;
        currentCircle.setMap(null);
    });

    currentMarkers.push (marker);
}

export function removeMarkers() {
    currentMarkers.forEach(marker => marker.setMap(null));
    currentMarkers = [];
    if (currentCircle) {
        currentCircle.setMap(null);
    }
}

export function showMarker(eventIndex) {
    google.maps.event.trigger(currentMarkers[eventIndex], 'click');
}

// Attach the functions to the window object
window.onload = load;
window.removeMarkers = removeMarkers;
window.showMarker = showMarker;


///// OLD CODE: ////////////////////////
/*
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
    loadParseEvents(0);
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
*/