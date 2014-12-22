var WINDOW_MAXIMIZE = "maximize";
var RECENT_DIRS_LIST = "recentDirs-dev";
var PINNED_DIRS_LIST = "pinnedDirs-dev";

var _ = require("underscore");

var list = require("./app/list");

var recent_dirs_list;
var pinned_dirs_list;
var $recent_dirs_list, $pinned_dirs_list;

$(function() {
	recent_dirs_list = list.get_from_storage(localStorage, RECENT_DIRS_LIST, { addToHead: true, maxSize: 15 });
	$recent_dirs_list = $("#recent_dirs").find(".list").hide();

	pinned_dirs_list = list.get_from_storage(localStorage, PINNED_DIRS_LIST);
	$pinned_dirs_list = $("#pinned_dirs").find(".list").hide();

	init_window();
	load_history();

	$recent_dirs_list.on("click", ".pin", function() {
		var path = $(this).siblings(".recent-dir").text();
		recent_dirs_list.move(path, pinned_dirs_list);
		load_history();
	});
	$recent_dirs_list.on("click", ".remove", function() {
		var path = $(this).siblings(".recent-dir").text();
		recent_dirs_list.remove(path);
		load_history();
	});
	$pinned_dirs_list.on("click", ".remove", function() {
		var path = $(this).siblings(".recent-dir").text();
		pinned_dirs_list.move(path, recent_dirs_list);
		load_history();
	});

	$recent_dirs_list.on("click", ".action-link", function() {
		var path = $(this).text();
		if (!pinned_dirs_list.contains(path)) {
			recent_dirs_list.move(path, recent_dirs_list);
			load_history();
		}
		// TODO open dir
	});
	$pinned_dirs_list.on("click", ".action-link", function() {
		//var path = $(this).text();
		// TODO open dir
	});
	$("#select_dir_btn").click(function() {
		$("#selected_dir").click();
	});
	$("#selected_dir").change(function() {
		if (this.value.length > 0) {
			if (!pinned_dirs_list.contains(this.value)) {
				recent_dirs_list.move(this.value, recent_dirs_list);
				load_history();
			}
			// TODO open dir
		}
	});
});

function init_window() {
	var gui = require("nw.gui");
	var wnd = gui.Window.get();

	if (localStorage.getItem(WINDOW_MAXIMIZE)) {
		wnd.maximize();
	}
	wnd.on("maximize", function() {
		localStorage.setItem(WINDOW_MAXIMIZE, true);
	});
	wnd.on("unmaximize", function() {
		localStorage.removeItem(WINDOW_MAXIMIZE);
	});
}

function load_history() {
	$recent_dirs_list.empty();
	_.each(load_dirs(recent_dirs_list), function($dir) {
		$dir.prepend( $("<span>", { class: "action-icon remove" }) )
			.prepend( $("<span>", { class: "action-icon pin" }) )
			.appendTo($recent_dirs_list);
	});
	$recent_dirs_list.slideDown("fast");

	$pinned_dirs_list.empty();
	_.each(load_dirs(pinned_dirs_list), function($dir) {
		$dir.prepend( $("<span>", { class: "action-icon remove" }) )
			.appendTo($pinned_dirs_list);
	});
	$pinned_dirs_list.slideDown("fast");
}

/**
 * @param {List} list
 * @returns {Array}
 */
function load_dirs(list) {
	var dirs = list.toArray();
	return _.map(dirs, function(dir) {
		var $text = $("<span>", { class: "action-link recent-dir" }).text(dir);
		return $("<div>", { class: "row" }).append($text);
	});
}
