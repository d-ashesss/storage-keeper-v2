var _ = require("underscore");

/**
 * @param {jQuery} $video
 * @param {object=} options
 * @constructor
 */
function Video($video, options) {
	this.$video = $video;
	this.video = $video.get(0);

	if (typeof options != "object") {
		options = {};
	}
	this.options = _.extend({}, this.options, options);

	var v = this;
	this.video.addEventListener("ended", function() {
		if (v.options.loop) {
			v.play();
		}
	});
	this.video.addEventListener("canplay", function() {
		v.onload();
	});
}
module.exports = Video;

Video.prototype = {
	/** @type {jQuery} */
	$video: null,
	/** @type {HTMLVideoElement} */
	video: null,

	width: 0,
	height: 0,

	options: {
		autoplay: true,
		loop: true,
		/** @type {function} */
		onSizeCallback: null
	},

	onload: function() {
		var video_width = Math.min(this.video.videoWidth, this.width);
		var video_height = Math.min(this.video.videoHeight, this.height);
		var vertical_margin = (this.height - video_height) / 2;
		vertical_margin = vertical_margin > 0 ? vertical_margin : 0;
		var horizontal_margin = (this.width - video_width) / 2;
		horizontal_margin = horizontal_margin > 0 ? horizontal_margin : 0;
		this.$video.css({
			"width": video_width,
			"height": video_height,
			"margin-top": vertical_margin,
			"margin-left": horizontal_margin
		});

		if (this.$video.is(":visible") && typeof this.options.onSizeCallback == "function") {
			this.options.onSizeCallback.call(this,
				this.video.videoWidth, this.video.videoHeight,
				this.$video.width(), this.$video.height()
			);
		}
	},

	/**
	 * @param {string} file
	 */
	setFile: function(file) {
		var file_url = file ? file : "nw:blank";
		if (this.video.src != file_url) {
			this.video.src = file_url;
		}
		if (file && this.options.autoplay) {
			this.play();
		}
	},

	/**
	 * @param {number} width
	 * @param {number} height
	 */
	setSize: function(width, height) {
		this.$video.css({
			maxWidth: this.width = width,
			maxHeight: this.height = height
		});
		this.onload();
	},

	play: function() {
		this.video.play();
	},

	pause: function() {
		this.video.pause();
	},

	/**
	 * @param {string} file
	 */
	show: function(file) {
		this.setFile(file);
		this.$video.show();
	},

	hide: function() {
		this.setFile(null);
		this.$video.hide();
	}
};
