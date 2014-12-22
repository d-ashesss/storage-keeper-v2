var storage = require("../storage");
var _ = require("underscore");

/**
 * @param {string} name
 * @param {object=} options
 * @returns {List}
 */
function get_list(name, options) {
	var list = storage.get(name, "[]");
	return new List(name, list, options);
}
exports.get = get_list;

function List(name, list, options) {
	this.name = name;
	if (typeof list == "string") {
		list = JSON.parse(list);
	}
	this.list = list;
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

	afterAdd: function() {
		if (this.options.maxSize > 0) {
			this.list.splice(this.options.maxSize);
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
		var value = JSON.stringify(this.list);
		storage.set(this.name, value);
	}
};
