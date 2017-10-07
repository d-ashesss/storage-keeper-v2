const GALLERY_BOOKMARKS = "gallery-bookmarks";
const GALLERY_BOOKMARKS_LISTS = GALLERY_BOOKMARKS + "-lists";
const DB_NAME = "gallery";
const DB_VERSION = 1;
const BOOKMARKS_STORE = "bookmarks";

var path = require("path");

var List = require("../List");

/**
 * @param {Window} window
 * @param {IDBDatabase} database
 * @constructor
 */
function Bookmarks2(window, database) {
	this.window = window;
	this.database = database;
	this.listOfLists = List.from_storage(this.window.localStorage, GALLERY_BOOKMARKS_LISTS, {
		unique: true
	});
	this.clearCache();
}
module.exports = Bookmarks2;

/**
 * @param {Window} window
 */
Bookmarks2.create = function (window) {
	var response = {
		onsuccess: function() {},
		onerror: function() {}
	};
	var request = Bookmarks2.connect(window);
	request.onsuccess = function(database) {
		response.onsuccess(new Bookmarks2(window, database));
	};
	request.onerror = function(error) {
		response.onerror(error);
	};
	return response;
};

/**
 * @param {Window} window
 */
Bookmarks2.connect = function(window) {
	var response = {
		onsuccess: function() {},
		onerror: function() {}
	};
	var request = window.indexedDB.open(DB_NAME, DB_VERSION);
	request.onsuccess = function() {
		response.onsuccess(this.result);
	};
	request.onerror = function() {
		response.onerror(this.error);
	};
	request.onupgradeneeded = function() {
		var imagesStore = this.result.createObjectStore(BOOKMARKS_STORE, {autoIncrement: true});
		imagesStore.createIndex("name", "name", {unique: false});
		imagesStore.createIndex("list", "list", {unique: false});
		imagesStore.createIndex("name-in-list", ["name", "list"], {unique: true});
	};
	return response;
};

Bookmarks2.prototype = {
	/** @type {IDBDatabase} */
	database: null,
	/** @type {Window} */
	window: null,
	/** @type {List} */
	listOfLists: null,

	/** @type {List} */
	list: null,

	cache: null,

	getCurrent: function() {
		return this.listOfLists.current() || "";
	},

	setList: function(name, images, callback) {
		this.list = null;
		this.listOfLists.setCurrent(name);
		if (typeof images !== "undefined") {
			this.initList(images, callback);
		}
	},

	initList: function(images, callback) {
		var name = this.getCurrent();
		if (typeof this.cache["list_" + name] !== "undefined") {
			this.list = this.cache["list_" + name];
			if (callback) callback();
			return;
		}

		var list = this.list = this.cache["list_" + name] = new List("", {
			unique: true
		});
		var imagesByName = {};
		images.forEach(function(t) {
			imagesByName[ path.basename(t) ] = t;
		});

		var tx = this.database.transaction(BOOKMARKS_STORE, "readonly");
		var keyRange = this.window.IDBKeyRange.only(name);
		tx.objectStore(BOOKMARKS_STORE).index("list").openCursor(keyRange).onsuccess = function() {
			if (!this.result) {
				return;
			}
			if (imagesByName.hasOwnProperty(this.result.value.name)) {
				list.add(imagesByName[ this.result.value.name ]);
			}
			this.result.continue();
		};
		tx.oncomplete = function() {
			if (callback) callback();
		};
	},

	clearCache: function() {
		this.cache = {};
	},

	filter: function(images, list) {
		if (typeof list === "undefined") {
			list = this.list;
		}
		return images.filter(function(image) {
			return this.contains(image);
		}, list);
	},

	createList: function(name) {
		this.listOfLists.add(name);
		this.setList(name);
	},

	getList: function(name, callback) {
		var list = new List("", {
			unique: true
		});
		var tx = this.database.transaction(BOOKMARKS_STORE, "readonly");
		var keyRange = this.window.IDBKeyRange.only(name);
		tx.objectStore(BOOKMARKS_STORE).index("list").openCursor(keyRange).onsuccess = function() {
			if (!this.result) {
				if (callback) callback(list);
				return;
			}
			list.add(this.result.value.name);
			this.result.continue();
		};
	},

	getLists: function() {
		return this.listOfLists.toArray();
	},

	prevList: function(images, callback) {
		var list = this.listOfLists.prev();
		this.setList(list, images, function() {
			if (callback) callback(list);
		});
	},

	nextList: function(images, callback) {
		var list = this.listOfLists.next();
		this.setList(list, images, function() {
			if (callback) callback(list);
		});
	},

	contains: function(value) {
		if (this.list === null) {
			return false;
		}
		return this.list.contains(value);
	},

	add: function(value, callback) {
		var list = this.list;
		var filename = path.basename(value);
		var tx = this.database.transaction(BOOKMARKS_STORE, "readwrite");
		tx.objectStore(BOOKMARKS_STORE).add({
			name: filename,
			list: this.getCurrent()
		});
		tx.oncomplete = function() {
			list.add(value);
			if (callback) callback();
		};
		tx.onerror = function() {
			if (callback) callback(this.error);
		};
	},

	remove: function(value, callback) {
		var list = this.list;
		var filename = path.basename(value);
		var tx = this.database.transaction(BOOKMARKS_STORE, "readwrite");

		var keyRange = this.window.IDBKeyRange.only([filename, this.getCurrent()]);
		tx.objectStore(BOOKMARKS_STORE).index("name-in-list").openKeyCursor(keyRange).onsuccess = function() {
			if (this.result) {
				this.source.objectStore.delete(this.result.primaryKey);
			}
		};
		tx.oncomplete = function() {
			list.remove(value);
			if (callback) callback();
		};
		tx.onerror = function() {
			if (callback) callback(this.error);
		};
	},

	toggle: function(value, callback) {
		if (!this.contains(value)) {
			this.add(value, callback);
		} else {
			this.remove(value, callback);
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
