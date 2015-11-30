MusicBox
========

A JavaScript object for displaying SVG images of musical scores as well as
coordinating audio/video recordings with the score.

(under development)


Website
=======

See http://musicbox.sapp.org for documentation and examples.


Sample Usage
============

Add the JavaScript file 
[musicbox.js](https://github.com/craigsapp/musicbox/blob/master/src/scripts/musicbox.js) 
and the CSS file
[musicbox.css](https://github.com/craigsapp/musicbox/blob/master/src/scripts/musicbox.css)  to a webpage to enable MusicBox.  Then add the example script
as seen in this HTML example:

```html
<link rel="stylesheet" type="text/css" href="styles/musicbox.css">
<script src="scripts/musicbox.js"></script>

<script>
	var musicbox;
	document.addEventListener("DOMContentLoaded", function(event) {
		musicbox = new MusicBox("musicbox.json");
	});
</script>

<center>
	<h1 class="musicbox-title"></h1>
	<div id="musicbox-video-container"></div>
	<div id="musicbox-score-container"></div>
</center>
```

The MusicBox will search for an element with the id `musicbox-score-container`
into which the score will be placed.  An element with the id
`musicbox-video-container` will be used to place a video if there
is an associated video file for the score.  Otherwise, the MusicBox
will search for an existing HTML video element on the page to link to.
If no video is found then a linked audio file will be searched for.

An online version of the MusicBox files can be used (which will be the
most recent version and possibly subject to bugs):

https://raw.githubusercontent.com/craigsapp/musicbox/master/src/scripts/musicbox.js
https://raw.githubusercontent.com/craigsapp/musicbox/master/src/styles/musicbox.css



