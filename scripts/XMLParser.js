/**
 * XMLParser Class
 * 
 * This class provides methods to load and parse XML files, extracting attributes
 * from specified elements and returning them in a structured array format.
 * 
 * Methods:
 * - constructor(): Initializes a new instance of the XMLParser class.
 * - loadXMLParseElement(xmlFile, elementName): Asynchronously loads an XML file,
 *   parses it, and extracts attributes from specified elements.
 * 
 * Usage:
 * const parser = new XMLParser();
 * parser.loadXMLParseElement('path/to/xmlfile.xml', 'ElementName')
 *   .then(attributesArray => {
 *     console.log(attributesArray);
 *   })
 *   .catch(error => {
 *     console.error('Error:', error);
 *   });
 * 
 * Example Output:
 * [
 *   {
 *     DateString: '2023-04-06',
 *     FileName: 'example.txt',
 *     Date: '2023-04-06T00:00:00.000Z'
 *   },
 *   ...
 * ]
 */
export class XMLParser {
  constructor() {

  }

  /**
   * Asynchronously loads an XML file, parses it, and extracts attributes from specified elements.
   * 
   * @param {string} xmlFile - The path to the XML file to be loaded.
   * @param {string} elementName - The name of the elements to extract attributes from.
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects containing the attributes.
   * @throws {Error} If there is an error fetching or parsing the XML file.
   */
  async loadXMLParseElement(xmlFile, elementName) {
    try {
        const response = await fetch(xmlFile);
        const data = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'text/xml');
        
        const elements = xmlDoc.getElementsByTagName(elementName);
        let attributesArray = [];

        for (let i = 0; i < elements.length; i++) {
          let attributesObject = {};
          for (let attr of elements[i].attributes) {
              if (attr.name === "Date")
                attributesObject[attr.name] = new Date(attr.value);
              else
                attributesObject[attr.name] = attr.value;
          }
          attributesArray.push(attributesObject);
      }

        return attributesArray;
    } catch (error) {
        console.error('Error fetching the XML file:', error);
        throw error;
    }
  }
}
