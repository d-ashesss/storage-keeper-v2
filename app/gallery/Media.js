var EventEmiter = require("../EventEmiter");

/**
 * @constructor
 * @extends {EventEmiter}
 */
function Media() {
}
module.exports = Media;

Media.extend = require("../extend");

Media.prototype = {
	baseUrl: null,
	file: null,
	defaultFile: "nw:blank",

	getMargin: function(max_width, actual_width) {
		var margin = (max_width - actual_width) / 2;
		return margin > 0 ? margin : 0;
	},

	getScale: function(naturalWidth, naturalHeight, actialWidth, actualHeight) {
		var natural_size = naturalWidth * naturalHeight;
		var actual_size = actialWidth * actualHeight;
		return Math.round(actual_size / natural_size * 100);
	},

	setBasePath: function(path) {
		var url = path;
		if (url[0] == "/" || /^[a-z]+:/i.test(url)) {
			url = "file:///" + url;
		}
		this.baseUrl = url;
	},

	getFileUrl: function() {
		var url = "";
		if (this.baseUrl != null) {
			url = this.baseUrl + "/";
		}
		if (this.file != null) {
			return url + this.file;
		}
		return this.defaultFile;
	},

	getFile: function() {
		return this.file;
	},

	isVisible: function() {
	}
};

EventEmiter.mixin(Media.prototype);
