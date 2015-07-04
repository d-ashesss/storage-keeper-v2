(function(window, $) {
	const GALLERY_HISTORY = "gallery-history";
	const GALLERY_SELECT_DEST = "gallery-select-dest";
	const GALLERY_BOOKMARKS = "gallery-bookmarks";
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
	/** @type {List} */
	var bookmarks;

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

		$("#keymap").on("click", ".node", function(/** @type {jQuery.Event} */ event) {
			if ($(this).is(".foldable")) {
				$(this).next().toggle();
				return;
			}
			var dir_index = $(this).data("dir_index");
			if ($(event.target).is(".key")) {
				if (typeof dir_index === "string") {
					selection.tagImage(images_list.current(), dir_index);
				}
				return;
			}
			var dir_level = $(this).data("dir_level");
			if (event.ctrlKey) {
				selection.toggleDir(dir_index);
			} else if (event.shiftKey) {
				selection.selectLevel(dir_level);
			} else {
				selection.selectOneDir(dir_index);
			}
		});

		$("#select_dir_btn").click(function() {
			$("#selected_dir").click();
		});
		$("#selected_dir").change(function() {
			if (this.value.length > 0) {
				selection.setSelectDest(this.value);
				localStorage[GALLERY_SELECT_DEST + "-" + current_dir.getPath()] = this.value;
			}
		});

		$("#bookmarks_panel").on("click", ".bookmark", function() {
			var image = $(this).data("image");
			bookmarks.setCurrent(image);
			show(SHOW.BOOKMARK);
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
					selection.tagImage(images_list.current(), "delete");

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
					selection.toggleImage(images_list.current());

				} else if (event.keyCode == app.keys.DELETE) {
					selection.untagImage(images_list.current());
					selection.deselectImage(images_list.current());

				} else if (event.keyCode == app.keys.F1) {
					current_dir.setSortMode(Directory.SORT_MODE.NORMAL);
					$("#sorting_indicator").text("N");
					loadImages();

				} else if (event.keyCode == app.keys.F2) {
					current_dir.setSortMode(Directory.SORT_MODE.RANDOM);
					$("#sorting_indicator").text("R");
					loadImages();

				} else if (event.keyCode == app.keys.F3) {
					current_dir.setSortMode(Directory.SORT_MODE.CREATED);
					$("#sorting_indicator").text("C");
					loadImages();

				} else if (event.keyCode == app.keys.F4) {
					current_dir.setSortMode(Directory.SORT_MODE.SIZE);
					$("#sorting_indicator").text("S");
					loadImages();

				} else if (event.keyCode == app.keys.F5) {
					loadImages();

				} else if (event.keyCode == app.keys.QUOTE) {
					var current_image = images_list.current();
					if (!bookmarks.contains(current_image)) {
						bookmarks.add(current_image);
					} else {
						bookmarks.remove(current_image);
					}
					drawBookmarks();
					return;

				} else if (event.keyCode == app.keys.SQ_BRACKET_OPEN) {
					show(SHOW.BOOKMARK_PREV);
					return;

				} else if (event.keyCode == app.keys.SQ_BRACKET_CLOSE) {
					show(SHOW.BOOKMARK_NEXT);
					return;

				} else if (key_index >= 0) {
					var tag_name = $(".tag_index" + key_index).data("dir_index");
					if (typeof tag_name === "string") {
						selection.tagImage(images_list.current(), tag_name);
					}

				} else {
					console.info(event.keyCode, String.fromCharCode(event.keyCode));
					return;
				}
				event.preventDefault();
			})
			.resize(resize);

		current_dir = new Directory({
			path: process.cwd()
		});
		selection = new Selection(current_dir);
		selection.on("change", drawKeymap);
		selection.on("dir-select", showImages);
		selection.setSelectDest(localStorage[GALLERY_SELECT_DEST + "-" + current_dir.getPath()]);

		image = new Image($("#current_image"));
		image.on("load", onObjectLoad);
		image.setBasePath(current_dir.path);

		frame = new Frame($("#current_frame"));
		frame.on("load", onObjectLoad);
		frame.setBasePath(current_dir.path);

		video = new Video($("#current_video"));
		video.on("load", onObjectLoad);
		video.setBasePath(current_dir.path);

		$(window).triggerHandler("resize");

		bookmarks = List.from_storage(localStorage, GALLERY_BOOKMARKS + "-" + current_dir.getPath());

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
				.append( $("<span>", { id: "current_file_name" }).text(this.getFile()) )
				.append( $("<span>").text( images_list.getPosition(true) + "/" + images_list.length() ) )
				.append( $("<span>").text(size) );
			if (selection.imageSelected(images_list.current())) {
				$("#current_file_name").addClass("selected");
			} else {
				$("#current_file_name").removeClass("selected");
			}
		}
	}

	function loadImages() {
		var $loading = $("#loading_indicator").addClass("active");
		reset();
		current_dir.read(function() {
			drawKeymap();
			showImages();
			$loading.removeClass("active");
		});
	}

	function showImages() {
		reset();
		var images = current_dir.getImages(selection.getSelectedDirs());
		images_list.setData(images);

		_.each(bookmarks.toArray(), function(bookmark) {
			if (!images_list.contains(bookmark)) {
				bookmarks.remove(bookmark);
			}
		});

		var history_name = GALLERY_HISTORY + "-" + current_dir.getPath();
		view_history = List.from_storage(localStorage, history_name, {
			maxSize: Math.round(images_list.length() / 2),
			unique: true
		});

		show();
	}

	function reset() {
		image.hide();
		frame.hide();
		video.hide();

		$("#current_file_panel").text("No image loaded");

		images_list = new List();

		selection.resetImages();
	}

	function drawKeymap() {
		var $keymap = $("#keymap").empty();
		var $selection = $("#selection");
		var dir_list = selection.getDirList(images_list.current());
		if (dir_list.length > 40) {
			$keymap.addClass("compact");
			$("#selection_panel").append($selection).show();
		}
		if (dir_list.length > 80) {
			$keymap.addClass("tiniest");
		} else if (dir_list.length > 60) {
			$keymap.addClass("tiny");
		}
		_.each(dir_list, function(dir) {
			if (this.$parent.is(".foldable_body") && this.$parent.data("level") >= dir.level) {
				this.$parent = this.$parent.parent();
			}
			var $node = $("<div>", { class: "node" })
				.text(dir.name)
				.data("dir_index", dir.index)
				.data("dir_level", dir.level)
				.appendTo(this.$parent);
			if (dir.foldable) {
				$node.addClass("foldable");
				this.$parent = $("<div>")
					.addClass("foldable_body")
					.data("level", dir.level)
					.hide()
					.appendTo(this.$parent);
			}
			$node.addClass("level" + dir.level);
			if (dir.level === 1) {
				var $key = $("<span>", { class: "key" })
					.data("dir_index", dir.index)
					.prependTo($node);
				if (Selection.TAG_KEYS.length > this.key_index && !dir.foldable) {
					$key.text(Selection.TAG_KEYS[this.key_index])
						.addClass("tag_index" + this.key_index);
					this.key_index++;
				}
			}
			if (dir.selected) {
				$node.addClass("selected");
				$node.parents(".foldable_body").show();
			}
			if (dir.tagged > 0) {
				$("<span>")
					.text(" (" + dir.tagged + ")")
					.appendTo($node);
			}
			if (dir.current) {
				$node.addClass("current");
			}
		}, {
			$parent: $keymap,
			current_image: images_list.current(),
			key_index: 0
		});
		if (selection.imageSelected(images_list.current())) {
			$("#current_file_name").addClass("selected");
		} else {
			$("#current_file_name").removeClass("selected");
		}
		$selection.find(".destination").text(selection.getSelectDest());
		$selection.find(".selected").text(selection.imagesSelected());
		$selection.find(".tagged").text(selection.imagesTagged());
	}

	function drawBookmarks() {
		var $bookmarks = $("#bookmarks_panel").empty();
		if (bookmarks.length() > 0) {
			$bookmarks.show();
		} else {
			$bookmarks.hide();
		}
		_.each(bookmarks.toArray().reverse(), function(bookmark) {
			var $bm = $("<div>").appendTo($bookmarks);
			$("<span>", {class: "bookmark action-link"})
				.text(bookmark)
				.data("image", bookmark)
				.appendTo($bm);
			if (bookmark === images_list.current()) {
				$bm.addClass("current");
			}
			var index = images_list.indexOf(bookmark);
			if (index >= 0) {
				$("<span>", {class: "index"})
					.text(index + 1)
					.appendTo($bm);
			}
		});
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
		HISTORY_NEXT: 7,
		BOOKMARK: 8,
		BOOKMARK_PREV: 9,
		BOOKMARK_NEXT: 10
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
			images_list.setCurrent(current_image);
			break;

		case SHOW.HISTORY_NEXT:
			current_image = view_history.next();
			images_list.setCurrent(current_image);
			break;

		case SHOW.BOOKMARK:
			current_image = bookmarks.current();
			if (typeof current_image === "undefined") {
				return;
			}
			images_list.setCurrent(current_image);
			break;

		case SHOW.BOOKMARK_PREV:
			current_image = bookmarks.prev();
			images_list.setCurrent(current_image);
			break;

		case SHOW.BOOKMARK_NEXT:
			current_image = bookmarks.next();
			if (typeof current_image === "undefined") {
				return;
			}
			images_list.setCurrent(current_image);
			break;

		default:
		}

		if (direction != SHOW.HISTORY_PREV && direction != SHOW.HISTORY_NEXT) {
			view_history.add(current_image);
		}
		if (bookmarks.contains(current_image)) {
			bookmarks.setCurrent(current_image);
		} else {
			bookmarks.setPosition(bookmarks.length());
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
			next_image = current_dir.getUri() + next_image;
			image_preload.attr("src", next_image);
		}
		drawKeymap();
		drawBookmarks();
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
					this[image] = current_dir.getPath() + DEFAULT_TAG + "/";
				}
			}, images);
		}
		current_dir.save(images);
	}
})(window, window.jQuery);