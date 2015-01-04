var _ = require("underscore");

var Media = require("./Media");

/**
 * @param {jQuery} $frame
 * @param {object=} options
 * @constructor
 * @extends {Media}
 */
function Frame($frame, options) {
	this.$frame = $frame;
	this.frame = $frame.get(0);

	if (typeof options != "object") {
		options = {};
	}
	this.options = _.extend({}, this.options, options);
}
module.exports = Frame;

Frame.prototype = Media.extend({
	/** @type {jQuery} */
	$frame: null,
	/** @type {HTMLIFrameElement} */
	frame: null,

	width: 0,
	height: 0,

	options: {
	},

	onload: function() {
		this.trigger("load", {
			src: this.frame.src,
			width: this.$frame.width(),
			height: this.$frame.height()
		});
	},

	/**
	 * @param {string} file
	 */
	setFile: function(file) {
		this.file = file;
		var file_url = this.getFileUrl();
		if (this.frame.src != file_url) {
			this.frame.src = file_url;
		}
		this.onload();
	},

	/**
	 * @param {number} width
	 * @param {number} height
	 */
	setSize: function(width, height) {
		this.$frame.css({
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
		this.$frame.show();
	},

	hide: function() {
		this.setFile(null);
		this.$frame.hide();
	},

	isVisible: function() {
		return this.$frame.is(":visible");
	}
});
