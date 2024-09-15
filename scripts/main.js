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

let map;
let eventDates;
let selectedDateID;
let currentMarkers = [];
let currentMarkerSelected;
let lastOpenedInfoWindow;
let currentCircle;
let lastEventHighlighted

const xmlPath = 'xml/';
const datesXMLFile = 'dates.xml';

function formatString(str) {
  return str.toLowerCase().replace(/\b\w/g, function (char) {
    return char.toUpperCase();
  });
}

export async function load() {
  map = await initMap();

  try {
    const parser = new XMLParser();
    const dates = await parser.loadXMLParseElement(
      xmlPath + datesXMLFile,
      'date'
    );

    // const dates = await parser.loadParseDatesXML(datesXMLFile);
    console.log('Parsed Dates:', dates);
    eventDates = dates;
;
    if (eventDates.length > 0) {
      await initDatesList(eventDates);
      // const events = await parser.loadParseEventsXML(eventDates[0].FileName);
      // TODO: Loading first is temp...
      const events = await parser.loadXMLParseElement(
        xmlPath + eventDates[0].eventDetailsXML,
        'marker'
      );
      console.log('Parsed Events:', events);

      // TODO: Make sure to save loaded ents for dates, only load if not done already
      selectedDateID = 0;
      let eventCount = 0;

      events.forEach(event => {
        addMarker(event); // Adding the first markers on first date

        // TEMP DG::: function addToList(event, location, propertyTaken) {
        const tempDiv = document.createElement('div');
        tempDiv.setAttribute('tabindex', eventCount);
        tempDiv.title = 'Show the location.';
        tempDiv.innerHTML = formatString(event.address);
        tempDiv.className = 'listItem';
        tempDiv.setAttribute('data-id', eventCount);
        tempDiv.addEventListener('click', event => {
          // loadMarkers(index);
          console.log('Address clicked:', event.target.innerHTML);
          showMarker(event.target.dataset.id);
          event.target.classList.toggle('selected');
          if (lastEventHighlighted) { lastEventHighlighted.target.classList.toggle('selected'); }
          lastEventHighlighted = event
          return false;
        });
        document
          .getElementById('crimes_' + selectedDateID)
          .appendChild(tempDiv);
        //}
        eventCount++;
      });
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
        ${dateString}
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
    document
      .getElementById(`heading_${index}`)
      .addEventListener('click', () => {
        // loadMarkers(index);
        console.log('Date Heading clicked:', date);
        return false;
      });
  });
}

async function initMap(date) {
  // Location set to Townsville City
  const centerPosition = { lat: -19.285221, lng: 146.773911 };
  // Request needed libraries.
  //@ts-ignore
  const { Map } = await google.maps.importLibrary('maps');

  map = new Map(document.getElementById('map'), {
    zoom: 12,
    center: centerPosition,
    mapId: 'DG202409CSMAP',
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
    console.log('Current Zoom level: ' + zoom);
  }

  // Add event listener for zoom changes
  map.addListener('zoom_changed', checkZoomLevel);

  return map;
}

async function addMarker(eventDetails) {
  const { AdvancedMarkerElement, PinElement } =
    await google.maps.importLibrary('marker');
  const { InfoWindow } = await google.maps.importLibrary('maps');

  const defaultIcon = 'images/siren.svg';
  // const hoverIcon = 'images/siren-over.svg';

  // DG NOTE: The lat/lng in xml files are off, slighly adjusted based on difference to Google Maps
  const position = {
    lat: (parseFloat(eventDetails.lat) || 0) + 0.002453,
    lng: (parseFloat(eventDetails.lng) || 0) + 0.0019799,
  };
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
    position: position,
    content: faPin.element,
    title: eventDetails.address,
  });

  let propertyTakenList = `
  <ul>
    ${eventDetails.propertyTaken
      .split(';')
      .map(item => `<li><b>${item}</b></li>`)
      .join('')}
  </ul>
`;

  const markerDiv = `
  <div class='marker' data-id='${currentMarkers.length}'>
    <p>An alleged <b>${eventDetails.type}</b> event occurred at a <b>${eventDetails.location}</b>.</p>
    <p>The perpetrators gained entry by <b>${eventDetails.entry}</b> and stole: ${propertyTakenList}</p>
    <p>Date Reported: <b>${eventDates[selectedDateID].dateString}</b></p>
    <a target="_blank" z-index="-1" href="https://www.google.com/maps/search/?api=1&query=${encodeURI(eventDetails.address + ',QLD,Australia')}" tabindex="0">
      <span>View on Google Maps</span>
    </a>
    <p class="marker-note"><b>NOTE:</b> The crime markers do not represent specific addresses, they simply point to the area around where acussed crime occured.</p>
  </div>
`;
  const infoWindow = new InfoWindow({
    content: markerDiv,
  });

  infoWindow.setHeaderContent(formatString(eventDetails.address));

  // Add a click event listener to the marker
  marker.addListener('click', () => {
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

    currentCircle.setCenter(position);
    map.panTo(position);
    currentMarkerSelected = marker;
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
  const randomIndex = Math.floor(Math.random() * count);

  google.maps.event.trigger(currentMarkers[randomIndex], 'click');
  console.log ('Random Idx: ', randomIndex);
}

// Attach the functions to the window object
window.onload = load;
window.removeMarkers = removeMarkers;
window.showMarker = showMarker;
window.showRndMarker = showRndMarker;
