# Crime Busters Online Web Application Upgrade
This is an upgrade of code I developed to show maps of crimes reported to police. This was used in local news paper website. 

> **A first in Australia!**

Worked with QPS to organise a download of reports and then created  `.xml` files based on date of report.

Involved:
* Complete rewrite
* Upgrading to latest version of Google Maps API
* Upgraded to use HTML5


## Notes
I used multiple resources to find and download the HTML and related `.css`, `.js` and images.

Ended up directly downloadeding the code, removing Wayback Machine code and links:

<https://web.archive.org/web/*/http://static.townsvillebulletin.com.au/crimebusters/*>

Specific Date:

<https://web.archive.org/web/20111213050643if_/http://static.townsvillebulletin.com.au/crimebusters/#>

### I tried other ways:

#### Bash Script

```bash
#!/bin/bash
url= "http://www.townsvillebulletin.com.au/crimebusters/" 
wget "http://web.archive.org/cdx/search/cdx?url=${url}*&output=json&fl=original,timestamp" -O out.json
sed -Eni '2,$s%^\["([^"]*)","([^"]*)"](,|])$%https://web.archive.org/web/\2id_/\1%gmp' out.json 
wget -i out.json
```

### Wayback Machine Downloader
Source: https://github.com/hartator/wayback-machine-downloader

wayback_machine_downloader http://www.townsvillebulletin.com.au/crimebusters/ --directory dev/cb --from 20110822050130 


\\wsl.localhost\fedora\home\gilsond\development\my-recovered-websites\web.archive.org\web\20111213050643js_\http\static.townsvillebulletin.com.au

