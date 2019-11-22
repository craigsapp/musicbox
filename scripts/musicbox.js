//
// Programmer:    Craig Stuart Sapp <craig@ccrma.stanford.edu>
// Creation Date: Mon May  4 12:42:14 PDT 2015
// Last Modified: Fri Nov 27 18:23:28 PST 2015 (objectified)
// Last Modified: Fri Aug 26 12:35:15 CEST 2016
// Syntax:        JavaScript 1.5
// Description:   MusicBox object which manages audio/video and
//                score performance alignment management.
// vim:           ts=3
//
// Notes:
// HTML 5 audio/video element controls:
//    http://www.w3.org/html/wg/drafts/html/master/single-page.html#mediacontroller
// YouTube iframe element video controls:
//    https://developers.google.com/youtube/iframe_api_reference
//
//

'use strict';

function MusicBox(filename, filename2) {

	// fields filled with imported data (from page or file):
	this.score     = null;  // system images and dimensions
	this.timemaps  = null;  // time-to-score alignment data

	this.options   = {};    // settings for controlling interface behavior

	this.states    = {      // current states for object
		media:       null,   // currently active audio/video element
		mediatype:   null,   // youtube, video or audio
		playing:     0,      // used for exiting from setInterval when stopped
		refresh:     null,   // used for exiting from setInterval when stopped
		lasttime:    0,      // last time setInterval called
		lastscroll:  null,   // last element scrolled to automatically
		repeatstate: 0,      // used for selecting 1st, 2nd endings
		anchorstart: 0,      // used for starting from a particular point
		anchorstop:  0,      // used for starting from a particular point
		tmindex:     null,   // index of current timemap
		theme:       null,   // for display style for score
		scoreready:  false,  // for tracking if score is complete
		timemapsready: false, // for tracking if timemaps is complete
		initialized: false,  // for keeping track of if score on page
		scorestyle:  'full', // for keeping track of score layout style on page.

		// fields derived from .timemaps:
		timemap:     null,   // currently active timemap
		videoFile:   null,   // currently active video filename
		videoType:   null,   // currently active video MIME type
		audioFile:   null,   // currently active audio filename
		audioType:   null    // currently active audio MIME type
	};

	if (arguments.length == 1) {
		// work on this case...
		this.loadData(filename);
	} else if (arguments.length == 2) {
		this.loadData(filename, filename2);
	}

	this.debug = 0;   // for printing debugging statements

	return this;
};


///////////////////////////////////////////////////////////////////////////
//
// MusicBox.states accessor functions
//


MusicBox.prototype.getTimemap = function (index) {
	if (!('timemaps' in this)) {
		return null;
	}
	return this.timemaps[index];
}

MusicBox.prototype.setActiveMediaType = function (aType) {
	this.states.mediatype = aType;
}

MusicBox.prototype.setScoreReady = function () {
	this.states.scoreready = true;
}

MusicBox.prototype.getScoreReady = function () {
	return this.states.scoreready;
}

MusicBox.prototype.setTimemapsReady = function () {
	this.states.mapsready = true;
}

MusicBox.prototype.getTimemapsReady = function () {
	return this.states.mapsready;
}

MusicBox.prototype.getInitialized = function () {
	return this.states.initialized;
}

MusicBox.prototype.setInitialized = function () {
	this.states.initialized = true;
}

MusicBox.prototype.getScoreStyle = function () {
	return this.states.scorestyle;
}

MusicBox.prototype.setScoreStyle = function (style) {
	if (style == 'full') {
		var selector = this.getScoreSelector()
		var element = document.querySelector(selector);
		element.style['overflow-y'] = '';
		element.style['overflow-x'] = '';
		element.style.overflow = '';
	}

	this.states.scorestyle = style;
}



//////////////////////////////
//
// MusicBox.prototype.setActiveMediaElement -- Store the current 
// 	audio/video element
//

MusicBox.prototype.setActiveTimemap = function (index, selector) {
	if (!index) {
		index = 0;
	}
	var tm = this.getTimemap(index);
	this.activateTimemap(index, selector);
	var mediaorder = this.getMediaPreference();
	for (var i=0; i<mediaorder.length; i++) {
		if ((mediaorder[i] == 'youtube') && ('youtube' in tm)) {
			this.setActiveMediaType('youtube');
			break;
		} else if ((mediaorder[i] == 'video') && ('video' in tm)) {
			this.setActiveMediaType('video');
			break;
		} else if ((mediaorder[i] == 'audio') && ('audio' in tm)) {
			this.setActiveMediaType('audio');
			break;
		}
	}

}

