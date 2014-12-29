var fs = require("fs");
var path = require("path");
var _ = require("underscore");

var supported_extensions = [".jpg", ".jpeg", ".png", ".gif", ".apng", ".agif", ".swf", ".webm", ".mp4"];

/**
 * @param {string} path
 * @constructor
 */
function Directory(path) {
	this.path = path;
	this.images = [];
	this.dirs = [];
	this.tags = [];
	this.other = [];
}
module.exports = Directory;

Directory.prototype = {
	path: "",
	/** @type {Array.<string>} */
	images: null,
	/** @type {Array.<string>} */
	dirs: null,
	/** @type {Array.<string>} */
	tags: null,
	/** @type {Array.<string>} */
	other: null,

	/**
	 * @param {Array.<string>} files
	 */
	setContent: function(files) {
		_.each(files, this.filterFile, this);
		this.readTags();
	},

	/**
	 * @param {string} file
	 */
	filterFile: function(file) {
		var ext = path.extname(file).toLowerCase();
		if (supported_extensions.indexOf(ext) >= 0) {
			this.images.push(file);
			return;
		}
		var stat = fs.statSync(file);
		if (stat.isDirectory()) {
			this.dirs.push(file);
			return;
		}
		this.other.push(file);
	},

	readTags: function() {
		var pre_tags = path.basename(this.path).split(" ").concat(this.dirs);
		_.each(pre_tags, function(tag) {
			if (this.tags.indexOf(tag) < 0 && /^[a-z0-9\-]+$/i.test(tag)) {
				this.tags.push(tag);
			}
		}, this);
	}
};
