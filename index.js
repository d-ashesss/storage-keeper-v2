(function(window, $) {
	const RECENT_DIRS_LIST = "recent-dirs";
	const PINNED_DIRS_LIST = "pinned-dirs";

	var _ = require("underscore");

	var app = require("./app/app")(window);
	var list = require("./app/list");

	var recent_dirs_list;
	var $recent_dirs_list;
	var pinned_dirs_list;
	var $pinned_dirs_list;

	$(function() {
		app.initWindow();
		init_lists();
		init_dir_selection();

		show_dirs();
	});

	function init_lists() {
		recent_dirs_list = list.get_from_storage(localStorage, RECENT_DIRS_LIST, {
			addToHead: true,
			maxSize: 15,
			unique: true
		});
		$recent_dirs_list = $("#recent_dirs").find(".list");

		pinned_dirs_list = list.get_from_storage(localStorage, PINNED_DIRS_LIST);
		$pinned_dirs_list = $("#pinned_dirs").find(".list");

		$recent_dirs_list.on("click", ".pin", function() {
			var dir = $(this).parents(".row").data("dir");
			recent_dirs_list.move(dir, pinned_dirs_list);
			show_dirs();
		});
		$recent_dirs_list.on("click", ".remove", function() {
			var dir = $(this).parents(".row").data("dir");
			recent_dirs_list.remove(dir);
			show_dirs();
		});
		$pinned_dirs_list.on("click", ".remove", function() {
			var dir = $(this).parents(".row").data("dir");
			pinned_dirs_list.move(dir, recent_dirs_list);
			show_dirs();
		});

		$recent_dirs_list.add($pinned_dirs_list)
			.on("click", ".action-link", function() {
				open_dir($(this).parents(".row").data("dir"));
			});
	}

	function init_dir_selection() {
		$("#select_dir_btn").click(function() {
			$("#selected_dir").click();
		});
		$("#selected_dir").change(function() {
			if (this.value.length > 0) {
				open_dir(this.value);
			}
		});
	}

	function show_dirs() {
		$recent_dirs_list.empty()
			.append(render_list(recent_dirs_list, ["pin", "remove"]));
		$pinned_dirs_list.empty()
			.append(render_list(pinned_dirs_list, ["remove"]));
	}

	/**
	 * @param {List} list
	 * @param {Array.<string>} icons
	 * @returns {Array.<jQuery>}
	 */
	function render_list(list, icons) {
		var dirs = list.toArray();
		return _.map(dirs, function(dir) {
			var $row = $("<div>", { class: "row" })
				.data("dir", dir);
			$("<span>", { class: "action-link recent-dir" })
				.text(dir)
				.appendTo($row);
			_.each(icons, function(icon) {
				$("<span>", { class: "action-icon" }).addClass(icon).prependTo($row);
			});
			return $row;
		});
	}

	function open_dir(dir) {
		if (!pinned_dirs_list.contains(dir)) {
			recent_dirs_list.add(dir);
		}
		app.chdir(dir);
		window.location = "gallery.html";
	}
})(window, window.jQuery);