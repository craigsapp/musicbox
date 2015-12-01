//
// Programmer:    Craig Stuart Sapp <craig@ccrma.stanford.edu>
// Creation Date: Mon May  4 12:42:14 PDT 2015
// Last Modified: Fri Nov 27 18:23:28 PST 2015 (objectified)
// Last Modified: Mon Nov 30 17:36:34 PST 2015
// Syntax:        JavaScript 1.5
// vim:           ts=3
// Description:   MusicBox object which manages audio/video and
//                score performance alignment management.
//
// Notes:
// HTML 5 audio/video element controls:
//    http://www.w3.org/html/wg/drafts/html/master/single-page.html#mediacontroller
// YouTube iframe element video controls:
//    https://developers.google.com/youtube/iframe_api_reference
//
//

'use strict';


//////////////////////////////
//
// MusicBox -- constructor for the MusicBox object.  If a filename is passed
//    to the constructor (which stores the score and timemap data in the
//    JSON format), then that data will be automatically loaded and the
//    score setup on the page.  Otherwise MusicBox.loadData(filename) or
//    MusicBox.loadData() can be used to activate the object after it has
//    been created.
//

function MusicBox(filename) {

	// fields filled with imported data (from page or file):
	this.score     = null;  // system images and dimensions
	this.timemaps  = null;  // time-to-score alignment data

	this.options   = {};    // settings for controlling interface behavior

	this.states    = {      // current states for object
		media:       null,   // currently active audio/video element
		playing:     0,      // for exiting setInterval when stopped
		refresh:     null,   // for exiting setInterval when stopped
		lasttime:    0,      // last time setInterval called
		lastscroll:  null,   // last element scrolled to automatically
		repeatstate: 0,      // used for selecting 1st, 2nd endings
		anchorstart: 0,      // for starting from a particular point
		anchorstop:  0,      // for starting from a particular point

		// fields derived from .timemaps:
		timemap:     null,   // currently active timemap
		videoFile:   null,   // currently active video filename
		videoType:   null,   // currently active video MIME type
		audioFile:   null,   // currently active audio filename
		audioType:   null    // currently active audio MIME type
	};

	if (filename) {
		this.loadData(filename);
	}

	return this;
};


///////////////////////////////////////////////////////////////////////////
//
// MusicBox.states accessor functions
//

//////////////////////////////
//
// MusicBox.prototype.setActiveMediaElement -- Store the current 
// 	audio/video element
//

MusicBox.prototype.setActiveTimemap = function (index) {
	this.selectTimemap(index);
}

MusicBox.prototype.getActiveTimemap = function () {
	return this.states.timemap;
}

MusicBox.prototype.setActiveMediaElement = function (element) {
	this.states.media = element;
}

MusicBox.prototype.getActiveMediaElement = function () {
	return this.states.media;
}

MusicBox.prototype.getAudioFile = function () {
	return this.states.audioFile;
}

MusicBox.prototype.getAudioType = function () {
	return this.states.audioType;
}

MusicBox.prototype.setAudioFile = function () {
	if (arguments.length == 0) {
		this.states.audioFile = null;
		this.states.audioType = null;
	} else if (arguments.length == 1) {
		if (typeof arguments[0] === 'string') {
			this.states.audioFile = arguments[0];
		} else {
			this.states.audioFile = arguments[0].file;
			this.states.audioType = arguments[0].type;
		}
	} else if (arguments.length == 2) {
			this.states.audioFile = arguments[0];
			this.states.audioType = arguments[1];
	}
}

MusicBox.prototype.getVideoFile = function () {
	return this.states.videoFile;
}

MusicBox.prototype.getVideoType = function () {
	return this.states.videoType;
}

MusicBox.prototype.setVideoFile = function () {
	if (arguments.length == 0) {
		this.states.videoFile = null;
		this.states.videoType = null;
	} else if (arguments.length == 1) {
		if (typeof arguments[0] === 'string') {
			this.states.videoFile = arguments[0];
		} else {
			this.states.videoFile = arguments[0].file;
			this.states.videoType = arguments[0].type;
		}
	} else if (arguments.length == 2) {
			this.states.videoFile = arguments[0];
			this.states.videoType = arguments[1];
	}
}


///////////////////////////////////////////////////////////////////////////
//
// Options handling
//

MusicBox.prototype.defaultOptions = {
	// anticipationTime: time offset to add to event time for adjusting for
	// any latency in the display system.
	'anticipationTime': -20,

	// idPostfix: element ID tag for unique IDs when multiple MusicBox instances
	// on the page.
	'idPostfix': '',

	// videoSelector: the selector used to indicate that video should be
	// inserted within the given element.
	'videoSelector': '#musicbox-video-container',

	// pollFrequency: the speed of setInterval repeat in ms.
	'pollFrequency': 20,


   // resizeToVideo: make the score resize when the video is resized.
	'resizeToVideo': 'yes',

	// scoredataSelector: selector for score definition data on the page.
	'scoreDataSelector': '#musicbox-score-data',

	// scoreSelector: selector for placing score on the page.
	'scoreSelector': '#musicbox-score-container',

	// scrollAnimationtime: speed of animation scroll time in ms.
	'scrollAnimationTime': 800,

	// systemsToShow: number of systems to show at any time.
	'systemsToShow': 2,

	// timemapsDataSelector: selector for location of timemaps of stored on page.
	'timemapsDataSelector': '#musicbox-timemaps-data',

	// titleSelector: selector for displaying a title
	'titleSelector':           '.musicbox-title',

	// viewSytem: system on page which is to be highlighted
	'viewSystem': 1
};



