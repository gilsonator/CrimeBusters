"use strict";
/**
 * XMLParser Class
 * By David Gilson 
 * 
 * This class is responsible for fetching and parsing XML files containing date and event information.
 * 
 * Methods:
 * - loadParseDatesXML: Asynchronously fetches the XML file and parses its date content.
 * - loadParseEvents: Asynchronously fetches the XML file and parses its event content.
 * 
 * Usage:
 * const xmlPath = 'path/to/xml/';
 * const datesXMLFile = 'dates.xml';
 * const eventsXMLFile = 'events.xml';
 * const parser = new XMLParser(xmlPath);
 * 
 * parser.loadParseDatesXML(datesXMLFile).then(dates => {
 *   console.log('Parsed Dates:', dates);
 * }).catch(error => {
 *   console.error('Error:', error);
 * });
 * 
 * parser.loadParseEventsXML(eventsXMLFile).then(events => {
 *   console.log('Parsed Events:', events);
 * }).catch(error => {
 *   console.error('Error:', error);
 * });
 */

export class XMLParser {
  constructor(xmlPath) {
    this.xmlPath = xmlPath;
  }

  async loadParseDatesXML(datesXMLFile) {
    try {
      const response = await fetch(this.xmlPath + datesXMLFile);
      const data = await response.text();
      return this.#parseDatesXML(data);
    } catch (error) {
      console.error('Error fetching the XML file:', error);
      throw error;
    }
  }

  async loadParseEventsXML(eventsXMLFile) {
    try {
      const response = await fetch(this.xmlPath + eventsXMLFile);
      const data = await response.text();
      return this.#parseEventsXML(data);
    } catch (error) {
      console.error('Error fetching the XML file:', error);
      throw error;
    }
  }

  #parseDatesXML(data) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');
    
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

    return dates;
  }

  #parseEventsXML(data) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');
    
    const markerElements = xmlDoc.getElementsByTagName('marker');
    const markers = [];

    for (let i = 0; i < markerElements.length; i++) {
      const lat = markerElements[i].getAttribute('lat');
      const lng = markerElements[i].getAttribute('lng');
      const address = markerElements[i].getAttribute('address');
      const type = markerElements[i].getAttribute("type");
      const propertyTaken = markerElements[i].getAttribute("propertyTaken");
      const location = markerElements[i].getAttribute("location");
      const entry = markerElements[i].getAttribute("entry");

      markers.push({
        Position: { lat: parseFloat(lat) + 0.002453, lng: parseFloat(lng) + 0.0019799 }, 
        Address: address,
        PropertyTaken: propertyTaken,
        Type: type,
        Location: location,
        Entry: entry,
      });
    }

    return markers;
  }
}