MusicBox.prototype.getActiveTimemap = function () {
	return this.states.timemap;
}

MusicBox.prototype.getActiveMediaType = function () {
	return this.states.mediatype;
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
		} else if ((typeof arguments[0] === 'object') && (arguments[0] !== null)) {
			this.states.audioFile = arguments[0].file;
			this.states.audioType = arguments[0].type;
		} else {
			this.states.audioFile = null;
			this.states.audioType = null;
		}
	} else if (arguments.length == 2) {
		if ((typeof arguments[0] === 'object') && (arguments[0] !== null)) {
			this.states.audioFile = arguments[0].file;
			this.states.audioType = arguments[0].type;
		} else {
			this.states.audioFile = arguments[0];
			this.states.audioType = arguments[1];
		}
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
	'pollFrequency':         20,  // speed of setInterval repeat in ms
	'scrollAnimationTime':  800,  // speed of system animation scroll time in ms
	'anticipationTime':     -20,  // time to start playing before note in ms
	'systemsToShow':          2,  // number of systems to show at any time
	'viewSystem':             1,  // system on page which is highlighted
	'audioStyle':				'full',
	'videoStyle':				'boxed',
	'mediaPreference':       ['youtube', 'video', 'audio'],
	'timemapsDataSelector':  '#musicbox-timemaps-data',
	'scoreDataSelector':     '#musicbox-score-data',
	'mediaSelector':         '#musicbox-video-container',
	'scoreSelector':         '#musicbox-score-container',
	'workTitleSelector':     '#musicbox-work-title',
	'movementTitleSelector': '#musicbox-movement-title',
	'recordingTitleSelector':'#musicbox-recording-title'
};



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