//////////////////////////////
//
// MusicBox.prototype.getDefaultOptions -- Return the list of default 
//    options for the object.  Mostly for reference but also it is
//    possible to adjust default options in the returned object.
//

MusicBox.prototype.getDefaultOptions = function () {
	return MusicBox.prototype.defaultOptions;
}


//////////////////////////////
//
// MusicBox.prototype.setOption -- Set an option.
//

MusicBox.prototype.setOption = function (name, value) {
	this.options[name] = value;
}



//////////////////////////////
//
// MusicBox.prototype.getOption -- Return the value of an option.  If not set
//     locally for an object, then use the default option in the prototype.
//

MusicBox.prototype.getOption = function (name) {
	return name in this.options ?  this.options[name] :
		this.defaultOptions[name];
};



//////////////////////////////
//
// MusicBox.prototype.setOption -- Set the value of an option.  Does not
//     change the values in MusicBox.prototype.defaultOptions.
//

MusicBox.prototype.setOption = function (name, value) {
	this.options[name] = value;
};



//////////////////////////////
//
// MusicBox.prototype.clearOption -- Remove a non-default option setting.
//

MusicBox.prototype.setOption = function (name) {
	if (name in this.options) {
		delete this.options[name];
	}
};



//////////////////////////////
//
// MusicBox.prototype.clearAllOptions -- Remove all non-default option settings.
//

MusicBox.prototype.setOption = function (name) {
	this.options = {};
};



//////////////////////////////
//
// MusicBox.prototype.getSelectorOption -- Return a selector
//   options.  If the selector is an ID, then append the idPostfix
//   option value to the selector.  The ID selector cannot
//   contains class names or any other qualifiers at the moment.
//

