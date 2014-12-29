(function(window, $) {
	const GALLERY_HISTORY = "gallery-history";

	var path = require("path");

	var app = require("./app/app")(window);
	var gallery = require("./app/gallery");
	var List = require("./app/List");
	var _ = require("underscore");

	var Image = require("./app/gallery/Image");
	var Frame = require("./app/gallery/Frame");
	var Video = require("./app/gallery/Video");

	/** @type {List} */
	var images_list;
	/** @type {List} */
	var view_history;

	var tag_keys = ["Q", "A", "W", "S", "E", "D", "R", "F", "Z", "X", "C", "V"];

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

	app.onError = function(/** @type {Error} */ error) {
		var $error_container = $(".panel.fatal_error");
		if ($error_container.length == 0) {
			$error_container = $("<div>", { class: "panel fatal_error" }).prependTo("#overlay").click(function() {
				$(this).remove();
			});
		}
		$error_container.empty();
		_.each(error["stack"].split(/\n/), function(line) {
			return $("<div>").text(line).appendTo($error_container);
		});
	};

	$(function() {
		app.initWindow();

		image = new Image($("#current_image"), {
			onSizeCallback: onObjectSize
		});
		frame = new Frame($("#current_frame"));
		video = new Video($("#current_video"), {
			onSizeCallback: onObjectSize
		});
		$("#new_tag_form").submit(function(event) {
			event.preventDefault();
			var new_tag = this["tag_name"].value.replace(/[^0-9a-z\-]/ig, '');
			if (new_tag.length > 0 && tags_list.indexOf(new_tag) < 0) {
				tags_list.push(new_tag);
				drawKeymap();
			}
			this["tag_name"].value = "";
			this["tag_name"].blur();
		});

		$("#keymap").on("click", ".tag .key", function() {
			var key_index = $(this).data("key_index");
			var current_image_index = images_list.getPosition();
			var current_tag_index = sorted_images[current_image_index];
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
		});

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
				var key_index = tag_keys.indexOf(String.fromCharCode(event.keyCode));
				if (event.shiftKey && event.keyCode == app.keys.SPACE) {
					show(SHOW.PREV);
				} else if (event.shiftKey && event.keyCode == app.keys.DELETE) {
					if (typeof current_tag_index != "undefined") {
						tag_counts[current_tag_index]--;
					}
					if (tags_list.indexOf("delete") < 0) {
						tags_list.push("delete");
					}
					current_tag_index = sorted_images[current_image_index] = tags_list.indexOf("delete");
					tag_counts[current_tag_index]++;
					drawKeymap();
				} else if (event.shiftKey && event.keyCode == app.keys.EQUAL) {
					$("#new_tag_form").find("input").focus();
				} else if (event.keyCode == app.keys.ENTER) {
					var mode = BUILD.VIEWED;
					if (event.shiftKey) {
						mode = BUILD.TAGGED;
					} else if (event.ctrlKey) {
						mode = BUILD.ALL;
					}
					gallery.save(build(mode));
					loadImages();
				} else if (event.shiftKey || event.ctrlKey || event.altKey) {
					return;
				} else if (event.keyCode == app.keys.SPACE || event.keyCode == app.keys.PGDOWN) {
					show(SHOW.NEXT);
				} else if (event.keyCode == app.keys.BACKSPACE || event.keyCode == app.keys.PGUP) {
					show(SHOW.PREV);
				} else if (event.keyCode == app.keys.HOME) {
					show(SHOW.FIRST);
				} else if (event.keyCode == app.keys.END) {
					show(SHOW.LAST);
				} else if (event.keyCode == app.keys.NUMPAD_SLASH || event.keyCode == app.keys.BACKSLASH) {
					show(SHOW.RANDOM);
				} else if (event.keyCode == app.keys.NUMPAD_ASTERISK || event.keyCode == app.keys.MINUS) {
					show(SHOW.HISTORY_PREV);
				} else if (event.keyCode == app.keys.NUMPAD_MINUS || event.keyCode == app.keys.EQUAL) {
					show(SHOW.HISTORY_NEXT);
				} else if (event.keyCode == app.keys.ESC) {
					window.location = "index.html";
				} else if (event.keyCode == app.keys.NUMPAD_PLUS) {
					$("#new_tag_form").find("input").focus();
				} else if (event.keyCode == app.keys.TILDA) {
					$("#overlay").fadeToggle("fast");
				} else if (event.keyCode == app.keys.INSERT) {
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
				} else if (event.keyCode == app.keys.DELETE) {
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
		gallery.readdir(function(/** @type {Directory} */ dir) {
			images_list.setData(dir.images);

			var history_name = GALLERY_HISTORY + "-" + dir.path;
			view_history = List.from_storage(localStorage, history_name, {
				maxSize: Math.round(images_list.length() / 2),
				unique: true
			});

			tags_list = dir.tags;
			drawKeymap();
			show();
		});
	}

	function reset() {
		image.hide();
		frame.hide();
		video.hide();

		$("#current_file_name").text("No image loaded");
		$("#current_file_number").text("");
		$("#current_file_size").text("");

		images_list = new List();
		tags_list = [];
		sorted_images = [];
		tag_counts = _.map(tag_keys, function() {return 0});
	}

	function drawKeymap() {
		var $keymap = $('#keymap').empty();

		var selected_count = 0;
		_.each(tag_keys, function(key, key_index) {
			if (typeof tags_list[key_index] == "undefined") {
				return;
			}
			var count = "";
			if (tag_counts[key_index] > 0) {
				selected_count += tag_counts[key_index];
				count = " (" + tag_counts[key_index] + ")";
			}
			var text = tags_list[key_index] + count;
			var $tag = $("<div>", { class: "tag" })
				.text(text)
				.appendTo($keymap);
			$("<span>", { class: "key" })
				.text(key)
				.data("key_index", key_index)
				.prependTo($tag);

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
			while (view_history.contains(current_image)) {
				current_image = images_list.random();
			}
			break;

		case SHOW.HISTORY_PREV:
			current_image = view_history.prev();
			break;

		case SHOW.HISTORY_NEXT:
			current_image = view_history.next();
			break;

		default:
		}

		if (direction != SHOW.HISTORY_PREV && direction != SHOW.HISTORY_NEXT) {
			view_history.add(current_image);
		}

		var image_url = "file:///" + process.cwd().replace(/\\/g, "/") + "/" + current_image;
		if (/\.(webm|mp4)$/i.test(image_url)) {
			video.show(image_url);
			image.hide();
			frame.hide();
		} else if (/\.swf$/i.test(image_url)) {
			frame.show(image_url);
			image.hide();
			video.hide();
			$("#current_file_size").text('-');
		} else {
			image.show(image_url, direction == SHOW.RANDOM);
			video.hide();
			frame.hide();
		}

		$("#current_file_name").text(current_image);
		$("#current_file_number").text(images_list.getPosition(true) + "/" + images_list.length());

		var next_image = images_list.getNext();
		if (next_image != null && !/\.(webm|mp4|swf)$/i.test(next_image)) {
			next_image = "file:///" + process.cwd().replace(/\\/g, "/") + "/" + next_image;
			image_preload.attr("src", next_image);
		}
		drawKeymap();
	}

	/**
	 * @enum
	 */
	var BUILD = {
		ALL: 0,
		TAGGED: 1,
		VIEWED: 2
	};

	function build(mode) {
		var count = sorted_images.length;
		if (mode == BUILD.ALL) {
			count = images_list.length();
		}

		var result = {};
		for (var i = 0; i < count; i++) {
			var image = images_list.at(i);
			if (typeof sorted_images[i] != "undefined") {
				result[image] = tags_list[sorted_images[i]];
			} else if (mode == BUILD.VIEWED || mode == BUILD.ALL) {
				result[image] = "_";
			}
		}
		return result;
	}
})(window, window.jQuery);