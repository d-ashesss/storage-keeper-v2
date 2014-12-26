var OPEN_DIR = "open-dir";
var HISTORY_NAME = "gallery-history";

var node_path = require("path");

var list = require("./app/list");
var gallery = require("./app/gallery");
var _ = require("underscore");

var Image = require("./app/gallery/image");
var Frame = require("./app/gallery/frame");
var Video = require("./app/gallery/video");

var current_dir;

/** @type {List} */
var images_list;
/** @type {List} */
var history;

//          Q   A   W   S   E   D   R   F   Z   X   C   V   1   2   3   4
var keys = [81, 65, 87, 83, 69, 68, 82, 70, 90, 88, 67, 86, 49, 50, 51, 52];

var tags_list = [];
var sorted_images = [];
var tag_counts = [];

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
	$("#new_tag_form").submit(function(event) {
		event.preventDefault();
		var new_tag = this["tag_name"].value.replace(/[^0-9a-z_\-]/ig, '');
		if (new_tag.length > 0 && tags_list.indexOf(new_tag) < 0) {
			tags_list.push(new_tag);
			drawKeymap();
		}
		this["tag_name"].value = "";
		this["tag_name"].blur();
	});

	current_dir = sessionStorage.getItem(OPEN_DIR);
	if (!current_dir) {
		window.location = "index.html";
		return;
	}
	$("#new_tag_panel").hide();

	$(window)
		.bind("mousewheel", function(/** @type {jQuery.Event} */ event) {
			if (event.originalEvent.wheelDelta < 0) {
				show(SHOW.NEXT);
			} else {
				show(SHOW.PREV);
			}
		})
		.keydown(function(/** @type {jQuery.Event} */ event) {
			if ($(event.target).is("input")) {
				return;
			}
			var current_image_index = images_list.getPosition();
			var current_tag_index = sorted_images[current_image_index];
			var key_index = keys.indexOf(event.keyCode);
			if (event.shiftKey && event.keyCode == 32 /* space */) {
				show(SHOW.PREV);
			} else if (event.shiftKey && event.keyCode == 46 /* delete */) {
				if (typeof current_tag_index != "undefined") {
					tag_counts[current_tag_index]--;
				}
				if (tags_list.indexOf("delete") < 0) {
					tags_list.push("delete");
				}
				current_tag_index = sorted_images[current_image_index] = tags_list.indexOf("delete");
				tag_counts[current_tag_index]++;
				drawKeymap();
			} else if (event.shiftKey && event.keyCode == 187 /* equal */) {
				$("#new_tag_form").find("input").focus();
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
				loadImages();
			} else if (event.keyCode == 122 /* F11 */) {
				var gui = require("nw.gui");
				var wnd = gui.Window.get();
				wnd.toggleFullscreen()
			} else if (event.keyCode == 107 /* numpad plus */) {
			} else if (event.keyCode == 192 /* tilda */) {
				$(".overlay").fadeToggle("fast");
			} else if (event.keyCode == 45 /* insert */) {
				if (typeof current_tag_index != "undefined") {
					tag_counts[current_tag_index]--;
				}
				if (typeof current_tag_index == "undefined" || current_tag_index == (tags_list.length - 1)) {
					current_tag_index = sorted_images[current_image_index] = 0;
				} else {
					current_tag_index = ++sorted_images[current_image_index];
				}
				tag_counts[current_tag_index]++;
				drawKeymap();
			} else if (event.keyCode == 46 /* delete */) {
				tag_counts[current_tag_index]--;
				delete sorted_images[current_image_index];
				drawKeymap();
			} else if (key_index >= 0 && typeof tags_list[key_index] != "undefined") {
				if (current_tag_index != key_index) {
					if (typeof current_tag_index != "undefined") {
						tag_counts[current_tag_index]--;
					}
					tag_counts[key_index]++;
					sorted_images[current_image_index] = key_index;
				} else {
					tag_counts[key_index]--;
					delete sorted_images[current_image_index];
				}
				drawKeymap();
			} else {
				console.info(event.keyCode, String.fromCharCode(event.keyCode));
				return;
			}
			event.preventDefault();
		})
		.resize(resize).triggerHandler("resize");

	loadImages();
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

function loadImages() {
	reset();
	gallery.getImages(current_dir, function(images) {
		images_list.setData(images);

		var history_name = HISTORY_NAME + "-" + current_dir;
		history = list.get_from_storage(localStorage, history_name, {
			maxSize: Math.round(images_list.length() / 2),
			unique: true
		});

		loadTags();
		show();
	});
}

function reset() {
	image.setFile("");
	frame.setFile("");
	video.setFile("");

	$("#current_file_name").text("No image loaded");
	$("#current_file_number").text("");
	$("#current_file_size").text("");

	images_list = list.List();
	tags_list = [];
	sorted_images = [];
	tag_counts = _.map(keys, function() {return 0});
}

function loadTags() {
	gallery.getTags(current_dir, function(tags) {
		tags_list = tags;
		drawKeymap();
	});
}

function drawKeymap() {
	var $keymap = $('#keymap').empty();

	var selected_count = 0;
	_.each(keys, function(key_code, key_index) {
		if (typeof tags_list[key_index] == "undefined") {
			return;
		}
		var count = "";
		if (tag_counts[key_index] > 0) {
			selected_count += tag_counts[key_index];
			count = " (" + tag_counts[key_index] + ")";
		}
		var text = /*String.fromCharCode(key_code) + ": " + */tags_list[key_index] + count;
		var $tag = $("<div>", { class: "tag" }).text(text).appendTo($keymap);
		$("<span>", { class: "key" }).text(String.fromCharCode(key_code)).prependTo($tag);

		var image_index = images_list.getPosition();
		if (sorted_images[image_index] == key_index) {
			$tag.addClass("current");
		}
	});

	$("<div>").html("&nbsp;").appendTo($keymap);
	$("<div>")
		.text("selected: " + selected_count)
		.appendTo($keymap);
	$("<div>")
		.text("skipped: " + (sorted_images.length - selected_count))
		.appendTo($keymap);
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
	drawKeymap();
}
