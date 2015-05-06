var fs = require("fs");
var path = require("path");
var _ = require("underscore");
var async = require("async");

var supported_extensions = [".jpg", ".jpeg", ".png", ".gif", ".apng", ".agif", ".swf", ".webm", ".mp4"];

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
	this.reset();
}
module.exports = Directory;

Directory.prototype = {
	path: "",
	level: 0,
	max_level: 2,
	/** @type {Array.<string>} */
	images: null,
	/** @type {Array.<Directory>} */
	dirs: null,
	/** @type {Array.<string>} */
	other: null,

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
			async.each(files.sort(), this.filterFile.bind(this), function() {
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
			if (/^[^a-z0-9\-]/i.test(file) || this.level >= this.max_level) {
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
		return images;
	},

	getDirList: function() {
		var list = [this];
		_.each(this.dirs, function(dir) {
			list = list.concat(dir.getDirList());
		});
		return list;
	},

	save: function(files) {
		_.each(files, function(dir_path, file_name) {
			var file_path = this.getPath() + file_name;
			var dst_file_path = dir_path + path.basename(file_name);
			if (!fs.existsSync(dir_path)) {
				fs.mkdirSync(dir_path);
			}
			fs.renameSync(file_path, dst_file_path);
		}, this);
	}
};