MusicBox.prototype.getSelectorOption = function (name) {
	var value = this.getOption(name);
	if (value.match(/^#/)) {
		value += this.getOption("idPostfix");
	}
	return value;
}



//////////////////////////////
//
// Accessor functions for official options --
//

MusicBox.prototype.getAnticipationTime = function () {
	return this.getOption("anticipationTime");
}

MusicBox.prototype.getVideoSelector = function () {
	return this.getSelectorOption("videoSelector");
}

MusicBox.prototype.getPollFrequency = function () {
	return this.getOption("pollFrequency");
}

MusicBox.prototype.getScoreDataSelector = function () {
	return this.getSelectorOption("scoreDataSelector");
}

MusicBox.prototype.getScoreSelector = function () {
	return this.getSelectorOption("scoreSelector");
}

MusicBox.prototype.getScrollAnimationTime = function () {
	return this.getOption("scrollAnimationTime");
}

MusicBox.prototype.getSystemsToShow = function () {
	return this.getOption("systemsToShow");
}

MusicBox.prototype.getTimemapsDataSelector = function () {
	return this.getSelectorOption("timemapsDataSelector");
}

MusicBox.prototype.getTitleSelector = function () {
	return this.getSelectorOption("titleSelector");
}



///////////////////////////////////////////////////////////////////////////
//
// Score and timemap loading functions --
//

//////////////////////////////
//
// MusicBox.prototype.loadData -- Read JSON timemaps and score data
//     structures.  If no filename is given, then read from
//     scripts stored on the page.
//     The score definition would be found in this <script> element:
//        <script id="musicbox-score-data" type="application/json">
//     JSON structure:
//     {
//     	"title",
//     	"svg"
//     	"score": [ // list of movements
//     					[ // system list for movement
//								{"id", "width", "height"},
//								...
//							]
//						]
//     }
//     The timemaps definition would be found in this <script> element:
//        <script id="musicbox-timemaps-data" type="application/json">
//     JSON structure:
//     [
//     	{	// timemap 0
//     	   "video",
//     	   "timemap": {"measure", "moffset", "qstamp", "tstamp"}
//     	},	
//     	...
//     ]
//
//     If there is a filename, then the file will contain a single
//     object, with a "score" parameter containing the score definition
//     and a "timemaps" parameter containing the timemaps data.
//

MusicBox.prototype.loadData = function (filename) {
	if (filename) {
		this.loadDataFromFile(filename);
	} else {
		this.loadDataFromPage();
	}
}



//////////////////////////////
//
// MusicBox.prototype.loadDataFromFile -- Read .score and .timemaps
//    data from a file on the server.
//

MusicBox.prototype.loadDataFromFile = function (filename) {
	var that = this;
	var request = new XMLHttpRequest();
	request.open('GET', filename);
	request.addEventListener('error', function () {
		console.error(this.statusText);
	});
	request.addEventListener('load', function(event) {
		if (request.status == 200) {
			try {
				var result = JSON.parse(request.responseText);
				if (!result.score) {
					console.log("Error: no score defined in file");
				} else {
					that.score = result.score;
				}
				if (!result.timemaps) {
					console.log("Warning: no timemaps defined in file");
				} else {
					that.timemaps = result.timemaps;
					that.setupScore();
				}
			} catch (error) {
				console.log('Error parsing timemaps:', error.message);
				console.log('text:', request.responseText);
			}
		}
	});
	request.send();
}



//////////////////////////////
//
// MusicBox.prototype.loadDataFromPage -- Read .score and .timemaps
//    from HTML page (or loaded via script elements on that page).
//

MusicBox.prototype.loadDataFromPage = function () {
	if (!this.timemaps) {
		this.loadTimemapData();
	}
	if (!this.score) {
		this.loadScoreData();
	}
	this.setupScore();
}



//////////////////////////////
//
// MusicBox.prototype.setupScore -- Once a score and optional timemaps
//     have been loaded into the MusicBox.score and MusicBox.timemaps
//     parameters, display the score, the optional video and process
//     possible hash anchor timestamp in the URL.
//

MusicBox.prototype.setupScore = function () {
	this.initializeDisplay();
	this.initializeInterface();
	this.processHash();
	if (!(document.getElementById('audio') ||
		document.getElementById('video'))) {
		this.createMediaInterface();
	}
}



//////////////////////////////
//
// MusicBox.prototype.initializeInterface --
//

MusicBox.prototype.initializeInterface = function () {
	var that = this;
	window.addEventListener("keydown", function(event) {
		that.keydownEventHandler(event);
	});
	var box = document.querySelector(this.getScoreSelector());
	// set automatically now:
	// box.style.height = musicbox.getMaxSystemHeight();
	box.style.width = musicbox.getMaxSystemWidth() + 20;
	this.addNoteControls();
}



//////////////////////////////
//
// MusicBox.prototype.loadScoreData --
//

MusicBox.prototype.loadScoreData = function () {
	var data = document.querySelector(this.getScoreDataSelector());
	if (!data) {
		console.log('Cannot find score data');
	}
	try {
		this.score = JSON.parse(data.textContent);
	} catch (error) {
		console.log('Error parsing timemaps:', error.message);
		console.log('text:', data.textContent);
	}
}



//////////////////////////////
//
// MusicBox.prototype.getMovementCount -- Return the number of movements
//     (or arbitrary segmentations) of the score.
//

MusicBox.prototype.getMovementCount = function () {
	return this.score ? this.score.score.length : 0;
}



//////////////////////////////
//
// MusicBox.prototype.getMaxSystemHeight -- Return the greatest system
//     height in the score.
//

MusicBox.prototype.getMaxSystemHeight = function () {
	var movements = this.score.score;
	if (!movements) {
		return 0;
	}
	var max = 0;
	var i, j;
	for (i=0; i<movements.length; i++) {
		for (j=0; j<movements[i].length; j++) {
			if (movements[i][j].height > max) {
				max = movements[i][j].height;
			}
		}
	}
	return max;
}



//////////////////////////////
//
// MusicBox.prototype.getMaxSystemWidth -- Return the greatest system
//     width in the score
//

MusicBox.prototype.getMaxSystemWidth = function () {
	var movements = this.score.score;
	if (!movements) {
		return 0;
	}
	var max = 0;
	var i, j;
	for (i=0; i<movements.length; i++) {
		for (j=0; j<movements[i].length; j++) {
			if (movements[i][j].width > max) {
				max = movements[i][j].width;
			}
		}
	}
	return max;
}



//////////////////////////////
//
// MusicBox.prototype.loadTimemapData --
//

MusicBox.prototype.loadTimemapData = function () {
	var selector = this.getTimemapsDataSelector();
	var data = document.querySelector(selector);
	if (!data) {
		console.log('Cannot find timemaps, giving up');
		console.log('Timemaps selector should be', selector);
		return;
	}
	try {
		this.timemaps = JSON.parse(data.textContent);
	} catch (error) {
		console.log('Error parsing timemaps JSON structure:', error.message);
		console.log('JSON content:', data.textContent);
	}
}


///////////////////////////////////////////////////////////////////////////
//
// Other functions --
//

//////////////////////////////
//
// getSvgImage --
//

MusicBox.prototype.getSvgImage = function (tag) {
	return atob(this.score.svg[tag]);
}



//////////////////////////////
//
// processHash -- Search the URL hashtag for a location in the
//     score to start at.
//

MusicBox.prototype.processHash = function () {
	if (!location.hash) {
		return;
	}

	var measure = 1;
	var beat = 1;
	var repeat = 0;
	var matches;
	var start = location.hash;
	var stop  = "";

	if (matches = start.match(/(.*)-([a-z].*)/)) {
		start = matches[1];
		stop  = matches[2];
	}
	console.log("START position", start);

	if (matches = start.match(/m(\d+)/)) {
		measure = parseInt(matches[1]);
	}
	if (matches = start.match(/b(-?\d+\.?\d*)/)) {
		beat = matches[1];
	}
	if (matches = start.match(/r(\d+)/)) {
		repeat = parseInt(matches[1]);
	}

	var hashtime = getHashTimeInfo(measure, beat, repeat);
	console.log("HASHSTARTTIME", hashtime);
	this.states.anchorstart = hashtime.tstamp;
	var iface = this.getActiveMediaElement();
	iface.currentTime = this.states.anchorstart;
	iface.play();

	if (!stop) {
		return;
	}
	console.log("STOP position", stop);

	measure = 1;
	beat = 1;
	repeat = 0;

	if (matches = stop.match(/m(\d+)/)) {
		measure = parseInt(matches[1]);
	}
	if (matches = stop.match(/b(-?\d+\.?\d*)/)) {
		beat = matches[1];
	}
	if (matches = stop.match(/r(\d+)/)) {
		repeat = parseInt(matches[1]);
	}

	hashtime = this.getHashTimeInfo(measure, beat, repeat);
	console.log("HASHENDTIME", hashtime);
	this.states.anchorstop = hashtime.tstamp;
	if (this.states.anchorstart >= this.states.anchorstop) {
		this.states.anchorstop = 0;
	}
}



//////////////////////////////
//
// MusicBox.prototype.getHashTimeInfo --
//

MusicBox.prototype.getHashTimeInfo = function (measure, beat, repeat) {
	var i;
	var locations = [];
	var tm = this.getActiveTimemap();
	for (i=0; i<tm.length-1; i++) {
		if (tm[i].measure != measure) {
			continue;
		}
		if (tm[i].moffset + 1 != beat) {
			continue;
		}
		locations.push(i);
	}
	if (locations.length == 0) {
		return 0;
	}
	if (locations.length == 1) {
		return tm[locations[0]];
	}
	if (locations.length >= 2) {
		if (repeat == 1) {
			return tm[locations[0]];
		} else {
			return tm[locations[1]];
		}
	}
	return 0;
}



//////////////////////////////
//
// keydown event listener -- What to do when a key is pressed.
//


MusicBox.prototype.keydownEventHandler = function (event) {
	var SpaceKey  =  32;
	var ZeroKey   =  48;
	var OneKey    =  49;
	var TwoKey    =  50;
	var ThreeKey  =  51;
	var CommaKey  = 188;
	var PeriodKey = 190;

	switch (event.keyCode) {
		case PeriodKey:
			var width = parseInt(video.style.width) * 1.1;
			if (width > window.innerWidth) {
				width = window.innerWidth;
			}
			video.style.width = width + 'px';
			break;

		case CommaKey:
			var width = parseInt(video.style.width) * 0.9;
			video.style.width = width + 'px';
			break;

		case SpaceKey:
			var iface = this.getActiveMediaElement();
			if (iface) {
				if (this.states.playing == 1) {
					iface.pause();
				} else {
					iface.play();
				}
			}
			event.preventDefault();
			break;
		case OneKey:
			this.states.repeatstate = 1;
			break;
		case TwoKey:
			this.states.repeatstate = 2;
			break;
		case ThreeKey:
			this.states.repeatstate = 3;
			break;
		case ZeroKey:
			this.states.repeatstate = 0;
			break;

	}
}



//////////////////////////////
//
// MusicBox.prototype.createMediaInterface --
//

MusicBox.prototype.createMediaInterface  = function (itype) {
	if (itype == 'audio') {
		this.createAudioInterface('audio');
	} else if (itype == 'video') {
		this.createVideoInterface('video');
	} else if (this.getAudioFile()) {
		this.createAudioInterface('audio');
	} else if (this.getVideoFile()) {
		this.createVideoInterface('video');
	}
}



//////////////////////////////
//
// createAudioInterface -- Display audio playback button,
//    prepare audio event handlers, and prepare time to
//    quarter note mapping.
//

MusicBox.prototype.createAudioInterface = function (id) {
	var audio = document.createElement('AUDIO');
	document.body.appendChild(audio);
	var that = this;
	audio.setAttribute('controls', 'controls');
	audio.id              = id;
	audio.style.position  = 'fixed';
	audio.style.bottom    = '0';
	audio.style.right     = '0';
	audio.style.width     = '100%';
	audio.style.zIndex    = '1';
	audio.addEventListener('play', function() {that.playMedia});
	audio.addEventListener('pause', function() {that.stopMedia});
	var text = '<source src="';
	text += this.getAudioFile;
	text += '" type="' + that.audioType + '"/>';
	audio.innerHTML = text;
}



//////////////////////////////
//
// createVideoInterface -- Display video playback interface,
//    prepare video event handlers, and prepare time to
//    quarter note mapping.
//
//    resizeable: http://viralpatel.net/blogs/jquery-resizable-draggable-resize-drag-tutorial-example
//

MusicBox.prototype.createVideoInterface = function (id) {
	var video = document.createElement('VIDEO');
	var xmedia = document.querySelector(this.getVideoSelector());
	if (xmedia) {
		xmedia.innerHTML = '';
		xmedia.appendChild(video);
	} else {
		document.body.appendChild(video);
	}

	var that = this;
	video.setAttribute('controls', 'controls');
	video.id              = id;
	// video.style.position  = 'fixed';
	// video.style.bottom    = '0';
	// video.style.right     = '0';
	// video.style.width     = '100%';
	video.style.width     = '838px';
	// video.style.opacity   = 0.98;
	// video.style['-webkit-filter'] = 'blur(0.5px)';
	// video.style.height     = '100%';
	// video.style['border-radius'] = '70px 0 0 0'
	video.style.zIndex    = '1';
	video.addEventListener('play', function() {that.playMedia()});
	video.addEventListener('pause', function() {that.stopMedia()});
	var text = '<source src="';
	text += this.getVideoFile();
	text += '" type="' + this.getVideoType() + '"/>';
	video.innerHTML = text;
	this.setActiveMediaElement(video);
	var sc = document.querySelector(this.getScoreSelector());
	if (sc) {
		sc.className = "video";
	}
}



//////////////////////////////
//
// playMedia -- Event handler for starting audio playback.
//

MusicBox.prototype.playMedia = function (event) {
	this.states.playing = 1;
	var iface = this.getActiveMediaElement();
	this.states.lasttime = iface.currentTime;
	var that = this;
	this.states.refresh = setInterval(function() {
		if (that.states.playing == 0) {
			clearInterval(that.states.refresh);
			return;
		}
		var a = iface;
		var delta = a.currentTime - that.states.lasttime;
		if (delta == 0.0) {
			return;
		}
		that.checkTimeMap(a.currentTime);
		that.states.lasttime = a.currentTime;
		if (that.anchorstop) {
			if (that.anchorstop <= a.currentTime) {
				that.anchorstop = 0;
				a.pause();
			}
		}
	}, this.getPollFrequency());
}



//////////////////////////////
//
// stopMedia -- Event handler for stopping audio playback.
//

MusicBox.prototype.stopMedia = function (event) {
	this.states.playing = 0; // make timemap monitoring setInterval() exit
	var tm = this.getActiveTimemap();
	this.unhighlightRange(0, tm.length-1);
}



//////////////////////////////
//
// MusicBox.prototype.unhighlightRange -- Turn off notes which are within
//    the inclusive range of the current timemap.  If no ending index is given
//    then turn off from given index to the end of the list.
//

MusicBox.prototype.unhighlightRange = function (starti, endi) {
	var tm = this.getActiveTimemap();
	if (!tm) {
		console.log("Error: no timemap");
		return;
	}
	for (var i=starti; i<=endi; i++) {
		var mytime = tm[i].qstamp.toString().replace(/\./, "d");
		var offclass = ".noteoff-" + mytime;
		var offlist = document.querySelectorAll(offclass);
		for (var j=0; j<offlist.length; j++) {
			if (!offlist[j].getAttribute("class").match(/\bon\b/)) {
				// Can't use .className on SVG elements
				// Don't turn of notes which are already off.
				continue;
			}
			var classinfo = offlist[j].getAttribute("class");
			classinfo = classinfo.replace(/ ?\bon\b/, "");
			offlist[j].setAttribute("class", classinfo);
			offlist[j].style.color  = "black";
			offlist[j].style.stroke = "black";
			if (offlist[j].style.animation) {
				offlist[j].style["animation"]         = "";
				offlist[j].style["-webkit-animation"] = "";
				offlist[j].style["-moz-animation"]    = "";
				offlist[j].style["-ms-animation"]     = "";
			}
		}
	}
}



//////////////////////////////
//
// MusicBox.prototype.highlightRange -- Turn on notes which are within
//    the inclusive range of the TIMEMAP.
//

MusicBox.prototype.highlightRange = function (starti, endi) {
	var tm = this.getActiveTimemap();
	if (!tm) {
		console.log("Error: no timemap");
	}
	for (var i=starti; i<=endi; i++) {
		var mytime = tm[i].qstamp.toString().replace(/\./, "d");
		var onclass = ".noteon-" + mytime;
		var onlist = document.querySelectorAll(onclass);
		for (var j=0; j<onlist.length; j++) {
			if (onlist[j].classList.contains("on")) {
				// only turn on once
				continue;
			}
			// can't use .className with SVG elements
			var classinfo = onlist[j].getAttribute("class");
			onlist[j].setAttribute("class", classinfo + " on");
			onlist[j].style.color  = "red";
			onlist[j].style.stroke = "red";
			if (onlist[j].classList.contains("trill")) {
				this.createTrillAnimation(onlist[j], i);
			}
			this.bringIntoView(onlist[j], i);
		}
	}
}



//////////////////////////////
//
// createTrillAnimation -- Turn on a trill animation by measuring
//    the duration of the input note to calculate the number of times
//    that the trill animation must be repeated.
//

MusicBox.prototype.createTrillAnimation = function (element, starti) {
	var tm = this.getActiveTimemap();
	var ontime = tm[starti].tstamp;
	var offq = element.getAttribute("class").match(/noteoff-([\dd]+)/)[1];
	offq = offq.replace(/d/, ".");
	var offtime = this.getTimeFromQI(starti, offq);
	var duration = offtime - ontime + 0.0001;
	var count = parseInt(duration / 0.1);
	if (count < 1) {
		return;
	}
	element.style["animation"]         = "trill .1s " + count;
	element.style["-webkit-animation"] = "trill .1s " + count;
	element.style["-moz-animation"]    = "trill .1s " + count;
	element.style["-ms-animation"]     = "trill .1s " + count;
}



//////////////////////////////
//
// MusicBox.prototype.getTimeFromQI -- Get the time of the off
//    quarter note timestamp, starting to search at starti index in timemap.
//

MusicBox.prototype.getTimeFromQI = function (starti, offq) {
	var tm = this.getActiveTimemap();
	for (var i=starti; i<tm.length; i++) {
		if (tm[i].qstamp >= offq) {
			return tm[i].tstamp;
		}
	}
	return tm[starti].tstamp;
}



//////////////////////////////
//
// bringIntoView -- Make the actively playing system visible in the browser window.
//    The active system is set as the second visible system on the page.  This
//    would have to be changed for orchestral music (where the second system
//    visibility might be cropped by the window), or for small screens or
//    small browser windows.
//

MusicBox.prototype.bringIntoView = function (element) {
	// var zment = element.parentNode;
	var zment = element;

	while (zment.nodeName != 'BODY') {
		if (zment.nodeName == 'TR') {
			break;
		}
		zment = zment.parentNode;
	}
	if (zment.nodeName != 'TR') {
		return;
	}

	if (zment == this.states.lastscroll) {
		return;
	}

	if (!this.states.lastscroll) {
		this.states.lastscroll = zment;
	}

	// console.log("musicbox",$('#musicbox').offset().top,
	// 		"st", $('#musicbox').scrollTop(),
	// 		"tr", $(zment).offset().top);

	var sselect = this.getScoreSelector();
	if (zment && (this.states.lastscroll !== zment)) {
		//zment.scrollIntoViewIfNeeded(true);
		//zment.scrollIntoView({behavior:"smooth"});
		$(sselect).animate({
			scrollTop: $(zment).offset().top + $(sselect).scrollTop()
					- $(sselect).offset().top
		}, sselect);
		this.states.lastscroll = zment;
	}
	return;

// old code which puts the previous line at the top of the page/div:

	var pzment;
	while (zment.nodeName != 'BODY') {
		if (zment.nodeName == 'TR') {
			pzment = zment;
			zment = zment.previousSibling;

			if (zment && (this.states.lastscroll !== zment)) {
				// zment.scrollIntoViewIfNeeded(true);
				// zment.scrollIntoView({behavior:"smooth"});
				$('html, body').animate({
					scrollTop: $(zment).offset().top
				}, this.getScrollAnimationTime());
				this.states.lastscroll = zment;
				break;
			} else if ((zment === null) && (this.states.lastscroll !== pzment)) {
				$('html, body').animate({
					scrollTop: $(pzment).offset().top
				}, this.getScrollAnimationTime());
				this.states.lastscroll = pzment;
				break;
			}
			break;
		}

		if (zment === null) {
			break;
		}
		zment = zment.parentNode;
	}
}



//////////////////////////////
//
// checkTimeMap -- Monitor the timemap to see if any quarter note events
//    need to be processed.
//

MusicBox.prototype.checkTimeMap = function (nowtime) {
	var tm = this.states.timemap;
	if (!tm) {
		return;
	}
	var lasti = 0;
	var nexti = 0;
	var ttime;
	var startindex = -1;
	var stopindex = -1;
	var lasttime = this.states.lasttime;
	var increment = this.getPollFrequency();

	for (var i=0; i<tm.length; i++) {
		ttime = tm[i].tstamp;
		if (startindex < 0) {
			if (ttime >= lasttime) {
				startindex = i;
			}
		}
		if (ttime <= nowtime + 0.015) {
			stopindex = i;
		} else {
			break;
		}
	}

	if ((startindex >=0) && (stopindex >= 0)) {
		this.highlightRange(startindex, stopindex);
		this.unhighlightRange(startindex, stopindex);
	}
}



//////////////////////////////
//
// addNoteControls -- Add onclick callback so that when clicking on a note,
//    the audio will start playing from that point in the score.
//

MusicBox.prototype.addNoteControls = function () {
	var images = document.querySelectorAll(this.getScoreSelector() + " svg");
	var that = this;
	for (var i=0; i<images.length; i++) {
		var notes = images[i].querySelectorAll("g[class^='noteon-']");
		for (var jj=0; jj<notes.length; jj++) {
			if (!notes[jj].className.baseVal.match(/noteon/)) {
				if (i==0) { console.log(notes[jj]); };
			} else {
				var number = notes[jj].className.baseVal.match(/noteon-([^\s]+)/)[1];
				notes[jj].onclick = function(event) {that.playFromEvent(event);}
			}
		}
	}
}



//////////////////////////////
//
// playFromEvent -- Start playing the audio recording from the clicked element.
//

MusicBox.prototype.playFromEvent = function (event) {
	var targ = event.target;
	while (targ.nodeName != "BODY") {
		if (targ.className === null ||
				typeof targ.className != "object") {
			break;
		}
		if (targ.getAttribute("class")) {
		   var matches = targ.getAttribute("class").match("noteon-([^\\s]+)");
		} else {
			matches = null;
		}
		if (matches) {
			var iface = this.getActiveMediaElement();
			iface.pause();
			var quarter = matches[1];
			var timeval = this.getTimeFromQuarterNote(quarter, -0.050);
			this.states.lasttime = timeval + this.getAnticipationTime() / 1000.0;
			this.states.lastscroll = null;
			iface.currentTime = timeval + this.getAnticipationTime() / 1000.0;
			iface.play();
		}
		targ = targ.parentNode;
	}
}



//////////////////////////////
//
// MusicBox.prototype.getTimeFromQuarterNote -- Extract the time in
//   seconds according to the quarter note timestamp.  This function
//   assumes that there is an exact entry for the qstamp.  If not, then
//   the next qstamp will be used.  Linearly interpolating between two
//   adjacent qstamps might be more elegant (and allow offbeat timings
//   to be caculated automatically from beat-level timestamp data).
//

MusicBox.prototype.getTimeFromQuarterNote = function (stamp, offset) {
	var tm = this.getActiveTimemap();
	stamp = stamp.replace(/d/, ".");
	var locations = [];
	for (var i=0; i<tm.length; i++) {
		if (tm[i].qstamp == stamp) {
			locations.push(tm[i].tstamp);
			continue;
		}
		if (i < tm.length) {
			if ((stamp > tm[i].qstamp) 
					&& (stamp < tm[i+1].qstamp)) {
				locations.push(tm[i].tstamp);
				continue;
			}
		}
	}
	if (locations.length == 9) {
		return 0;
	}

	if (this.states.repeatstate == 1) {
		this.states.repeatstate = 0; // reset repeat state after used
		return locations[0];

	} else if (this.states.repeatstate == 2) {
		if (locations.length >= 2) {
		   this.states.repeatstate = 0; // reset repeat state after used
			return locations[1];
		} else {
		   this.states.repeatstate = 0; // reset repeat state after used
			return locations[0];
		}

	} else if (this.states.repeatstate == 3) {
		if (locations.length >= 3) {
		   this.states.repeatstate = 0; // reset repeat state after used
			return locations[2];
		} else {
		   this.states.repeatstate = 0; // reset repeat state after used
			return locations[0];
		}

	} else if ((this.states.repeatstate == 0) && (locations.length > 1)) {
		// choose the closest position to the current time.
		var iface = this.getActiveMediaElement();
		var curtime = iface.currentTime;
		var time1 = Math.abs(curtime - locations[0]);
		var time2 = Math.abs(curtime - locations[1]);
		this.states.repeatstate = 0; // reset repeat state after used
		return time1 < time2 ? locations[0] : locations[1];
	}
	if (locations.length > 0) {
		this.states.repeatstate = 0; // reset repeat state after used
		return locations[0];
	} else {
		return 0;
	}
}



//////////////////////////////
//
// initializeDisplay --  Place SVG images of the systems for the score
//    into a table (the table rows are used to automatically keep the
//    active music system visible.
//

MusicBox.prototype.initializeDisplay = function () {
	var music     = this.score.score;
	var maxwidth  = this.getMaxSystemWidth();
	var maxheight = this.getMaxSystemHeight();

	var title = document.querySelector(this.getTitleSelector());
	if (title) {
		title.innerHTML = this.score.title;
	}
	var box = document.querySelector(this.getScoreSelector());

	var boxtext = '<div class="musicbox-score"></div>';
	box.innerHTML = boxtext;
	var musicarea = box.querySelector('.musicbox-score');

	// add divs for each movement/section:
	var i;
	var j;
	var marea = '';
	for (i=0; i<music.length; i++) {
		marea += '<div id="m' + (i+1) + '"></div>';
	}
	musicarea.innerHTML = marea;

	for (i=0; i<music.length; i++) {
		this.displayScore(1);
	}

	var width;
	var height;
	for (i=0; i<music.length; i++) {
		for (j=0; j<music[i].length; j++) {
			width  = music[i][j].width;
			height = music[i][j].height;
			if (width > maxwidth) {
				maxwidth = width;
			}
			if (height > maxheight) {
				maxheight = height;
			}
		}
	}
	box.style.height = maxheight * this.getSystemsToShow() + 'px';
console.log(box);
	this.setActiveTimemap();
}



/////////////////////////////
//
// displayScore --  Place the score within a table on the page.  Each system
// 	is placed on a separate row in the table, and automatic scrolling is
// 	dependent on these <tr> elements.
//

MusicBox.prototype.displayScore = function (num) {
	var mvmtid = 'm' + num;
	var index = num - 1;
	var sysid;
	var width;
	var height;
	var content = '';
	var Music     = this.score.score;
	var Maxwidth  = this.getMaxSystemWidth();
	var Maxheight = this.getMaxSystemHeight();
	content += '<table class="music">';
	for (var i=0; i<Music[index].length; i++) {
		sysid   = Music[index][i].id;
		width   = Music[index][i].width;
		height  = Music[index][i].height;
		content += '<tr>'
		content += '<td style="width:'
		content += Maxwidth + '; height:' + Maxheight + '">';
		content += this.getSvgImage(sysid);
		content +=  '</td></tr>';
	}
	var target = document.getElementById(mvmtid);
	target.innerHTML = content;
}



///////////////////////////////
//
// MusicBox.prototype.selectTimemap -- Takes a stored timemap 
//     from the MusicBox.timemaps array and interpolates it 
//     with all unspecified times from the score.  Not that the
//     score has to be placed on the page before this function
//     is called, since it needs to read qstamps from the score.
//

MusicBox.prototype.selectTimemap = function (index) {
	if (!index) {
		index = 0;
	}
	if (index < 0) {
		index = 0;
	}
	if (index > this.timemaps.length - 1) {
		index = this.timemaps.length - 1;
	}

	if (this.timemaps[index].video) {
   	this.setVideoFile(this.timemaps[index].video);
	} else {
		this.setVideoFile();
	}
	if (this.timemaps[index].audio) {
   	this.setAudioFile(this.timemaps[index].audio);
	} else {
		this.setAudioFile();
	}

	var basemap = this.timemaps[index].timemap;

	var onselector = this.getScoreSelector();
	onselector += " svg g[class^='noteon-']";

	var offselector = this.getScoreSelector();
	offselector += " svg g[class^='noteoff-']";

	var onlist  = Array.prototype
						.slice.call(document.querySelectorAll(onselector));
	var offlist = Array.prototype
						.slice.call(document.querySelectorAll(offselector));

	// Probably don't need both on- and off-times, since
	// notes should always have both, but being safe.
	var qtimes = this.getTimes(onlist.concat(offlist));
	// console.log("TIMES", qtimes);
	// console.log("BASEMAP", basemap);

	var nts = [];
	var curi = 0;
	var i;
	var j;
	var nexti;
	var newstamp;
	var pretarget;
	var target;
	var interp;

	// check if the inputs are correct:
	//console.log("QTIMES", qtimes);
	//console.log("TIMEMAP", basemap);
	for (i=0; i<qtimes.length; i++) {
		if (qtimes[i] == basemap[curi].qstamp) {
			nts.push(basemap[curi]);
			curi++;
			continue;
		}
		if (qtimes[i] > basemap[curi].qstamp) {
			curi++;
			i--;
			continue;
		}
		// need to interpolate value
		if (curi == 0) {
			// but can't interpolate if nothing at start (or end)
			console.log("Error: no starting event time");
		}
		// find next extant timestamp
		target = basemap[curi];
		pretarget = nts[nts.length-1];
		interp = this.getInterpolation(qtimes[i], pretarget, target);

		// Check individual interpolation assignments:
		//console.log("PRETARGET", pretarget);
		//console.log("QSTAMP", qtimes[i]);
		//console.log("TARGET", target);
		//console.log("INTERPOLATION", qtimes[i], interp);
		//console.log("");

		newstamp = {};
		newstamp.tstamp = interp;
		newstamp.qstamp = qtimes[i];
		// Add measure and moffset keys here as well.
		nts.push(newstamp);
	}

	// check if the output is correct:
	//console.log(nts);
	this.states.timemap = nts;
}



///////////////////////////////
//
// MusicBox.prototype.getInterpolation -- Interpolate the time for an
//     undocumented qstamp.
//

MusicBox.prototype.getInterpolation = function (qstamp, event1, event2) {
	var t1 = event1.tstamp;
	var t2 = event2.tstamp;
	var q1 = event1.qstamp;
	var q2 = event2.qstamp;
	var tstamp = ((qstamp-q1)/(q2-q1))*(t2-t1)+t1;
	return parseInt(tstamp * 1000.0 + 0.5)/1000.0;;
}



//////////////////////////////
//
// MusicBox.prototype.getTimes -- Return the timestamps embedded in
//     SVG class names.
//

MusicBox.prototype.getTimes = function (list) {
	if (!list.length) {
		return [];
	}
	var times = {};
	var i;
	var reg = new RegExp(/noteo[nf]+-([d\d]+)/gi);
	var result;
	var tag;
	for (i=0; i<list.length; i++) {
		while ((result = reg.exec(list[i].className.baseVal)) !== null) {
			tag = result[1].replace("d", ".");
			times[tag] = "1";
		}
	}
	var keys = Object.keys(times);
	return keys.sort(function(a,b){return a-b});
}



