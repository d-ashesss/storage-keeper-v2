const GALLERY_BOOKMARKS = "gallery-bookmarks";
const GALLERY_BOOKMARKS_LISTS = GALLERY_BOOKMARKS + "-lists";

var _ = require("underscore");
var path = require("path");

var List = require("../List");

/**
 * @param {Storage} localStorage
 * @constructor
 */
function Bookmarks(localStorage) {
	this.localStorage = localStorage;
	this.listOfLists = List.from_storage(localStorage, GALLERY_BOOKMARKS_LISTS, {
		unique: true
	});
	this.clearCache();
}
module.exports = Bookmarks;

Bookmarks.prototype = {
	/** @type {Storage} */
	localStorage: null,
	/** @type {List} */
	listOfLists: null,

	/** @type {List} */
	fullList: null,
	/** @type {List} */
	list: null,

	cache: null,

	getCurrent: function() {
		return this.listOfLists.current() || "";
	},

	setList: function(name, images) {
		this.list = null;
		if (!name) {
			this.fullList = null;
			return;
		}
		this.listOfLists.setCurrent(name);
	console.time('get ' + name);
		this.fullList = this.getList(name);
	console.timeEnd('get ' + name);
		if (typeof images !== "undefined") {
			this.initList(images);
		}
	},

	initList: function(images) {
		if (this.fullList === null) {
			return;
		}
		var name = this.listOfLists.current();
	console.time('init ' + name);
		if (typeof this.cache['list_' + name] === "undefined") {
			this.cache['list_' + name] = new List(undefined, {
				unique: true
			});
			var bookmarked = [];
			_.each(images, function(image) {
				var filename = path.basename(image);
				var index = this.fullList.indexOf(filename);
				if (index >= 0 && typeof bookmarked[index] === "undefined") {
					bookmarked[index] = image;
				}
			}, this);
			this.cache['list_' + name].setData(bookmarked.filter(function(i) {
				return typeof i !== "undefined";
			}));
		}
		this.list = this.cache['list_' + name];
	console.timeEnd('init ' + name);
	},

	clearCache: function() {
		this.cache = {};
	},

	filter: function(images) {
		return images.filter(function(image) {
			return this.list.contains(image);
		}, this);
	},

	createList: function(name) {
		this.listOfLists.add(name);
		this.setList(name);
	},

	getList: function(name) {
		if (typeof this.cache['full_list_' + name] === "undefined") {
			this.cache['full_list_' + name] = List.from_storage(this.localStorage, GALLERY_BOOKMARKS + "-[" + name.toLowerCase() + "]", {
				unique: true
			});
		}
		return this.cache['full_list_' + name];
	},

	getLists: function() {
		return this.listOfLists.toArray();
	},

	prevList: function(images) {
		var list = this.listOfLists.prev();
		this.setList(list, images);
		return list;
	},

	nextList: function(images) {
		var list = this.listOfLists.next();
		this.setList(list, images);
		return list;
	},

	contains: function(value) {
		if (this.list === null) {
			return false;
		}
		return this.list.contains(value);
	},

	add: function(value) {
		if (this.fullList === null) {
			return;
		}
		var filename = path.basename(value);
		if (this.fullList.contains(filename)) {
			return;
		}
		this.fullList.add(filename);
		this.list.add(value);
	},

	remove: function(value) {
		if (this.fullList === null) {
			return;
		}
		var filename = path.basename(value);
		this.fullList.remove(filename);
		this.list.remove(value);
	},

	toggle: function(value) {
		if (!this.contains(value)) {
			this.add(value);
		} else {
			this.remove(value);
		}
	},

	current: function() {
		if (this.list === null) {
			return;
		}
		return this.list.current();
	},

	length: function() {
		if (this.list === null) {
			return 0;
		}
		return this.list.length();
	},

	setCurrent: function(value) {
		if (this.list === null) {
			return;
		}
		if (this.contains(value)) {
			this.list.setCurrent(value);
		} else {
			this.setPosition(this.length());
		}
	},

	prev: function() {
		if (this.list === null) {
			return;
		}
		return this.list.prev();
	},

	next: function() {
		if (this.list === null) {
			return;
		}
		return this.list.next();
	},

	setPosition: function(position) {
		if (this.list === null) {
			return;
		}
		this.list.setPosition(position);
	},

	toArray: function() {
		if (this.list === null) {
			return [];
		}
		return this.list.toArray();
	}
};
