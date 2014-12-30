var _ = require("underscore");

var List = require("../List");

/**
 * @constructor
 */
function Selection() {
	this.tags = [];
	this.events = {};
}
module.exports = Selection;

Selection.TAG_KEYS = ["Q", "A", "W", "S", "E", "D", "R", "F", "Z", "X", "C", "V"];

/**
 * @param {number} char_code
 * @returns {number}
 */
Selection.getKeyIndex = function(char_code) {
	var key = String.fromCharCode(char_code);
	return Selection.TAG_KEYS.indexOf(key);
};

Selection.prototype = {
	/** @type {Array.<List>} */
	tags: null,

	/**
	 * @param {Array.<string>} tags
	 */
	setTags: function(tags) {
		this.tags = [];
		_.each(tags, function(tag_name) {
			this._addTag(tag_name);
		}, this);
		this.trigger("change");
	},

	/**
	 * @param {string} raw_tag_name
	 */
	_addTag: function(raw_tag_name) {
		var tag_name = raw_tag_name.replace(/[^0-9a-z\-]/ig, '');
		if (this.getTagIndex(tag_name) >= 0) {
			return;
		}
		this.tags.push(new List(tag_name, { unique: true }));
	},
	/**
	 * @param {string} tag_name
	 */
	addTag: function(tag_name) {
		this._addTag(tag_name);
		this.trigger("change");
	},

	/**
	 * @param {string} tag_name
	 */
	getTagIndex: function(tag_name) {
		return _.reduce(this.tags, function(found_index, tag, tag_index) {
			if (found_index < 0 && tag.name == tag_name) {
				return tag_index;
			}
			return found_index;
		}, -1);
	},

	/**
	 * @param {string} image
	 * @param {(string|number)} tag
	 */
	_select: function(image, tag) {
		var tag_index = (typeof tag == "string") ? this.getTagIndex(tag) : tag;
		this._deselect(image);
		if (this.tags[tag_index]) {
			this.tags[tag_index].add(image);
		}
	},

	/**
	 * @param {string} image
	 * @param {(string|number)} tag
	 */
	select: function(image, tag) {
		this._select(image, tag);
		this.trigger("change");
	},

	/**
	 * @param {string} image
	 */
	_deselect: function(image) {
		_.each(this.tags, function(tag) {
			tag.remove(image);
		});
	},
	/**
	 * @param {string} image
	 */
	deselect: function(image) {
		this._deselect(image);
		this.trigger("change");
	},

	/**
	 * @param {string} image
	 * @param {number} tag_index
	 */
	toggle: function(image, tag_index) {
		if (this.isSelected(image, tag_index)) {
			this.deselect(image);
		} else {
			this.select(image, tag_index);
		}
	},

	/**
	 * @param {string} image
	 * @param {number} tag_index
	 */
	isSelected: function(image, tag_index) {
		var tags = this.tags[tag_index] ? [this.tags[tag_index]] : this.tags;
		return _.reduce(tags, function(found, tag) {
			return found || tag.indexOf(image) >= 0;
		}, false);
	},

	/**
	 * @returns {Array.<{name, key, images: Array}>}
	 */
	dumpTags: function() {
		var tags = [];
		_.each(this.tags, function(tag, i) {
			this.push({
				name: tag.name,
				key: Selection.TAG_KEYS[i],
				images: tag.toArray()
			});
		}, tags);
		return tags;
	},

	/**
	 * @returns {Object.<string, string>}
	 */
	dumpImages: function() {
		return _.reduce(this.tags, function(images, tag) {
			return _.reduce(tag.toArray(), function(images, image) {
				images[image] = this.name;
				return images;
			}, images, tag);
		}, {});
	},

	/** @type {Object.<string, Array.<function>>} */
	events: null,

	/**
	 * @param {string} event_name
	 * @param {function} handler
	 */
	on: function (event_name, handler) {
		if (!this.events[event_name]) {
			this.events[event_name] = [];
		}
		this.events[event_name].push(handler);
	},

	/**
	 * @param {string} event_name
	 */
	trigger: function (event_name) {
		if (!this.events[event_name]) {
			return;
		}
		_.each(this.events[event_name], function(handler) {
			setTimeout(handler, 10, this);
		}, this);
	}
};
