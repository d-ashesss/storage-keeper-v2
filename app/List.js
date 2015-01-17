var _ = require("underscore");

/**
 * @param {string=} name
 * @param {object=} options
 * @returns {List}
 * @constructor
 */
function List(name, options) {
	this.name = name;
	this.list = [];

	if (typeof options != "object") {
		options = {};
	}
	this.options = _.extend({}, this.options, options);
}
module.exports = List;

/**
 * @param {Storage} storage
 * @param {string} name
 * @param {object=} options
 * @returns {List}
 */
List.from_storage = function(storage, name, options) {
	var list = new List(name, options);
	var list_data = storage.getItem(name);
	list.setData(list_data);
	list.setStorage(storage);
	return list;
};

List.prototype = {
	/** @type {string} */
	name: "",
	/** @type {Array} */
	list: null,
	options: {
		addToHead: false,
		maxSize: 0,
		unique: false
	},
	/** @type {Storage} */
	storage: null,
	position: -1,

	/**
	 * @param {Storage} storage
	 */
	setStorage: function(storage) {
		this.storage = storage;
	},

	/**
	 * @param {(Array|string)} data
	 */
	setData: function(data) {
		if (typeof data == "string") {
			data = JSON.parse(data);
		}
		if (data != null) {
			this.list = data;
		}
		if (this.length() > 0) {
			this.position = 0;
		}
	},

	/**
	 * @returns {Array}
	 */
	toArray: function() {
		return this.list.slice();
	},

	/**
	 * @param {*} value
	 * @returns {number}
	 */
	indexOf: function(value) {
		return this.list.indexOf(value);
	},

	/**
	 * @returns {boolean}
	 */
	contains: function(value) {
		return this.indexOf(value) >= 0;
	},

	/**
	 * @param {*} value
	 */
	unshift: function(value) {
		if (this.options.unique) {
			this.remove(value);
		}
		this.list.unshift(value);
		if (this.options.maxSize > 0) {
			this.list.splice(this.options.maxSize);
		}
		this.save();
	},

	/**
	 * @returns {*}
	 */
	shift: function() {
		var value = this.list.shift();
		this.save();
		return value;
	},

	/**
	 * @param {*} value
	 */
	push: function(value) {
		if (this.options.unique) {
			this.remove(value);
		}
		this.list.push(value);
		if (this.options.maxSize > 0) {
			this.list = this.list.splice(-this.options.maxSize);
		}
		this.save();
	},

	/**
	 * @returns {*}
	 */
	pop: function() {
		var value = this.list.pop();
		this.save();
		return value;
	},

	/**
	 * @param {*} value
	 */
	add: function(value) {
		if (this.options.addToHead) {
			this.unshift(value);
		} else {
			this.push(value);
		}
		this.position = this.indexOf(value);
	},

	/**
	 * @param {*} value
	 */
	remove: function(value) {
		var pos = this.indexOf(value);
		if (pos >= 0) {
			this.list.splice(pos, 1);
			this.save();
		}
	},

	/**
	 * @param {*} value
	 * @param {List} to_list
	 */
	move: function(value, to_list) {
		this.remove(value);
		to_list.add(value);
	},

	/**
	 * @returns {number}
	 */
	length: function() {
		return this.list.length;
	},

	/**
	 * @returns {?*}
	 */
	current: function() {
		if (this.position < 0) {
			return null;
		}
		return this.at(this.position);
	},

	setCurrent: function(value) {
		var position = this.indexOf(value);
		if (position >= 0) {
			this.setPosition(position);
		}
	},

	/**
	 * @returns {?*}
	 */
	first: function() {
		if (this.length() > 0) {
			this.position = 0;
		}
		return this.current();
	},

	/**
	 * @returns {?*}
	 */
	last: function() {
		if (this.length() > 0) {
			this.position = this.length() - 1;
		}
		return this.current();
	},

	/**
	 * @returns {?*}
	 */
	prev: function() {
		if (this.position > 0) {
			this.position--;
		}
		return this.current();
	},

	/**
	 * @returns {?*}
	 */
	next: function() {
		if (this.position < (this.length() - 1)) {
			this.position++;
		}
		return this.current();
	},

	/**
	 * @returns {?*}
	 */
	getNext: function() {
		if (this.length() > 0 && this.position < (this.length() - 1)) {
			return this.list[this.position + 1];
		}
		return null;
	},

	/**
	 * @returns {?*}
	 */
	random: function() {
		if (this.length() > 0) {
			this.position = Math.floor(Math.random() * this.length());
		}
		return this.current();
	},

	/**
	 * @param {number} position
	 * @returns {*}
	 */
	at: function(position) {
		return this.list[position];
	},

	/**
	 * @param {boolean=} zero_base
	 * @returns {number}
	 */
	getPosition: function(zero_base) {
		return this.position + (zero_base ? 1 : 0);
	},

	setPosition: function(position) {
		this.position = position;
	},

	save: function() {
		if (this.storage == null) {
			return;
		}
		var value = JSON.stringify(this.list);
		this.storage.setItem(this.name, value);
	}
};
