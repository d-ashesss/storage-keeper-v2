var _ = require("underscore");

/**
 * @param {jQuery} $image
 * @param {object=} options
 * @constructor
 */
function Image($image, options) {
	this.$image = $image;
	this.image = $image.get(0);

	if (typeof options != "object") {
		options = {}
	}
	this.options = _.extend({}, this.options, options);

	var i = this;
	this.$image.load(function() {
		i.onload();
	})
}
module.exports = Image;

Image.prototype = {
	/** @type {jQuery} */
	$image: null,
	/** @type {HTMLImageElement} */
	image: null,

	width: 0,
	height: 0,

	allowFlip: false,

	options: {
		/** @type {function} */
		onSizeCallback: null
	},

	onload: function() {
		var margin = this.height - this.image.height;
		if (margin > 0) {
			this.$image.css("margin-top", margin / 2);
		} else {
			this.$image.css("margin-top", 0);
		}
		if (this.allowFlip && Math.round(Math.random()) == 1) {
			this.$image.css("-webkit-transform", "scaleX(-1)")
		} else {
			this.$image.css("-webkit-transform", "scaleX(1)")
		}
		if (this.$image.is(":visible") && typeof this.options.onSizeCallback == "function") {
			this.options.onSizeCallback.call(this,
				this.image.naturalWidth, this.image.naturalHeight,
				this.$image.width(), this.$image.height()
			);
		}
	},

	setFile: function(file) {
		var file_url = file ? file : "img/blank.png";
		if (this.image.src != file_url) {
			this.image.src = file_url;
		} else {
			setTimeout(function(i) {
				i.onload();
			}, 1, this);
		}
	},

	setSize: function(width, height) {
		this.$image.css({
			maxWidth: this.width = width,
			maxHeight: this.height = height
		});
		this.onload();
	},

	show: function(file, allow_flip) {
		this.allowFlip = allow_flip;
		this.setFile(file);
		this.$image.show();
	},

	hide: function() {
		this.$image.hide();
	}
};