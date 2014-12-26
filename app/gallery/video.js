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
		options = {}
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
		var margin = this.height - this.video.videoHeight;
		if (margin > 0) {
			this.$video.css({
				width: this.video.videoWidth,
				height: this.video.videoHeight,
				"margin-top": margin / 2
			});
		} else {
			this.$video.css({
				width: this.width,
				height: this.height,
				"margin-top": 0
			});
		}
		if (this.$video.is(":visible") && typeof this.options.onSizeCallback == "function") {
			this.options.onSizeCallback.call(this,
				this.video.videoWidth, this.video.videoHeight,
				this.$video.width(), this.$video.height()
			);
		}
	},

	setFile: function(file) {
		var file_url = file ? "file:///" + file.replace(/\\/g, "/") : "nw:blank";
		if (this.video.src != file_url) {
			this.video.src = file_url;
		}
		if (file && this.options.autoplay) {
			this.play();
		}
	},

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

	show: function(file) {
		this.setFile(file);
		this.$video.show();
	},

	hide: function() {
		this.setFile(null);
		this.$video.hide();
	}
};
