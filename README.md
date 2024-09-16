# Crime Busters Online Web based Application Upgrade
This is an upgrade of code I developed to show maps of crimes reported to police. This was used in local news paper website.

**Note: the code is no longer in use, and the crime accusations are old.**

Back in the day, we worked with Queensland Police to send daily reports, In another stand alone application, I created `.xml` files based on dates of reports. 

This application was used to show reported events as markers using Google Maps API.

> A first in Australia!

## Notes
I created this to outline my skills, ability to upgrade old code without original source:

* Complete rewrite of old code.
* I un-obfuscated my original code downloaded from Wayback Machine.
* Upgrading to latest version of Google Maps API.
* Upgraded to use HTML5/ES6 Modules.
* Uses the Haversine formula to calculate the distance between two points on the Earth’s surface, sorts events listed, based on distance from map center. https://en.wikipedia.org/wiki/Haversine_formula

**No external JavaScript frameworks such as Angular or React where used.**

### Old Code Written by myself in 2010
<https://web.archive.org/web/20120224161647/http://www.townsvillebulletin.com.au/crimebusters/>

I used multiple resources to find and download the HTML and related `.css`, `.js` as well as related images.

Ended up directly downloading the code, removing Wayback Machine code and links:
<https://web.archive.org/web/*/http://static.townsvillebulletin.com.au/crimebusters/*>

![Wayback Machine URLs Download](examples/WaybackMachineDownload.png)

For Specific Date:
<https://web.archive.org/web/20111213050643if_/http://static.townsvillebulletin.com.au/crimebusters/#>

## Upgrade Notes:

### Error with outdated version:

From Edge DevTools Console:

> Google Maps JavaScript API has been loaded directly without loading=async. 
This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading 

Code was using:
```HTML
<script src="https://maps.googleapis.com/maps/api/js?key="" type="text/javascript"></script>
```
### I tried other ways to download old souce code:
First using different ways, but ended up simply downloading manually.

#### Bash Script

```bash
#!/bin/bash
url= "http://www.townsvillebulletin.com.au/crimebusters/" 
wget "http://web.archive.org/cdx/search/cdx?url=${url}*&output=json&fl=original,timestamp" -O out.json
sed -Eni '2,$s%^\["([^"]*)","([^"]*)"](,|])$%https://web.archive.org/web/\2id_/\1%gmp' out.json 
wget -i out.json
```
### Wayback Machine Downloader
> Source: https://github.com/hartator/wayback-machine-downloader

## Examples:
### IFRAME

This was the application, using an `<IFRAME>` running on web browser:

![Wayback Machine](examples/website.png)

The `<IFRAME>` source. Not all images downloaded and Google Maps outdated:

![Wayback Machine IFRAME](examples/website-iframe.png)

### New version in browser:

![This version](examples/Screenshot_2024-09-14-192746.png)

![This version](examples/Screenshot_2024-09-14-192904.png)

Running on Android mobile phone, in full screen:

<img src="examples/Screenshot_20240908_160740_Edge.jpg" width="40%" />

### Old website example
Using a screenshot of the old website, used it as a background and added `<IFRAME>` using new version.

![Old Bully Website](examples/bullywebsiteupgrade.png)
## Installation

To get started with this project, you'll need to have Node.js and npm installed on your machine.

1. Clone the repository:
   ```PowerShell
   git clone https://github.com/gilsonator/CrimeBusters.git
   ```
1. Navigate to the project directory
2. Install the dependencies:
   ```PowerShell
   npm install
   ```
## Running the Project
Install `http-server` if needed:
```PowerShell
npm install http-server --save-dev
```
Then run:
```PowerShell
npm start
```