var _____WB$wombat$assign$function_____ = function(name) {return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name)) || self[name]; };
if (!self.__WB_pmw) { self.__WB_pmw = function(obj) { this.__WB_source = obj; return this; } }
{
  let window = _____WB$wombat$assign$function_____("window");
  let self = _____WB$wombat$assign$function_____("self");
  let document = _____WB$wombat$assign$function_____("document");
  let location = _____WB$wombat$assign$function_____("location");
  let top = _____WB$wombat$assign$function_____("top");
  let parent = _____WB$wombat$assign$function_____("parent");
  let frames = _____WB$wombat$assign$function_____("frames");
  let opener = _____WB$wombat$assign$function_____("opener");

/**
    Created by: David Gilson 27/01/2009
    
    Processes the query strings and allows access by named key
    
    Contructor:
        QueryStringProcessor()
              Processes the current pages url storing the unescaped query strings as key/value pair
    
    Method(s):   
        String get(String key) 
              Returns the query string value for the specified key.           
*/
function QueryStringProcessor ()
{
    var querystrings = [];
    
    var url = window.location.search;

	if (url != "") 
	{
        var data = url.substr(1);
	    var splitted = data.split("&");
    	
	    for (i=0;i<=splitted.length-1;i++)
	    {
		    var items = splitted[i].split("=");
		    querystrings[items[0].toLowerCase()] = unescape(items[1]);
	    }
	}
    
    this.get = function (key)
                {
                    var s = querystrings[key.toLowerCase()];
                    
                    if (typeof(s) == "undefined")
                        s = "";
                                
                    return s;
                }
}   
    

}
/*
     FILE ARCHIVED ON 20:02:21 Mar 17, 2012 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 01:51:23 Sep 06, 2024.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 0.94
  exclusion.robots: 0.049
  exclusion.robots.policy: 0.037
  esindex: 0.039
  cdx.remote: 23.121
  LoadShardBlock: 281.876 (3)
  PetaboxLoader3.datanode: 241.827 (4)
  PetaboxLoader3.resolve: 91.784 (2)
  load_resource: 82.373
*/