MusicBox.prototype.getSelectorOption = function (name) {
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
// Accessor functions for official options --
//


MusicBox.prototype.getAnticipationTime = function () {
	return this.getOption('anticipationTime');
}

MusicBox.prototype.getMediaPreference = function () {
	return this.getOption('mediaPreference');
}

MusicBox.prototype.getMediaSelector = function () {
	return this.getOption('mediaSelector');
}

MusicBox.prototype.getPollFrequency = function () {
	return this.getOption('pollFrequency');
}

MusicBox.prototype.getScoreDataSelector = function () {
	return this.getSelectorOption('scoreDataSelector');
}

MusicBox.prototype.getScoreSelector = function () {
	return this.getSelectorOption('scoreSelector');
}

MusicBox.prototype.getScrollAnimationTime = function () {
	return this.getOption('scrollAnimationTime');
}

MusicBox.prototype.setScrollAnimationTime = function (value) {
	try {
		value = parseInt(value);
		this.options.scrollAnimationTime = value;
	} catch (error) {
		console.log('Error in setting scrollAnimationTime', value);
	}
}

MusicBox.prototype.getSystemsToShow = function () {
	return this.getOption('systemsToShow');
}

MusicBox.prototype.getTimemapsDataSelector = function () {
	return this.getSelectorOption('timemapsDataSelector');
}

MusicBox.prototype.getWorkTitleSelector = function () {
	return this.getSelectorOption('workTitleSelector');
}

MusicBox.prototype.getMovementTitleSelector = function () {
	return this.getSelectorOption('movementTitleSelector');
}

MusicBox.prototype.getRecordingTitleSelector = function () {
	return this.getSelectorOption('recordingTitleSelector');
}


///////////////////////////////////////////////////////////////////////////
//
// Data structure access
//

MusicBox.prototype.getWorkTitle = function () {
	return 'title' in this.score ? this.score.title : '';
}

MusicBox.prototype.getMovementTitle = function (index) {
	return '';
}


MusicBox.prototype.getTimemapParameter = function (name, index) {
	if (typeof index === 'undefined') {
		index = this.states.tmindex;
	} else if (index === null) {
		index = this.states.tmindex;
	}
	if (!this.timemaps) {
		return '';
	}
	if (!this.timemaps[index]) {
		return '';
	}
	return name in this.timemaps[index] ? this.timemaps[index][name] : '';
}


MusicBox.prototype.getTimemapParameterScalar = function (name, index) {
	var value = this.getTimemapParameter(name, index);
	if (Array.isArray(value)) {
		return value[0];
	} else {
		return value;
	}
}


MusicBox.prototype.getRecordingTitle = function (index) {
	return this.getTimemapParameterScalar('title', index);
}

MusicBox.prototype.getRecordingTitleUrl = function (index) {
	return this.getTimemapParameterScalar('title-url', index);
}

MusicBox.prototype.getRecordingUrl = function (index) {
	return this.getTimemapParameterScalar('url', index);
}



///////////////////////////////////////////////////////////////////////////
//
// Score and timemap loading functions
//

//////////////////////////////
//
// MusicBox.prototype.loadData -- Read JSON timemaps and score data
//     structures.  If no filename is given, then read from
//     scripts stored on the page.
//     The score definition would be found in this <script> element:
//        <script id='musicbox-score-data' type='application/json'>
//     JSON structure:
//     {
//     	'title',
//     	'svg'
//     	'score': [ // list of movements
//     					[ // system list for movement
//								{'id', 'width', 'height'},
//								...
//							]
//						]
//     }
//     The timemaps definition would be found in this <script> element:
//        <script id='musicbox-timemaps-data' type='application/json'>
//     JSON structure:
//     [
//     	{	// timemap 0
//     	   'video',
//     	   'timemap': {'m', 'moffset', 'qstamp', 'tstamp'}
//     	},
//     	...
//     ]
//
//     If there is a filename, then the file will contain a single
//     object, with a 'score' parameter containing the score definition
//     and a 'timemaps' parameter containing the timemaps data.
//

MusicBox.prototype.loadData = function () {
	var scoreFile = "";
	var timemapsFile = "";
	if (arguments.length == 2) {
		scoreFile    = arguments[0];
		timemapsFile = arguments[1];
	} else {
		selector = arguments[0];
		if (!selector) {
			selector = this.getTimemapsDataSelector();
		}
	}
	if (this.debug) {
		console.log('MusicBox.prototype.loadData(', scoreFile, ', ', 
				timemapsFile, ')');
	}
	if (scoreFile) {
		this.loadScoreFromFile(scoreFile);
	} else {
		this.loadScoreFromPage();
	}
	if (timemapsFile) {
		this.loadTimemapsFromFile(timemapsFile);
	} else {
		this.loadTimemapsFromPage(selector);
	}
}



//////////////////////////////
//
// MusicBox.prototype.loadTimemapsFromPage --
//

MusicBox.prototype.loadTimemapsFromPage = function (selector) {
	if (!selector) {
		selector = this.getTimemapsDataSelector();
	}
	var containers = document.querySelectorAll(selector);
	if (containers.length == 0) {
		console.log("Warning no timemaps found on page using selector", selector);
		return;
	}
	if (!this.timemaps) {
		this.timemaps = [];
	}
	var i, j;
	for (i=0; i<containers.length; i++) {
		var content = containers[i].textContent;
		var item = JSON.parse(content);
		if (item.constructor === Array) {
			for (j=0; j<item.length; j++) {
				this.timemaps.push(item[j]);
			}
		} else {
			this.timemaps.push(item);
		}
	}
	console.log(this.timemaps);
}



//////////////////////////////
//
// MusicBox.prototype.unpackSvg --
//
//

MusicBox.prototype.unpackSvg = function () {
	var element;
	for (var property in this.score.svg) {
		if (!this.score.svg.hasOwnProperty(property)) {
			continue;
		}
		element = document.createElement('DIV');
		element.innerHTML = atob(this.score.svg[property]);
		this.score.svg[property] = element.children[0];
	}
	this.setScoreReady();
}



//////////////////////////////
//
// MusicBox.prototype.loadScoreFromFile -- Read .score data from 
//     a file on the server.
//

MusicBox.prototype.loadScoreFromFile = function (filename) {
	if (this.debug) {
		console.log('MusicBox.prototype.loadScoreFromFile(', filename, ')');
	}

	var that = this;
	var request = new XMLHttpRequest();
	request.open('GET', filename);
	request.addEventListener('error', function () {
		console.error(this.statusText);
	});
	request.addEventListener('load', function(event) {
		if (this.debug) {
			console.log('receiving score data, status:', request.status);
		}
		if (request.status == 200) {
			try {
				var result = JSON.parse(request.responseText);
				if (!result.score) {
					console.log('Error: no score defined in file');
				} else {
					that.score = result;
					that.unpackSvg();
					if (this.debug) {
						console.log('   Trying .setupScore() from .loadScoreFromFile()');
					}
					that.setupScore();
				}
			} catch (error) {
				console.log('Error parsing score file:', error.message);
			}
		}
	});
	request.send();

}



//////////////////////////////
//
// MusicBox.prototype.loadTimemapsFromFile -- Read .timemaps
//    data from a file on the server.
//

MusicBox.prototype.loadTimemapsFromFile = function (filename) {
	if (this.debug) {
		console.log('MusicBox.prototype.loadTimemapsFromFile(', filename, ')');
	}

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
				if (!result.timemaps) {
					console.log('Warning: no timemaps defined in file');
				} else {
					that.timemaps = result.timemaps;
					that.loadTimemapFiles();
					if (this.debug) {
						console.log('   Checking setupScore from .loadTimemapsFromFile()');
					}
					that.setupScore();
				}
			} catch (error) {
				console.log('Error parsing timemaps:', error.message);
				// console.log('text:', request.responseText);
			}
		}
	});
	request.send();

}



