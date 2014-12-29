var _ = require("underscore");

/**
 * @param {jQuery} $frame
 * @param {object=} options
 * @constructor
 */
function Frame($frame, options) {
	this.$frame = $frame;
	this.frame = $frame.get(0);

	if (typeof options != "object") {
		options = {}
	}
	this.options = _.extend({}, this.options, options);
}
module.exports = Frame;

Frame.prototype = {
	/** @type {jQuery} */
	$frame: null,
	/** @type {HTMLIFrameElement} */
	frame: null,

	width: 0,
	height: 0,

	options: {
	},

	setFile: function(file) {
		var file_url = file ? file : "nw:blank";
		if (this.frame.src != file_url) {
			this.frame.src = file_url;
		}
	},

	setSize: function(width, height) {
		this.$frame.css({
			width: this.width = width,
			height: this.height = height
		});
	},

	show: function(file) {
		this.setFile(file);
		this.$frame.show();
	},

	hide: function() {
		this.setFile(null);
		this.$frame.hide();
	}
};
