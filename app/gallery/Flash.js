var _ = require("underscore");

var Media = require("./Media");

/**
 * @param {jQuery} $flash
 * @param {object=} options
 * @constructor
 * @extends {Media}
 */
function Flash($flash, options) {
	this.$flash = $flash;
	this.flash = $flash.get(0);

	if (typeof options != "object") {
		options = {};
	}
	this.options = _.extend({}, this.options, options);
}
module.exports = Flash;

Flash.prototype = Media.extend({
	/** @type {jQuery} */
	$flash: null,
	/** @type {HTMLDivElement} */
	flash: null,

	width: 0,
	height: 0,

	options: {},

	onload: function() {
		this.trigger("load", {
			src: this.$flash.data("src"),
			width: this.$flash.width(),
			height: this.$flash.height()
		});
	},

	/**
	 * @param {string|null} file
	 */
	setFile: function(file) {
		if (file === null) {
			this.$flash.data("src", '');
			this.$flash.html('');
			return;
		}
		this.file = file;
		var file_url = this.getFileUrl();
		if (this.$flash.data("src") != file_url) {
			this.$flash.data("src", file_url);
			this.$flash.html('<object><embed width="100%" height="100%" src="' + file_url + '"></embed></object>');
		}
		this.onload();
	},

	/**
	 * @param {number} width
	 * @param {number} height
	 */
	setSize: function(width, height) {
		this.$flash.css({
			width: this.width = width,
			height: this.height = height
		});
		this.onload();
	},

	/**
	 * @param {string} file
	 */
	show: function(file) {
		this.setFile(file);
		this.$flash.show();
	},

	hide: function() {
		this.setFile(null);
		this.$flash.hide();
	},

	isVisible: function() {
		return this.$flash.is(":visible");
	}
});
