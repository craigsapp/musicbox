MusicBox
========

A Javascript object for displaying SVG images of musical scores as well as
coordinating audio/video recordings with the score.


Sample Usage
============


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



