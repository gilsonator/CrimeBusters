/* 
David Gilson, Sep 6, 2024
NOTES:
  I have un-obfuscated the original code
  Upgraded to latest GoogleMaps Platform
*/

// Written by David Gilson, Copyright NQN and David Gilson 2010

let map;
const datesXMLFile = "xml/dates.xml";

async function initMap() {

    const position = { lat: -19.285221, lng: 146.773911 };
    // Request needed libraries.
    //@ts-ignore
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
  
    map = new Map(document.getElementById("map"), {
      zoom: 12,
      center: position,
      mapId: "CRIME_MAP_ID",
    });
  
    // const iconImage = document.createElement("img");
    // iconImage.src = "images/police_light.png";

    const icon = document.createElement("div");
    icon.innerHTML = '<i class="fa-solid fa-handcuffs fa-xl"></i>';
    
    const faPin = new PinElement({
      glyph: icon,
      glyphColor: "white",
      background: "blue",
      borderColor: "darkblue"
    });

    // The marker, positioned at Townsville
    const marker = new AdvancedMarkerElement({
      map: map,
      position: position,
      content: faPin.element
    });
}

async function load() {
  datesXML = await loadDates();
  initMap();

    // setupIcons();
    // map = new GMap2(document.getElementById("mapDiv"));
    // point = new GLatLng(-19.285221, 146.773911);
    // map.setCenter(point, 12);
    // var _0xca94x3 = new ExtLargeMapControl();
    // map.addControl(_0xca94x3);
    // map.enableScrollWheelZoom();
    // mgr = new MarkerManager(map);
    // loadDates();
}

async function loadDates() {
    return [];
    // GDownloadUrl(datesXMLFile, datesDownloadComplete);


}

var selectedDateID = null;
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

var iconCrime = null;
var CrimeMarkers = [];

function setupIcons() {
    iconCrime = new GIcon();
    iconCrime.image = "images/police_light.png";
    iconCrime.shadow = "images/police_light_shadow.png";
    iconCrime.iconSize = new GSize(15, 20);
    iconCrime.shadowSize = new GSize(24, 20);
    iconCrime.iconAnchor = new GPoint(6, 20);
    iconCrime.infoWindowAnchor = new GPoint(5, 1);
}

function loadMarkers(_0xca94x12) {
    if (CrimeMarkers.length != 0) {
        mgr.clearMarkers();
        CrimeMarkers = [];
        document.getElementById("pmimg_" + selectedDateID).src = "images/plus.gif";
    }
}

function downloadComplete(xml) {
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