///////////////////////////////
//
// MusicBox.prototype.loadTimemapFiles -- If a timemap entry does not have
//    a .timemap property, then look for a file property and download
//    its contents into the timemap.
//

MusicBox.prototype.loadTimemapFiles = function () {
	if (this.debug) {
		console.log('MusicBox.prototype.loadTimemapFiles()');
	}
	var tms = this.timemaps;
	if (typeof tms === 'undefined') {
		return;
	}

	var filled = true;
	for (var i=0; i<tms.length; i++) {
		if (!('timemap' in tms[i])) {
			filled = false;
			if ('file' in tms[i]) {
				this.loadTimemapDataFile(i);
			}
		}
	}
	if (filled) {
		this.setTimemapsReady();
	}
	if (this.debug) {
			console.log('Checking setupScore from .loadTimemapFiles()');
	}
	this.setupScore();
}




//////////////////////////////
//
// MusicBox.prototype.loadTimemapDataFile --
//

MusicBox.prototype.loadTimemapDataFile = function (index) {
	if (this.debug) {
		console.log('MusicBox.prototype.loadTimemapDataFile(', index, ')');
	}
	var tms = this.timemaps;
	if (typeof tms === 'undefined') {
		return;
	}
	var filename;
	if ('file' in tms[index]) {
		filename = tms[index].file;
	}
	if (!filename) {
		returnl;
	}

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
				if (!result.timemap) {
					console.log('Warning: no timemap defined in file');
				} else {
					that.timemaps[index] = result;
					var filled = true;
					for (var i=0; i<tms.length; i++) {
						if (!('timemap' in tms[index])) {
							filled = false;
							if ('file' in tms[index]) {
								this.loadTimemapDataFile(i);
							}
						}
					}
					if (filled) {
						that.setTimemapsReady();
					}
					if (this.debug) {
						console.log('Checking setupScore from .loadTimemapDataFile()');
					}
					that.setupScore();
				}
			} catch (error) {
				console.log('Error parsing timemap file:', error.message);
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
		this.loadData();
	}
	if (this.debug) {
		console.log('Checking setupScore from .loadDataFromPage()');
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
	if (this.debug) {
		console.log('MusicBox.prototype.setupScore()');
	}
	if (!(this.getScoreReady() && this.getTimemapsReady())) {
		if (this.debug) {
			console.log('   Is scrore ready?: ', !!this.getScoreReady());
			console.log('   Are timemaps ready?: ', !!this.getTimemapsReady());
			console.log('   Score and timemaps are not both ready');
		}
		// score is not ready
		return;
	}
	if (this.debug) {
		console.log('   Score and timemaps are both ready');
	}
	if (this.getInitialized()) {
		// score was already setup
		return;
	}
	this.prepareAlignment(0, this.getScoreSelector());
}


//////////////////////////////
//
// MusicBox.prototype.prepareAlignment --
//

MusicBox.prototype.prepareAlignment = function (index, selector) {
	this.setInitialized();
	this.setActiveTimemap(index, selector);
	this.createMediaInterface(this.getActiveMediaType());
	this.initializeDisplay();
	this.initializeInterface();
	this.processHash();
}



//////////////////////////////
//
// MusicBox.prototype.initializeInterface --
//

MusicBox.prototype.initializeInterface = function () {
	var that = this;
	window.addEventListener('keydown', function(event) {
		that.keydownEventHandler(event);
	});
	var box = document.querySelector(this.getScoreSelector());
	// set automatically now:
	// box.style.height = musicbox.getMaxSystemHeight();
	box.style.width = musicbox.getMaxSystemWidth() + 20;
	that.addNoteControls();
}



//////////////////////////////
//
// MusicBox.prototype.loadScoreDataFromPage --
//

