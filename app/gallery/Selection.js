var path = require("path");
var _ = require("underscore");

var EventEmiter = require("../EventEmiter");
var List = require("../List");

/**
 * @param {Directory} directory
 * @constructor
 * @extends {EventEmiter}
 */
function Selection(directory) {
	this.resetImages();
	this.directory = directory;
	this.selectedDirs = [];
	this.selectedDirs.push(directory.getPath());
	this.selectDest = directory.getPath();
}
module.exports = Selection;

Selection.TAG_KEYS = ["Q", "A", "W", "S", "E", "D", "R", "F", "T", "G", "Z", "X", "C", "V", "B"];

/**
 * @param {number} char_code
 * @returns {number}
 */
Selection.getKeyIndex = function(char_code) {
	var key = String.fromCharCode(char_code);
	return Selection.TAG_KEYS.indexOf(key);
};

Selection.prototype = {
	/** @type {Directory} */
	directory: null,
	/** @type {Array.<string>} */
	selectedDirs: null,
	/** @type {Object.<string, string>} */
	customTags: null,
	/** @type {Array.<string>} */
	selectedImages: null,
	/** @type {Object.<string, string>} */
	taggedImages: null,
	/** @type {string} */
	selectDest: null,

	resetImages: function() {
		this.selectedImages = [];
		this.taggedImages = {};
		this.customTags = {};
	},

	setSelectDest: function(dir_path) {
		if (typeof dir_path === "string") {
			this.selectDest = path.resolve(dir_path).replace(/\\/g, "/") + "/";
		} else {
			this.selectDest = this.directory.getPath();
		}
		this.trigger("change");
	},

	getSelectDest: function() {
		var display_path = path.dirname(this.selectDest);
		var path_basename = path.basename(display_path);
		if (path_basename.length > 0) {
			display_path = path_basename + "/";
		}
		var basename = path.basename(this.selectDest);
		if (basename.length > 0) {
			display_path = display_path + basename;
		}
		return display_path;
	},

	addTag: function(tag) {
		var tag_path = this.directory.getPath() + tag + "/";
		if (_.pluck(this.getDirList(), "index").indexOf(tag_path) < 0) {
			this.customTags[tag] = tag_path;
		}
		this.trigger("change");
	},

	/**
	 * @param {string=} current_image
	 * @returns {Array}
	 */
	getDirList: function(current_image) {
		var current_tag = this.taggedImages[current_image];
		var custom_tags = _.map(this.customTags, function(tag_path, tag) {
			return {
				index: tag_path,
				name: tag,
				level: 1,
				selected: this.dirSelected(tag_path),
				current: current_tag === tag_path,
				tagged: this.imagesTagged(tag_path),
				foldable: false
			};
		}, this);
		var dir_list = this.directory.getDirList();
		return _.map(dir_list, function(dir) {
			return {
				index: dir.getPath(),
				name: dir.getName(),
				level: dir.level,
				selected: this.dirSelected(dir.getPath()),
				current: current_tag === dir.getPath(),
				tagged: this.imagesTagged(dir.getPath()),
				foldable: /^\[.*]$/.test(dir.getName())
			};
		}, this).concat(custom_tags);
	},

	dirSelected: function(path) {
		return this.selectedDirs.indexOf(path) >= 0;
	},

	_selectDir: function(path) {
		if (!this.dirSelected(path)) {
			this.selectedDirs.push(path);
			return true;
		}
		return false;
	},

	selectDir: function(path) {
		if (this._selectDir(path)) {
			this.trigger("change");
			this.trigger("dir-select");
			this.resetImages();
		}
	},

	selectOneDir: function(path) {
		this.selectedDirs = [];
		this.selectDir(path);
	},

	selectLevel: function(level) {
		var dir_list = this.getDirList();
		_.each(dir_list, function(dir) {
			if (dir.level >= level) {
				this._selectDir(dir.index);
			}
		}, this);
		this.trigger("change");
		this.trigger("dir-select");
		this.resetImages();
	},

	deselectDir: function(path) {
		var index = this.selectedDirs.indexOf(path);
		if (index >= 0) {
			this.selectedDirs.splice(index, 1);
			this.trigger("change");
			this.trigger("dir-select");
			this.resetImages();
		}
	},

	toggleDir: function(path) {
		if (this.dirSelected(path)) {
			this.deselectDir(path);
		} else {
			this.selectDir(path);
		}
	},

	/**
	 * @returns {Array.<string>}
	 */
	getSelectedDirs: function() {
		return this.selectedDirs;
	},

	imageSelected: function(path) {
		return this.selectedImages.indexOf(path) >= 0;
	},

	selectImage: function(path) {
		if (typeof path !== "string") {
			return;
		}
		if (!this.imageSelected(path)) {
			this.selectedImages.push(path);
			this.trigger("change");
		}
	},

	deselectImage: function(path) {
		if (typeof path !== "string") {
			return;
		}
		var index = this.selectedImages.indexOf(path);
		if (index >= 0) {
			this.selectedImages.splice(index, 1);
			this.trigger("change");
		}
	},

	toggleImage: function(path) {
		if (this.imageSelected(path)) {
			this.deselectImage(path);
		} else {
			this.selectImage(path);
		}
	},

	imagesSelected: function() {
		return this.selectedImages.length;
	},

	tagImage: function(path, tag) {
		if (typeof path !== "string") {
			return;
		}
		var tag_dir = _.findWhere(this.getDirList(), {name: tag});
		if (typeof tag_dir !== "undefined") {
			tag = tag_dir.index;
		}
		if (typeof this.taggedImages[path] !== "undefined") {
			var tag_list = this.getSubTagList(tag);
			var tag_index = tag_list.indexOf(this.taggedImages[path]);
			if (tag_index === (tag_list.length - 1)) {
				this.untagImage(path);
				return;
			}
			if (tag_index >= 0) {
				tag = tag_list[tag_index + 1];
			}
		}
		this.taggedImages[path] = tag;
		this.trigger("change");
	},

	untagImage: function(path) {
		if (typeof path !== "string") {
			return;
		}
		delete this.taggedImages[path];
		this.trigger("change");
	},

	imagesTagged: function(only_tag) {
		return _.reduce(this.taggedImages, function(memo, tag) {
			if (typeof only_tag !== "undefined" && only_tag !== tag) {
				return memo;
			}
			return memo + 1;
		}, 0);
	},

	/**
	 * @returns {Array.<string>}
	 */
	getSubTagList: function(tag) {
		var tag_list = [tag];
		var dir_list = this.directory.getDirList();
		var tag_level = null;
		_.find(dir_list, function(dir) {
			if (dir.getPath() === tag) {
				tag_level = dir.level;
				return;
			}
			if (tag_level !== null && dir.level > tag_level) {
				tag_list.push(dir.getPath());
			}
			if (dir.level === tag_level) {
				return true;
			}
		});
		return tag_list;
	},

	/**
	* @returns {Object.<string, string>}
	*/
	dumpImages: function() {
		if (this.selectedImages.length > 0) {
			return _.reduce(this.selectedImages, function(images, image) {
				images[image] = this.selectDest;
				return images;
			}, {}, this);
		}
		return this.taggedImages;
	}
};

EventEmiter.mixin(Selection.prototype);
