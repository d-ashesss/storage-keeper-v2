(function(window, $) {
	const GALLERY_HISTORY = "gallery-history";
	const DEFAULT_TAG = "_";

	var path = require("path");
	var _ = require("underscore");

	var app = require("./app/app")(window);
	var List = require("./app/List");
	var Directory = require("./app/gallery/Directory");
	var Selection = require("./app/gallery/Selection");
	var Image = require("./app/gallery/Image");
	var Frame = require("./app/gallery/Frame");
	var Video = require("./app/gallery/Video");

	/** @type {Directory} */
	var current_dir;
	/** @type {Selection} */
	var selection;

	/** @type {List} */
	var images_list;
	/** @type {List} */
	var view_history;

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

		$("#new_tag_form").submit(function(/** @type {jQuery.Event} */ event) {
			event.preventDefault();
			selection.addTag(this["tag_name"].value);
			this["tag_name"].value = "";
			this["tag_name"].blur();
		});

		$("#keymap").on("click", ".tag .key", function() {
			var tag_index = $(this).data("tag_index");
			selection.toggle(images_list.current(), tag_index);
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
				var key_index = Selection.getKeyIndex(event.keyCode);

				if (event.shiftKey && event.keyCode == app.keys.SPACE) {
					show(SHOW.PREV);

				} else if (event.shiftKey && event.keyCode == app.keys.DELETE) {
					selection.addTag("delete");
					selection.select(images_list.current(), "delete");

				} else if (event.shiftKey && event.keyCode == app.keys.EQUAL) {
					$("#new_tag_form").find("input").focus();

				} else if (event.keyCode == app.keys.ENTER) {
					var mode = BUILD.TAGGED;
					if (event.shiftKey) {
						mode = BUILD.VIEWED;
					} else if (event.ctrlKey) {
						mode = BUILD.ALL;
					}
					build(mode);
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
					selection.select(images_list.current(), 0);

				} else if (event.keyCode == app.keys.DELETE) {
					selection.deselect(images_list.current());

				} else if (key_index >= 0) {
					selection.toggle(images_list.current(), key_index);

				} else {
					console.info(event.keyCode, String.fromCharCode(event.keyCode));
					return;
				}
				event.preventDefault();
			})
			.resize(resize);

		current_dir = new Directory(process.cwd());

		image = new Image($("#current_image"));
		image.on("load", onObjectLoad);
		image.setBasePath(current_dir.path);

		frame = new Frame($("#current_frame"));
		frame.on("load", onObjectLoad);
		frame.setBasePath(current_dir.path);

		video = new Video($("#current_video"));
		video.on("load", onObjectLoad);
		video.setBasePath(current_dir.path);

		selection = new Selection();
		selection.on("change", drawKeymap);

		$(window).triggerHandler("resize");

		loadImages();
	});

	function resize() {
		image.setSize(window.innerWidth, window.innerHeight);
		video.setSize(window.innerWidth, window.innerHeight);
		frame.setSize(window.innerWidth, window.innerHeight);
	}

	/**
	 * @param object
	 * @this {Media}
	 */
	function onObjectLoad(object) {
		if (this.isVisible()) {
			var size = object.width + '×' + object.height;
			if (typeof object.scale != "undefined") {
				size += ':' + object.scale + '%';
			}

			$("#current_file_panel").empty()
				.append( $("<span>").text(this.getFile()) )
				.append( $("<span>").text( images_list.getPosition(true) + "/" + images_list.length() ) )
				.append( $("<span>").text(size) );
		}
	}

	function loadImages() {
		reset();
		current_dir.read(function(/** @type {Directory} */ dir) {
			images_list.setData(dir.images);

			var history_name = GALLERY_HISTORY + "-" + dir.path;
			view_history = List.from_storage(localStorage, history_name, {
				maxSize: Math.round(images_list.length() / 2),
				unique: true
			});

			selection.setTags(dir.tags);
			show();
		});
	}

	function reset() {
		image.hide();
		frame.hide();
		video.hide();

		$("#current_file_panel").text("No image loaded");

		images_list = new List();
	}

	function drawKeymap() {
		var $keymap = $('#keymap').empty();
		var tags = selection.dumpTags();
		_.each(tags, function(tag, tag_index) {
			var text = tag.name;
			if (tag.images.length > 0) {
				text += " (" + tag.images.length + ")";
			}
			var $tag = $("<div>", { class: "tag" })
				.text(text)
				.appendTo(this.$keymap);
			$("<span>", { class: "key" })
				.text(tag.key)
				.data("tag_index", tag_index)
				.prependTo($tag);

			if (tag.images.indexOf(this.current_image) >= 0) {
				$tag.addClass("current");
			}
		}, {
			$keymap: $keymap,
			current_image: images_list.current()
		});

		var selected_count = _.reduce(tags, function(count, tag) {
			return count + tag.images.length;
		}, 0);
		$("<div>").html("&nbsp;").appendTo($keymap);
		$("<div>")
			.text("selected: " + selected_count)
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

	/**
	 * @param {SHOW=} direction
	 */
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

		if (/\.(webm|mp4)$/i.test(current_image)) {
			video.show(current_image);
			image.hide();
			frame.hide();
		} else if (/\.swf$/i.test(current_image)) {
			frame.show(current_image);
			image.hide();
			video.hide();
		} else {
			image.show(current_image, direction == SHOW.RANDOM);
			video.hide();
			frame.hide();
		}

		var next_image = images_list.getNext();
		if (next_image != null && !/\.(webm|mp4|swf)$/i.test(next_image)) {
			next_image = "file:///" + current_dir.path + "/" + next_image;
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

	/**
	 * @param {BUILD} mode
	 */
	function build(mode) {
		var images = selection.dumpImages();
		if (mode != BUILD.TAGGED) {
			var count = images_list.getPosition(true);
			if (mode == BUILD.ALL) {
				count = images_list.length();
			}
			_.each(images_list.toArray().slice(0, count), function(image) {
				if (!this[image]) {
					this[image] = DEFAULT_TAG;
				}
			}, images);
		}
		current_dir.save(images);
	}
})(window, window.jQuery);