MusicBox.prototype.loadScoreData = function () {
	if (this.debug) {
		console.log('MusicBox.prototype.loadScoreData()');
	}
	var dataelement = document.querySelector(this.getScoreDataSelector());
	if (!dataelement) {
		console.log('Cannot find score data');
	}
	try {
		this.score = JSON.parse(dataelement.textContent);
		this.unpackSvg();
	} catch (error) {
		console.log('Error parsing score data:', error.message);
		console.log('text:', dataelement.textContent);
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
	var movements;
	if (this.score) {
		movements = this.score.score;
	} else{
		return 0;
	}
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

MusicBox.prototype.loadTimemapData = function (selector) {
	if (!selector) {
		selector = this.getTimemapsDataSelector();
	}
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
// getSvgImageHTML --
//

MusicBox.prototype.getSvgImage = function (tag) {
	return this.score.svg[tag].outerHTML;
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
	var stop  = '';

	if (matches = start.match(/(.*)-([a-z].*)/)) {
		start = matches[1];
		stop  = matches[2];
	}
	console.log('START position', start);

	if (matches = start.match(/m(\d+)/)) {
		measure = parseInt(matches[1]);
	}
	if (matches = start.match(/b(-?\d+\.?\d*)/)) {
		beat = matches[1];
	}
	if (matches = start.match(/r(\d+)/)) {
		repeat = parseInt(matches[1]);
	}

	var hashtime = this.getHashTimeInfo(measure, beat, repeat);
	console.log('HASHSTARTTIME', hashtime);
	this.states.anchorstart = hashtime.tstamp;
	var iface = this.getActiveMediaElement();
	iface.currentTime = this.states.anchorstart;
	iface.play();

	if (!stop) {
		return;
	}
	console.log('STOP position', stop);

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
	console.log('HASHENDTIME', hashtime);
	this.states.anchorstop = hashtime.tstamp;
	if (this.states.anchorstart >= this.states.anchorstop) {
		this.states.anchorstop = 0;
	}
}



//////////////////////////////
//
// MusicBox.prototype.getHashTimeInfo -- Need to add interpolation for hash
//    times which are not in the timemap.
//

MusicBox.prototype.getHashTimeInfo = function (measure, beat, repeat) {
	var i;
	var locations = [];
	var tm = this.getActiveTimemap();
	for (i=0; i<tm.length-1; i++) {
		if (tm[i].m != measure) {
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
// MusicBox.prototype.createMediaInterface -- Either create or
//    use an existing video or audio interface.  The order of checking
//    for an inteface is:
//
//    (1) If a YouTube iframe is present on the page, link the
//        score to that interface.
//    (2) If timemaps.timemap[i].video.file is a YouTube URL,
//        create an interface for it and then link the score to it.
//    (3) Search for a <video> element on the page and link the 
//        score to it.
//    (4) If timemaps.timemap[i].video is defined and
//        #musicbox-video-content exists, create a <video>
//        element inside #musicbox-video-content, and supply it
//			 with the video(s) provided by the timemap.
//    (5) Search for an <audio> interface on the page and link the
//        score to it.
//    (6) If timemaps.timemap[i].audio is defined and 
//        #musicbox-audio-content exists, then create an <audio>
//        interface within it and link it to the score.
//    (7) If timemaps.timemap[i].audio is defined and 
//        #musicbox-audio-content does not exist, then create an <audio>
//        interface and float it at the bottom of the page.
//    (8) If not video or audio, display the score by itself without links.
//

MusicBox.prototype.createMediaInterface  = function (itype) {
	if (this.debug) {
		console.log('MusicBox.prototype.createMediaInterface(', itype, ')');
	}
	// check for case #1
	// check for case #2
	// check for case #3
	// check for case #4
	// check for case #5
	// check for case #6
	// check for case #7
	// check for case #8

	if (itype == 'audio') {
		if (this.debug) {console.log('   CASE 1, creating AUDIO element')}
		this.setScoreStyle(this.getOption('audioStyle'));
		this.createAudioInterface('audio');
	} else if (itype == 'video') {
		if (this.debug) {console.log('   CASE 2, creating VIDEO element')}
		this.setScoreStyle(this.getOption('videoStyle'));
		this.createVideoInterface('video');
	} else if (this.getAudioFile()) {
		if (this.debug) {console.log('   CASE 3, creating AUDIO element')}
		this.setScoreStyle(this.getOption('audioStyle'));
		this.createAudioInterface('audio');
	} else if (this.getVideoFile()) {
		if (this.debug) {console.log('   CASE 4, creating VIDEO element')}
		this.setScoreStyle(this.getOption('videoStyle'));
		this.createVideoInterface('video');
	} else {
		console.log('WAT IS GOING ON?', itype, this.getAudioFile());
	}
}



//////////////////////////////
//
// createAudioInterface -- Display audio playback button,
//    prepare audio event handlers, and prepare time to
//    quarter note mapping.
//

MusicBox.prototype.createAudioInterface = function (id) {
	var audio = document.querySelector("audio#" + id);
	if (!audio) {
		audio = document.createElement('AUDIO');
		document.body.appendChild(audio);
	}
	var that = this;
	audio.setAttribute('controls', 'controls');
	audio.id              = id;
	audio.style.preload   = 'metadata';
	audio.style.position  = 'fixed';
	audio.style.bottom    = '0';
	audio.style.right     = '0';
	audio.style.width     = '100%';
	audio.style.zIndex    = '1';
	audio.addEventListener('play', function() {that.playMedia()});
	audio.addEventListener('pause', function() {that.stopMedia()});
	var text = '<source src="' + this.getAudioFile();
	text += '" type="' + that.getAudioType() + '"/>';
	audio.innerHTML = text;
	this.setActiveMediaElement(audio);

	// timemap is probably already loaded:
	if (!this.states.timemap) {
		return;
	}

	var newstart = this.states.timemap[0].tstamp 
			+ this.getAnticipationTime()/1000.0;
	var iface = this.getActiveMediaElement();
	var that = this;
   if (iface) {
		iface.addEventListener("loadedmetadata", function() {
			console.log("LOADED META DATA");
			if ((newstart >= 0.0) && (newstart > that.states.lasttime)) {
				console.log("pushing start time ahead to", newstart, "seconds");
				iface.currentTime    = newstart;
				that.states.lasttime = newstart;
				console.log("Current time", iface.currentTime);
			}
		});
	}
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
	var xmedia = document.querySelector(this.getMediaSelector());
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
}



//////////////////////////////
//
// playMedia -- Event handler for starting audio playback.
//

MusicBox.prototype.playMedia = function (event) {
console.log("PLAYING MEDIA");
	this.states.playing = 1;
	var iface = this.getActiveMediaElement();
	this.states.lasttime = iface.currentTime;
	var newstart = this.states.timemap[0].tstamp + this.getAnticipationTime()/1000.0;
	if ((newstart >= 0.0) && (newstart > this.states.lasttime)) {
		iface.currentTime    = newstart;
		this.states.lasttime = newstart;
		console.log("Pushing start time ahead to", newstart, "seconds");
	}
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
console.log("STOPPING MEDIA");
	this.states.playing = 0; // make timemap monitoring setInterval() exit
	this.unhighlightRange(0, this.getActiveTimemap().length-1);
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
		console.log('Error: no timemap');
		return;
	}
	for (var i=starti; i<=endi; i++) {
		var mytime = tm[i].qstamp.toString().replace(/\./, 'd');
		var offclass = '.noteoff-' + mytime;
		var offlist = document.querySelectorAll(offclass);
		for (var j=0; j<offlist.length; j++) {
			if (!offlist[j].getAttribute('class').match(/\bon\b/)) {
				// Can't use .className on SVG elements
				// Don't turn of notes which are already off.
				continue;
			}
			var classinfo = offlist[j].getAttribute('class');
			classinfo = classinfo.replace(/ ?\bon\b/, '');
			offlist[j].setAttribute('class', classinfo);
			offlist[j].style.color  = 'black';
			offlist[j].style.fill   = 'black';
			offlist[j].style.stroke = 'black';
			if (offlist[j].style.animation) {
				offlist[j].style['animation']         = '';
				offlist[j].style['-webkit-animation'] = '';
				offlist[j].style['-moz-animation']    = '';
				offlist[j].style['-ms-animation']     = '';
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
		console.log('Error: no timemap');
	}
	for (var i=starti; i<=endi; i++) {
		var mytime = tm[i].qstamp.toString().replace(/\./, 'd');
		var onclass = '.noteon-' + mytime;
		var onlist = document.querySelectorAll(onclass);
		for (var j=0; j<onlist.length; j++) {
			if (onlist[j].classList.contains('on')) {
				// only turn on once
				continue;
			}
			// can't use .className with SVG elements
			var classinfo = onlist[j].getAttribute('class');
			onlist[j].setAttribute('class', classinfo + ' on');
			onlist[j].style.color  = 'red';
			onlist[j].style.fill   = 'red';
			onlist[j].style.stroke = 'red';
			if (onlist[j].classList.contains('trill')) {
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
	var offq = element.getAttribute('class').match(/noteoff-([\dd]+)/)[1];
	offq = offq.replace(/d/, '.');
	var offtime = this.getTimeFromQI(starti, offq);
	var duration = offtime - ontime + 0.0001;
	var count = parseInt(duration / 0.1);
	if (count < 1) {
		return;
	}
	element.style['animation']         = 'trill .1s ' + count;
	element.style['-webkit-animation'] = 'trill .1s ' + count;
	element.style['-moz-animation']    = 'trill .1s ' + count;
	element.style['-ms-animation']     = 'trill .1s ' + count;
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

	// console.log('musicbox',$('#musicbox').offset().top,
	// 		'st', $('#musicbox').scrollTop(),
	// 		'tr', $(zment).offset().top);

	var sselect = this.getScoreSelector();
	if (zment && (this.states.lastscroll !== zment)) {
		try {
			var scrolltop = $(zment).offset().top + $(sselect).scrollTop() 
				- $(sselect).offset().top;
			$(sselect).animate({ 
					scrollTop: scrolltop},
					this.getScrollAnimationTime(), "swing"
				);
		} catch (error) {
			// jQuery not available, do fallback with no animation
			if (this.debug) {
				console.log("No jQuery found");
			}
			zment.scrollIntoViewIfNeeded(true);
			zment.scrollIntoView({behavior:'smooth'});
		}
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
				// zment.scrollIntoView({behavior:'smooth'});
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

	var endtime = this.states.timemap[this.states.timemap.length-1].tstamp;
	if (endtime < nowtime) {
		console.log("Stopping audio playback");
		var iface = this.getActiveMediaElement();
		if (iface) {
			iface.pause();
		}
	}
}



//////////////////////////////
//
// addNoteControls -- Add onclick callback so that when clicking on a note,
//    the audio will start playing from that point in the score.  Change this
//    to an event delegation later so not so many callbacks are added.
//

MusicBox.prototype.addNoteControls = function () {
	var images = document.querySelectorAll(this.getScoreSelector() + ' svg');
	var that = this;
	for (var i=0; i<images.length; i++) {
		var notes = images[i].querySelectorAll('g[class^="noteon-"]');
		for (var jj=0; jj<notes.length; jj++) {
			if (!notes[jj].className.baseVal.match(/noteon/)) {
				if (i==0) { console.log(notes[jj]); };
			} else {
				var number = notes[jj].className.baseVal.match(/noteon-([^\s]+)/)[1];
				notes[jj].onclick = function(event) {console.log("EVENT", event); that.playFromEvent(event);}
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
	while (targ.nodeName != 'BODY') {
		if (targ.className === null ||
				typeof targ.className != 'object') {
			break;
		}
		if (targ.getAttribute('class')) {
		   var matches = targ.getAttribute('class').match('noteon-([^\\s]+)');
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
			break;
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
	stamp = 1 * stamp.toString().replace(/d/, '.');
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
	if (!this.score) {
		// using a score that is already on the HTML page
		return;
	}
	var music     = this.score.score;
	var maxwidth  = this.getMaxSystemWidth();
	var maxheight = this.getMaxSystemHeight();

	var title = document.querySelector(this.getWorkTitleSelector());
	if (title) {
		title.innerHTML = this.getWorkTitle();
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

	var style = this.getScoreStyle();
	var width;
	var height;

	if (style != 'full') {
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
	// setActiveTimemap has to occur before this function is called.
		// this.setActiveTimemap();

		var element = document.querySelector(this.getRecordingTitleSelector());
		var rtitle = this.getRecordingTitle();
		if (element && rtitle) {
			var output = '';
			var rurl = this.getRecordingTitleUrl();
			if (rurl) {
				output += '<a target="_new" href="';
				output += rurl;
				output += '">';
			}
			output += rtitle;
			if (rurl) {
				output += '</a>';
			}
			element.innerHTML = output;
		}
	}

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
	var style = this.getScoreStyle();
	content += '<table class="music">';
	for (var i=0; i<Music[index].length; i++) {
		sysid   = Music[index][i].id;
		if (!sysid) {
			sysid   = Music[index][i].base;
		}
		if (!sysid) {
			sysid   = Music[index][i].sysid;
		}
		width   = Music[index][i].width;
		height  = Music[index][i].height;
		content += '<tr>'
		content += '<td style="width:'
		content += Maxwidth + ';'
		if (style != 'full') {
			content += ' height:' + Maxheight;
		}
		content += '">';
		content += this.getSvgImage(sysid);
		content +=  '</td></tr>';
	}
	var target = document.getElementById(mvmtid);
	target.innerHTML = content;
}



//////////////////////////////
//
// MusicBox.prototype.getSvgElementList --
//

MusicBox.prototype.getSvgElementList = function () {
	var svgs;
	if (!this.score) {
		this.score = [];
	}
	var svgs = this.score.svg;
	var output = [];
	for (var p in svgs) {
		if (!svgs.hasOwnProperty(p)) {
			continue;
		}
		output.push(svgs[p]);
	}
	return output;
}



//////////////////////////////
//
// MusicBox.prototype.getQstamps -- Return all of the noteon-* and noteoff-*
//    elements in the score.
//

MusicBox.prototype.getQstamps = function (selector) {
	var svgs;
	if (selector) {
		svgs = [];
		svgs.push(document.querySelector(selector + " svg"));
	} else {
		svgs = this.getSvgElementList();
	}
	var qstamps = {};
	var i, j, k;
	var tag;
	var result;
	var reg = new RegExp(/noteo[nf]+-([d\d]+)/gi);
	for (i=0; i<svgs.length; i++) {
		var onselector  = 'g[class^="noteon-"]';
		var offselector = 'g[class^="noteoff-"]';
		var onlist = svgs[i].querySelectorAll(onselector);
		var offlist = svgs[i].querySelectorAll(offselector);
		for (j=0; j<onlist.length; j++) {
			while ((result = reg.exec(onlist[j].className.baseVal)) !== null) {
				tag = result[1].replace('d', '.');
				qstamps[tag] = '1';
			}
		}
		for (j=0; j<offlist.length; j++) {
			while ((result = reg.exec(onlist[j].className.baseVal)) !== null) {
				tag = result[1].replace('d', '.');
				qstamps[tag] = '1';
			}
		}
	}

	var output = [];
	for (var p in qstamps) {
		if (!qstamps.hasOwnProperty(p)) {
			continue;
		}
		var item = p.replace(/noteo[nf]+-/, '');
		output.push(item);
	}

	return output;
}



///////////////////////////////
//
// MusicBox.prototype.activateTimemap -- Takes a stored timemap 
//     from the MusicBox.timemaps array and interpolates it 
//     with all unspecified times from the score.  Not that the
//     score has to be placed on the page before this function
//     is called, since it needs to read qstamps from the score.
//

MusicBox.prototype.activateTimemap = function (index, selector) {
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
		this.setAudioFile(this.timemaps[index].audio, this.timemaps[index].type);
	} else {
		this.setAudioFile();
	}

	var basemap = this.timemaps[index].timemap;
	var qstamps = this.getQstamps(selector);
	qstamps = qstamps.sort(function(a,b){return a-b});

	var nts = [];
	var curi = 0;
	var i, j;
	var nexti;
	var newstamp;
	var pretarget;
	var target;
	var interp;

	// check if the inputs are correct:
	//console.log('QSTAMPS', qstamps);
	//console.log('TIMEMAP', basemap);
	for (i=0; i<qstamps.length; i++) {
		if (curi >= basemap.length) {
			console.log("Error: timemap is not the correct size");
			console.log("Check to see if beat durations are correct");
		}
		if (qstamps[i] == basemap[curi].qstamp) {
			nts.push(basemap[curi]);
			curi++;
			continue;
		}
		if (qstamps[i] > basemap[curi].qstamp) {
			curi++;
			i--;
			continue;
		}
		// need to interpolate value
		if (curi == 0) {
			// but can't interpolate if nothing at start (or end)
			console.log('Error: no starting event time');
		}
		// find next extant timestamp
		target = basemap[curi];
		pretarget = nts[nts.length-1];
		interp = this.getInterpolation(qstamps[i], pretarget, target);

		// Check individual interpolation assignments:
		//console.log('PRETARGET', pretarget);
		//console.log('QSTAMP', qstamps[i]);
		//console.log('TARGET', target);
		//console.log('INTERPOLATION', qstamps[i], interp);
		//console.log('');

		newstamp = {};
		newstamp.tstamp = interp;
		newstamp.qstamp = qstamps[i];
		// Add measure and moffset keys here as well.
		nts.push(newstamp);
	}

	// check if the output is correct:
	this.states.timemap = nts;
	this.states.tmindex = index;
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
			tag = result[1].replace('d', '.');
			times[tag] = '1';
		}
	}
	var keys = Object.keys(times);
	return keys.sort(function(a,b){return a-b});
}



