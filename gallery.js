var OPEN_DIR = "open-dir";
var HISTORY_NAME = "gallery-history";

var node_path = require("path");

var list = require("./app/list");
var gallery = require("./app/gallery");

var Image = require("./app/gallery/image");
var Frame = require("./app/gallery/frame");
var Video = require("./app/gallery/video");

/** @type {List} */
var images_list;
/** @type {List} */
var history;

/** @type {Image} */
var image;
var image_preload = $("<img>");
/** @type {Frame} */
var frame;
/** @type {Video} */
var video;

$(function() {
	image = new Image($("#current_image"), {
		onSizeCallback: onObjectSize
	});
	frame = new Frame($("#current_frame"));
	video = new Video($("#current_video"), {
		onSizeCallback: onObjectSize
	});

	var dir = sessionStorage.getItem(OPEN_DIR);
	if (!dir) {
		window.location = "index.html";
		return;
	}

	$(window)
		.bind("mousewheel", function(/** @type {jQuery.Event} */ event) {
			if (event.originalEvent.wheelDelta < 0) {
				show(SHOW.NEXT);
			} else {
				show(SHOW.PREV);
			}
		})
		.keydown(function(/** @type {jQuery.Event} */ event) {
			if (event.shiftKey && event.keyCode == 32 /* space */) {
				show(SHOW.PREV);
			} else if (event.shiftKey && event.keyCode == 46 /* delete */) {
			} else if (event.keyCode == 13 /* enter */) {
			} else if (event.shiftKey || event.ctrlKey || event.altKey) {
				return;
			} else if (event.keyCode == 32 /* space */ || event.keyCode == 34 /* pgdown */) {
				show(SHOW.NEXT);
			} else if (event.keyCode == 8 /* backspace */ || event.keyCode == 33 /* pgup */) {
				show(SHOW.PREV);
			} else if (event.keyCode == 36 /* home */) {
				show(SHOW.FIRST);
			} else if (event.keyCode == 35 /* end */) {
				show(SHOW.LAST);
			} else if (event.keyCode == 111 /* numpad slash */ || event.keyCode == 231 || event.keyCode == 220 /* backslash */) {
				show(SHOW.RANDOM);
			} else if (event.keyCode == 106 /* numpad asterisk */ || event.keyCode == 189 /* minus */) {
				show(SHOW.HISTORY_PREV);
			} else if (event.keyCode == 109 /* numpad minus */ || event.keyCode == 187 /* equal */) {
				show(SHOW.HISTORY_NEXT);
			} else if (event.keyCode == 27 /* esc */) {
				window.location = "index.html";
			} else if (event.keyCode == 116 /* F5 */) {
			} else if (event.keyCode == 122 /* F11 */) {
			} else if (event.keyCode == 107 /* numpad plus */) {
			} else if (event.keyCode == 192 /* tilda */) {
				$(".overlay").fadeToggle("fast");
			} else if (event.keyCode == 45 /* insert */) {
			} else if (event.keyCode == 46 /* delete */) {
			} else {
				console.log(event.keyCode);
				return;
			}
			event.preventDefault();
		})
		.resize(resize).triggerHandler("resize");

	gallery.getImages(dir, function(images) {
		images_list = list.List();
		images_list.setData(images);

		var history_name = HISTORY_NAME + "-" + dir;
		history = list.get_from_storage(localStorage, history_name, {
			maxSize: Math.round(images_list.length() / 2),
			unique: true
		});

		show();
	});
});

function resize() {
	image.setSize(window.innerWidth, window.innerHeight);
	video.setSize(window.innerWidth, window.innerHeight);
	frame.setSize(window.innerWidth, window.innerHeight);
}

function onObjectSize(naturalWidth, naturalHeight, actualWidth, actualHeight) {
	var natural = naturalWidth * naturalHeight;
	var actual = actualWidth * actualHeight;
	var scale = actual / natural * 100;
	$("#current_file_size").text(naturalWidth + '×' + naturalHeight + ' ' + scale.toFixed(0) + '%');
}

/**
 * @enum
 */
var SHOW = {
	CURRENT: 0,
	FIRST: 1,
	LAST: 2,
	PREV: 3,
	NEXT: 4,
	RANDOM: 5,
	HISTORY_PREV: 6,
	HISTORY_NEXT: 7
};

function show(direction) {
	if (images_list.length() == 0) {
		return;
	}

	var current_image = images_list.current();
	switch (direction) {
	case SHOW.FIRST:
		current_image = images_list.first();
		break;

	case SHOW.LAST:
		current_image = images_list.last();
		break;

	case SHOW.PREV:
		current_image = images_list.prev();
		break;

	case SHOW.NEXT:
		current_image = images_list.next();
		break;

	case SHOW.RANDOM:
		while (history.contains(current_image)) {
			current_image = images_list.random();
		}
		break;

	case SHOW.HISTORY_PREV:
		current_image = history.prev();
		break;

	case SHOW.HISTORY_NEXT:
		current_image = history.next();
		break;

	default:
	}

	if (direction != SHOW.HISTORY_PREV && direction != SHOW.HISTORY_NEXT) {
		history.add(current_image);
	}

	if (/\.(webm|mp4)$/i.test(current_image)) {
		video.show(current_image);
		image.hide();
		frame.hide();
	} else if (/\.swf$/i.test(current_image)) {
		frame.show(current_image);
		image.hide();
		video.hide();
	} else {
		image.show(current_image);
		video.hide();
		frame.hide();
	}

	$("#current_file_name").text(node_path.basename(current_image));
	$("#current_file_number").text(images_list.getPosition(true) + "/" + images_list.length());
	$("#current_file_size").text('-');

	var next_image = images_list.getNext();
	if (next_image != null) {
		image_preload.attr("src", next_image);
	}
}
