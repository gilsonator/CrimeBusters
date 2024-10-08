'use strict';
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
// import { MarkerClusterer } from '@googlemaps/markerclusterer';

let map;
let eventDates;
let selectedDateID;
let currentMarkers = [];
let currentMarkerSelected;
let lastOpenedInfoWindow;
let currentCircle;
let lastEventHighlighted;
let loadingIndicator;

// Location set to Townsville City
// https://www.latlong.net/place/townsville-city-qld-australia-23743.html

const centerPosition = { lat: -19.258965, lng: 146.816956 };
const xmlPath = 'xml/';
const datesXMLFile = 'dates.xml';

/**
 * Formats a string so that the first letter of each word is capitalized.
 *
 * @param {string} str - The input string to be formatted.
 * @returns {string} - The formatted string with each word capitalized.
 */
function formatString(str) {
  // Regular expression (\b\w) to find the first letter of each word.
  // The \b is a word boundary, and \w matches any word character (equivalent to [a-zA-Z0-9_])
  return str.toLowerCase().replace(/\b\w/g, function (char) {
    return char.toUpperCase();
  });
}

/**
 * Uses the Haversine formula to calculate the distance between two points on the Earth’s surface.
 * https://en.wikipedia.org/wiki/Haversine_formula
 *
 * @param {number} lat1 - Latitude of the first point in degrees.
 * @param {number} lng1 - Longitude of the first point in degrees.
 * @param {number} lat2 - Latitude of the second point in degrees.
 * @param {number} lng2 - Longitude of the second point in degrees.
 * @returns {number} - Distance between the two points in kilometers.
 */
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function handleEvent(event) {
  // loadMarkers(index);
  console.log('Address clicked:', event.target.innerHTML);
  showMarker(event.target.dataset.id);
  event.target.classList.toggle('selected');
  if (lastEventHighlighted) {
    lastEventHighlighted.target.classList.toggle('selected');
  }
  lastEventHighlighted = event;
  return false;
}

