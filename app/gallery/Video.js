var _ = require("underscore");

var Media = require("./Media");

/**
 * @param {jQuery} $video
 * @param {object=} options
 * @constructor
 * @extends {Media}
 */
function Video($video, options) {
	this.$video = $video;
	this.video = $video.get(0);

	if (typeof options != "object") {
		options = {};
	}
	this.options = _.extend({}, this.options, options);

	this.video.addEventListener("ended", (function() {
		if (this.options.loop) {
			this.play();
		}
	}).bind(this));
	this.video.addEventListener("canplay", this.onload.bind(this));
}
module.exports = Video;

Video.prototype = Media.extend({
	/** @type {jQuery} */
	$video: null,
	/** @type {HTMLVideoElement} */
	video: null,

	width: 0,
	height: 0,

	options: {
		autoplay: true,
		loop: true
	},

	onload: function() {
		var video_width = Math.min(this.video.videoWidth, this.width);
		var video_height = Math.min(this.video.videoHeight, this.height);
		this.$video.css({
			"width": video_width,
			"height": video_height,
			"margin-top": this.getMargin(this.height, video_height),
			"margin-left": this.getMargin(this.width, video_width)
		});

		if (this.$video.is(":visible")) {
			this.trigger("load", {
				width: this.$video.width(),
				height: this.$video.height(),
				naturalWidth: this.video.videoWidth,
				naturalHeight: this.video.videoHeight
			});
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
});
