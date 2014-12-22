var _ = require("underscore");

/**
 * @param {Storage} storage
 * @param {string} name
 * @param {object=} options
 * @returns {List}
 */
exports.get_from_storage = function(storage, name, options) {
	var list = new List(name, options);
	var list_data = storage.getItem(name);
	list.setData(list_data);
	list.setStorage(storage);
	return list;
};

/**
 * @param name
 * @param options
 * @constructor
 */
function List(name, options) {
	this.name = name;
	this.list = [];

	if (typeof options == "object") {
		this.options = _.extend({}, this.options, options);
	}
}
exports.List = List;

List.prototype = {
	/** @type {string} */
	name: "",
	/** @type {Array} */
	list: null,
	options: {
		addToHead: false,
		maxSize: 0
	},
	/** @type {Storage} */
	storage: null,

	/**
	 * @param {Storage} storage
	 */
	setStorage: function(storage) {
		this.storage = storage;
	},

	setData: function(data) {
		if (typeof data == "string") {
			data = JSON.parse(data);
		}
		if (data != null) {
			this.list = data;
		}
	},

	/**
	 * @returns {Array}
	 */
	toArray: function() {
		return this.list.slice();
	},

	/**
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

	unshift: function(value) {
		this.list.unshift(value);
		if (this.options.maxSize > 0) {
			this.list.splice(this.options.maxSize);
		}
		this.save();
	},

	shift: function() {
		var value = this.list.shift();
		this.save();
		return value;
	},

	push: function(value) {
		this.list.push(value);
		if (this.options.maxSize > 0) {
			this.list = this.list.splice(-this.options.maxSize);
		}
		this.save();
	},

	pop: function() {
		var value = this.list.pop();
		this.save();
		return value;
	},

	add: function(value) {
		if (this.options.addToHead) {
			this.unshift(value);
		} else {
			this.push(value);
		}
	},

	remove: function(value) {
		var pos = this.indexOf(value);
		if (pos >= 0) {
			this.list.splice(pos, 1);
			this.save();
		}
	},

	/**
	 * @param value
	 * @param {List=} to_list
	 */
	move: function(value, to_list) {
		this.remove(value);
		if (typeof to_list != "undefined") {
			to_list.add(value);
		}
	},

	save: function() {
		if (this.storage == null) {
			return;
		}
		var value = JSON.stringify(this.list);
		this.storage.setItem(this.name, value);
	}
};
