var fs = require("fs");
var path = require("path");
var _ = require("underscore");
var async = require("async");

var supported_extensions = [".jpg", ".jpeg", ".png", ".gif", ".apng", ".agif", ".swf", ".webm", ".webp"/*, ".mp4"*/];

/**
 * @param {{
 *     path: string,
 *     level: number=,
 *     max_level: number=
 * }} options
 * @constructor
 */
function Directory(options) {
	this.path = options.path.replace(/\\/g, "/");
	if (typeof options.level === "number") {
		this.level = options.level;
	}
	if (typeof options.max_level === "number") {
		this.max_level = options.max_level;
	}
	this.statCache = {};
	this.reset();
}
module.exports = Directory;

Directory.SORT_MODE = /** @enum */ {
	NORMAL: 0,
	RANDOM: 1,
	CREATED: 2,
	SIZE: 3
};

Directory.mkdir = function(dir_path) {
	var parent_path = path.dirname(dir_path);
	if (!fs.existsSync(parent_path)) {
		Directory.mkdir(parent_path);
	}
	if (!fs.existsSync(dir_path)) {
		fs.mkdirSync(dir_path);
	}
};

Directory.prototype = {
	path: "",
	level: 0,
	max_level: 5,
	/** @type {Array.<string>} */
	images: null,
	/** @type {Array.<Directory>} */
	dirs: null,
	/** @type {Array.<string>} */
	other: null,
	/** @type {Directory.SORT_MODE} */
	sort_mode: Directory.SORT_MODE.NORMAL,
	/** @type {Object.<string, fs.Stats>} */
	statCache: null,

	reset: function() {
		this.images = [];
		this.dirs = [];
		this.other = [];
	},

	getPath: function() {
		return this.path + "/";
	},

	getUri: function() {
		return "file:///" + this.getPath();
	},

	getName: function() {
		return path.basename(this.path);
	},

	/**
	 * @param {function} callback
	 */
	read: function(callback) {
		this.reset();
		fs.readdir(this.getPath(), function(err, files) {
			var sorted_files = _.sortBy(files, function(file) {
				return file.toLowerCase();
			});
			async.each(sorted_files, this.filterFile.bind(this), function() {
				callback(this);
			}.bind(this));
		}.bind(this));
	},

	/**
	 * @param {string} file
	 * @param {function} callback
	 */
	filterFile: function(file, callback) {
		var full_path = this.getPath() + file;
		var ext = path.extname(file).toLowerCase();
		if (supported_extensions.indexOf(ext) >= 0) {
			this.images.push(file);
			callback();
			return;
		}
		var stat = fs.statSync(full_path);
		if (stat.isDirectory()) {
			if (/^[^a-z0-9\-\[\]]/i.test(file) || this.level >= this.max_level) {
				callback();
				return;
			}
			var dir = new Directory({
				path: full_path,
				level: this.level + 1,
				max_level: this.max_level
			});
			this.dirs.push(dir);
			dir.read(function() {
				callback();
			}.bind(this));
			return;
		}
		this.other.push(file);
		callback();
	},

	getImages: function(selected_dirs) {
		var images = [];
		if (selected_dirs.indexOf(this.getPath()) >= 0) {
			images = images.concat(this.images);
		}
		_.each(this.dirs, function(dir) {
			var dir_images = _.map(dir.getImages(selected_dirs), function(image) {
				return this.getName() + "/" + image;
			}, dir);
			images = images.concat(dir_images);
		});
		if (this.level > 0) {
			return images;
		}
		return this.sort(images);
	},

	getDirList: function() {
		var list = [this];
		_.each(this.dirs, function(dir) {
			list = list.concat(dir.getDirList());
		});
		return list;
	},

	/**
	 * @param {Directory.SORT_MODE} mode
	 */
	setSortMode: function(mode) {
		this.sort_mode = mode;
	},

	/**
	 * @return {Directory.SORT_MODE}
	 */
	getSortMode: function() {
		return this.sort_mode;
	},

	sort: function(files) {
		if (this.sort_mode === Directory.SORT_MODE.RANDOM) {
			return _.shuffle(files);
		} else if (this.sort_mode === Directory.SORT_MODE.CREATED) {
			return _.sortBy(files, function(file) {
				return this.getFileStat(file, "birthtime");
			}, this);
		} else if (this.sort_mode === Directory.SORT_MODE.SIZE) {
			return _.sortBy(files, function(file) {
				return this.getFileStat(file, "size");
			}, this).reverse();
		}
		return _.sortBy(files, path.basename);
	},

	getFileStat: function(file_name, stat_name) {
		var full_path = this.getPath() + file_name;
		var stat = this.statCache[full_path];
		if (typeof stat === "undefined") {
			stat = this.statCache[full_path] = fs.statSync(full_path);
		}
		if (typeof stat_name === "undefined") {
			return stat_name;
		} else if (typeof stat[stat_name] === "function") {
			return stat[stat_name].call();
		}
		return stat[stat_name];
	},

	save: function(files) {
		_.each(files, function(dir_path, file_name) {
			var file_path = this.getPath() + file_name;
			var dst_file_path = dir_path + path.basename(file_name);
			if (file_path === dst_file_path) {
				return;
			}
			try {
				fs.statSync(dst_file_path);
			} catch (e) {
				return;
			}
			throw new Error("File '" + path.basename(file_name) + "' already exists in '" + dir_path + "'");
		}, this);
		_.each(files, function(dir_path, file_name) {
			var file_path = this.getPath() + file_name;
			var dst_file_path = dir_path + path.basename(file_name);
			if (file_path === dst_file_path) {
				return;
			}
			Directory.mkdir(dir_path);
			var content = fs.readFileSync(file_path);
			fs.writeFileSync(dst_file_path, content);
			try {
				var stat = fs.statSync(file_path);
				fs.utimesSync(dst_file_path, stat.atime, stat.mtime);
			} catch (e) {}
			fs.unlink(file_path);
		}, this);
	}
};
