/**
    Created by: David Gilson 27/01/2009
    
    Processes the query strings and allows access by named key
    
    Contructor:
        QueryStringProcessor()
              Processes the current pages url storing the unescaped query strings as key/value pair
    
    Method(s):   
        String get(String key) 
              Returns the query string value for the specified key.

    Comments:
        David Gilson Upgrade Notes - 6 September 2024:
            This version uses a Map to store the query strings, which provides better performance and cleaner code.
            Additionally, decodeURIComponent is used instead of unescape as unescape is deprecated.
*/
class QueryStringProcessor {
  constructor() {
    this.querystrings = new Map();
    const url = window.location.search;

    if (url) {
      const data = url.substring((start = 1));
      const splitted = data.split('&');

      for (let i = 0; i < splitted.length; i++) {
        const items = splitted[i].split('=');
        this.querystrings.set(
          items[0].toLowerCase(),
          decodeURIComponent(items[1])
        );
      }
    }
  }

  get(key) {
    const value = this.querystrings.get(key.toLowerCase());
    return value !== undefined ? value : '';
  }
}