export async function load() {
  map = await initMap();

  try {
    const parser = new XMLParser();
    const dates = await parser.loadXMLParseElement(xmlPath + datesXMLFile, 'date');

    // const dates = await parser.loadParseDatesXML(datesXMLFile);
    console.log('Parsed Dates:', dates);
    eventDates = dates;
    if (eventDates.length > 0) {
      await initDatesList(eventDates);
      // const events = await parser.loadParseEventsXML(eventDates[0].FileName);
      // TODO: Loading first is temp...
      const events = await parser.loadXMLParseElement(
        xmlPath + eventDates[0].eventDetailsXML,
        'marker'
      );
      console.log('Parsed Events:', events);

      // DEBUG temp
      document.getElementById('heading_0').innerText = 'Offences (' + events.length + ')';

      // sort by distance from map default center.
      // saving pasrsedFloat lat/lng strings in position object
      events.sort((a, b) => {
        a.position = {
          lat: (parseFloat(a.lat) || 0) + 0.002453,
          lng: (parseFloat(a.lng) || 0) + 0.0019799,
        };
        b.position = {
          lat: (parseFloat(b.lat) || 0) + 0.002453,
          lng: (parseFloat(b.lng) || 0) + 0.0019799,
        };

        const distanceA = haversineDistanceKm(
          centerPosition.lat,
          centerPosition.lng,
          a.position.lat,
          a.position.lng
        );
        const distanceB = haversineDistanceKm(
          centerPosition.lat,
          centerPosition.lng,
          b.position.lat,
          b.position.lng
        );

        // Save the distances in the event objects
        a.distance = distanceA;
        b.distance = distanceB;

        // Sort based on the distances
        return distanceA - distanceB;
      });

      // console.log('Sorted by distance:', events);

      // TODO: Make sure to save loaded ents for dates, only load if not done already
      selectedDateID = 0;
      let eventCount = 0;

      const distances = [];
      // Build event list
      for (const event of events) {
        // Build array for formatted strings of items,and add to event object for further reference.
        // TODO: Check for 'Nil stolen', 'Nothing' and modify to exclude from array, and when building popup excludes list
        event.propertyTakenFmt = [];
        let propertiesTaken = event.propertyTaken.split(/[;,]+/);
        for (const item of propertiesTaken) {
          if (!item.match(/^(Nil stolen|Nothing)$/)) {
            event.propertyTakenFmt.push(formatString(item));
          }
        }

        event.address = formatString(event.address);
        distances.push(event.distance);

        await addMarker(event); // Adding the first markers on first date

        // TEMP DG::: function addToList(event, location, propertyTaken) {
        const tempDiv = document.createElement('div');
        tempDiv.setAttribute('tabindex', eventCount);
        tempDiv.title = event.propertyTakenFmt.length + ' item(s) taken';
        tempDiv.innerHTML = event.address;
        tempDiv.className = 'listItem';
        tempDiv.setAttribute('data-id', eventCount);
        tempDiv.setAttribute('data-distance', event.distance);
        // Handle click event
        tempDiv.addEventListener('click', event => {
          handleEvent(event);
        });

        // Handle keydown event for Enter key
        tempDiv.addEventListener('keydown', event => {
          if (event.key === 'Enter') {
            handleEvent(event);
          }
        });

        // Handle touchend event for tapping on touch devices
        // tempDiv.addEventListener('touchend', event => {
        //  handleEvent(event);
        //});
        document.getElementById('crimes_' + selectedDateID).appendChild(tempDiv);
        //}
        eventCount++;
      }

      console.log("Distances:", distances);
    } else {
      console.error('No event dates found.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function initDatesList(dates) {
  const fragment = document.createDocumentFragment();

  dates.forEach((date, index) => {
    const dateString = new Date(date.dateReported).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }); // click show highlight
    const dateHeaderHTML = `
      <div class='crimeListDateHeading' id='heading_${index}'>
        
      </div>
      <div class='crimeListDIV' id='crimes_${index}'></div>
      `;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = dateHeaderHTML;
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
  });

  // console.log (fragment);
  document.getElementById('crimeList').appendChild(fragment);

  dates.forEach((date, index) => {
    document.getElementById(`heading_${index}`).addEventListener('click', () => {
      // loadMarkers(index);
      console.log('Date Heading clicked:', date);
      return false;
    });
  });
}

async function initMap(date) {
  loadingIndicator = document.getElementById('loading');
  loadingIndicator.style.display = 'block';

  const { Map } = await google.maps.importLibrary('maps');

  map = new Map(document.getElementById('map'), {
    zoom: 12,
    center: centerPosition,
    mapId: 'DG202409CSMAP',
    minZoom: 7,
    maxZoom: 14,
    clickableIcons: false,
  });

  currentCircle = new google.maps.Circle({
    strokeColor: '#0000FF',
    strokeOpacity: 0.8,
    strokeWeight: 1,
    fillColor: '#0000FF',
    fillOpacity: 0.25,
    radius: 100,
  });

  // Function to show/hide the circle based on zoom level and if InfoWindow is open
  function checkZoomLevel() {
    var zoom = map.getZoom();
    if ((zoom <= 10 || zoom >= 16) && lastOpenedInfoWindow?.map) {
      currentCircle.setMap(map);
    } else {
      currentCircle.setMap(null);
    }
    console.log('Current Zoom level: ', zoom);
  }
  map.addListener('zoom_changed', checkZoomLevel);

  // Only show button if secure, or it will fail.
  // NOTE: 0 && is for debug
  if (0 && window.isSecureContext && navigator.geolocation) {
    let userLocation;
    // Create a button element
    var button = document.createElement('button');
    button.textContent = 'Center Map on My Location';
    button.classList.add('custom-map-control-button');
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(button);

    // Add click event listener to the button
    button.addEventListener('click', event => {
      // if (event.ctrlKey) {
      loadingIndicator.style.display = 'block';
      if (userLocation === undefined) {
        navigator.geolocation.getCurrentPosition(
          position => {
            userLocation = new google.maps.LatLng(
              position.coords.latitude,
              position.coords.longitude
            );
            // Wait and set
            map.panTo(userLocation);
            map.setZoom(17);
            loadingIndicator.style.display = 'none';
          },
          error => {
            alert('Geolocation failed!');
            console.error('GeolocationPositionError:', error);
            loadingIndicator.style.display = 'none';
          }
        );
      } else {
        // Already defined
        map.panTo(userLocation);
        map.setZoom(17);
        loadingIndicator.style.display = 'none';
      }
    });
  }

  loadingIndicator.style.display = 'none';
  // new MarkerClusterer({ markers, map });
  return map;
}

async function addMarker(eventDetails) {
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary('marker');
  const { InfoWindow } = await google.maps.importLibrary('maps');

  const defaultIcon = 'images/siren.svg';
  // const hoverIcon = 'images/siren-over.svg';

  const icon = document.createElement('img');
  icon.width = 24;
  icon.height = 24;
  icon.src = defaultIcon;

  const faPin = new PinElement({
    glyph: icon,
    background: 'white',
    borderColor: 'blue',
    scale: 1,
  });

  const marker = await new AdvancedMarkerElement({
    map: map,
    position: eventDetails.position,
    content: faPin.element,
    title: eventDetails.address,
  });

  let propertyTakenList;
  if (eventDetails.propertyTakenFmt.length > 0) {
    propertyTakenList = `${eventDetails.propertyTakenFmt.length} Item(s) taken:
  <ul>
    ${eventDetails.propertyTakenFmt.map(item => `<li><b>${item}</b></li>`).join('')}
  </ul>
`; 
  } else {
    propertyTakenList = " <ul><li><b>No items were taken.</b></li></ul>"
  }

  const markerDiv = `
  <div class='marker' data-id='${currentMarkers.length}'>
    <p>An alleged <b>${eventDetails.type}</b> event occurred at a <b>${eventDetails.location}</b>.</p>
    <p>The perpetrators gained entry by <b>${eventDetails.entry}.</b> ${propertyTakenList}</p>
    <p>Date Reported: <b>${eventDates[selectedDateID].dateString}</b></p>
    <a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURI(eventDetails.address + ',QLD,Australia')}" tabindex="0">
      <span>View on Google Maps</span>
    </a>
    <p class="marker-note"><b>NOTE:</b> The crime markers do not represent specific addresses, they simply point to the area around where acussed crime occured.</p>
  </div>
`;
  const infoWindow = new InfoWindow({
    content: markerDiv,
  });

  infoWindow.setHeaderContent(eventDetails.address);

  // Add a click event listener to the marker
  marker.addListener('click', event => {
    if (lastOpenedInfoWindow) {
      lastOpenedInfoWindow.close();
    }
    if (currentCircle) {
      currentCircle.setMap(null);
    }
    infoWindow.open(map, marker);
    lastOpenedInfoWindow = infoWindow;

    var zoom = map.getZoom();
    if (zoom <= 10 || zoom >= 16) {
      currentCircle.setMap(map);
    }

    currentCircle.setCenter(marker.position);
    // map.panTo(position);
    currentMarkerSelected = marker;

    //event.target.classList.toggle('selected');
    // if (lastEventHighlighted) {
    //  lastEventHighlighted.target.classList.toggle('selected');
    // }
  });

  infoWindow.addListener('closeclick', () => {
    lastOpenedInfoWindow = null;
    currentCircle.setMap(null);
  });

  currentMarkers.push(marker);
}

export function removeMarkers() {
  currentMarkers.forEach(marker => marker.setMap(null));
  currentMarkers = [];
  if (currentCircle) {
    currentCircle.setMap(null);
  }
}

export function showMarker(marker) {
  google.maps.event.trigger(currentMarkers[marker], 'click');
}

export function showRndMarker() {
  const count = currentMarkers.length;

  if (count === 0) {
    console.log('No markers available.');
    return;
  }

  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  const randomIndex = randomBuffer[0] % count;

  const marker = currentMarkers[randomIndex];

  if (marker) {
    google.maps.event.trigger(marker, 'click');
    console.log('Random Idx: ', randomIndex);
  } else {
    console.log('Marker at random index is undefined or null.');
  }
}

// Attach the functions to the window object
window.onload = load;
window.removeMarkers = removeMarkers;
window.showMarker = showMarker;
window.showRndMarker = showRndMarker;
