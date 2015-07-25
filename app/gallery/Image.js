var _ = require("underscore");

var Media = require("./Media");

/**
 * @param {jQuery} $image
 * @param {object=} options
 * @constructor
 * @extends {Media}
 */
function Image($image, options) {
	this.$image = $image;
	this.image = $image.get(0);

	if (typeof options != "object") {
		options = {};
	}
	this.options = _.extend({}, this.options, options);

	this.$image.load(this.onload.bind(this));
}
module.exports = Image;

Image.prototype = Media.extend({
	/** @type {jQuery} */
	$image: null,
	/** @type {HTMLImageElement} */
	image: null,

	width: 0,
	height: 0,

	allowFlip: false,

	options: {},

	defaultFile: "img/blank.png",

	onload: function() {
		this.$image.css({
			"margin-top": this.getMargin(this.height, this.image.height),
			"margin-left": this.getMargin(this.width, this.image.width)
		});

		if (this.allowFlip && Math.round(Math.random()) == 1) {
			this.$image.css("-webkit-transform", "scaleX(-1)");
		} else {
			this.$image.css("-webkit-transform", "scaleX(1)");
		}

		this.trigger("load", {
			src: this.image.src,
			width: this.image.naturalWidth,
			height: this.image.naturalHeight,
			scale: this.getScale(this.image.naturalWidth, this.image.naturalHeight, this.$image.width(), this.$image.height())
		});
	},

	/**
	 * @param {string} file
	 */
	setFile: function(file) {
		this.file = file;
		var file_url = this.getFileUrl();
		if (this.image.src != file_url) {
			this.image.src = file_url;
		} else {
			this.onload();
		}
	},

	/**
	 * @param {number} width
	 * @param {number} height
	 */
	setSize: function(width, height) {
		this.$image.css({
			maxWidth: this.width = width,
			maxHeight: this.height = height
		});
		this.onload();
	},

	/**
	 * @param {string} file
	 * @param {boolean=} allow_flip
	 */
	show: function(file, allow_flip) {
		this.allowFlip = allow_flip;
		this.setFile(file);
		this.$image.show();
	},

	hide: function() {
		this.setFile(null);
		this.$image.hide();
	},

	isVisible: function() {
		return this.$image.is(":visible");
	}
});
