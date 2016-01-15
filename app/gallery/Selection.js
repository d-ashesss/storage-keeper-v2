var path = require("path");
var _ = require("underscore");

var EventEmiter = require("../EventEmiter");
var List = require("../List");

/**
 * @param {Directory} directory
 * @param {List} selected_dirs_list
 * @constructor
 * @extends {EventEmiter}
 */
function Selection(directory, selected_dirs_list) {
	this.resetImages();
	this.directory = directory;
	this.selectedDirs = selected_dirs_list;
	if (this.selectedDirs.length() === 0) {
		this.selectedDirs.add(directory.getPath());
	}
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
	/** @type {List} */
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
		var selected = this.getSelectedDirs();
		return selected.indexOf(path) >= 0;
	},

	_selectDir: function(path) {
		if (!this.dirSelected(path)) {
			this.selectedDirs.add(path);
			return true;
		}
		return false;
	},

	selectDir: function(path) {
		this._selectDir(path);
		this.trigger("dir-select");
		this.trigger("change");
		this.resetImages();
	},

	selectOneDir: function(path) {
		this.selectedDirs.setData([]);
		this.selectDir(path);
	},

	selectLevel: function(level) {
		var dir_list = this.getDirList();
		_.each(dir_list, function(dir) {
			if (dir.level >= level) {
				this._selectDir(dir.index);
			}
		}, this);
		this.trigger("dir-select");
		this.trigger("change");
		this.resetImages();
	},

	deselectDir: function(path) {
		var index = this.selectedDirs.indexOf(path);
		if (index >= 0) {
			this.selectedDirs.remove(path);
			this.trigger("dir-select");
			this.trigger("change");
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
		var dir_list = this.directory.getDirList().map(function(dir) {
			return dir.getPath();
		});
		var selected = this.selectedDirs.toArray().filter(function(dir) {
			return dir_list.indexOf(dir) >= 0;
		});
		if (selected.length === 0) {
			return [this.directory.getPath()];
		}
		return this.selectedDirs.toArray();
	},

	saveSelectedDirs: function() {
		this.selectedDirs.save();
	},

	imageSelected: function(path) {
		return this.selectedImages.indexOf(path) >= 0;
	},

	selectImage: function(path) {
		if (this._selectImage(path)) {
			this.trigger("change");
		}
	},

	_selectImage: function(path) {
		if (typeof path !== "string") {
			return false;
		}
		if (!this.imageSelected(path)) {
			this.selectedImages.push(path);
			this._untagImage(path);
			return true;
		}
		return false;
	},

	deselectImage: function(path) {
		if (this._deselectImage(path)) {
			this.trigger("change");
		}
	},

	_deselectImage: function(path) {
		if (typeof path !== "string") {
			return false;
		}
		var index = this.selectedImages.indexOf(path);
		if (index >= 0) {
			this.selectedImages.splice(index, 1);
			return true;
		}
		return false;
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
		if (this._tagImage(path, tag)) {
			this.trigger("change");
		}
	},

	_tagImage: function(path, tag) {
		if (typeof path !== "string") {
			return false;
		}
		var tag_dir = _.findWhere(this.getDirList(), { name: tag });
		if (typeof tag_dir !== "undefined") {
			tag = tag_dir.index;
		}
		if (typeof this.taggedImages[path] !== "undefined") {
			var tag_list = this.getSubTagList(tag);
			var tag_index = tag_list.indexOf(this.taggedImages[path]);
			if (tag_index === (tag_list.length - 1)) {
				return this._untagImage(path);
			}
			if (tag_index >= 0) {
				tag = tag_list[tag_index + 1];
			}
		}
		this.taggedImages[path] = tag;
		this._deselectImage(path);
		return true;
	},

	untagImage: function(path) {
		if (this._untagImage(path)) {
			this.trigger("change");
		}
	},

	_untagImage: function(path) {
		if (typeof path !== "string") {
			return false;
		}
		delete this.taggedImages[path];
		return true;
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
		var tagged = _.clone(this.taggedImages);
		_.reduce(this.selectedImages, function(images, image) {
			images[image] = this.selectDest;
			return images;
		}, tagged, this);
		return tagged;
	}
};

EventEmiter.mixin(Selection.prototype);
