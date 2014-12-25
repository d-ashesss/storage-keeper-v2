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
	})
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
		loop: true
	},

	setFile: function(file) {
		this.video.src = file;
		if (file && this.options.autoplay) {
			this.play();
		}
	},

	setSize: function(width, height) {
		this.$video.css({
			width: this.width = width,
			height: this.height = height
		});
		//this.$video.width(this.width = width);
		//this.$video.height(this.height = height);
	},

	play: function() {
		this.video.play();
	},

	pause: function() {
		this.video.pause();
	},

	show: function(file) {
		if (file) {
			this.setFile(file);
		}
		this.$video.show();
	},

	hide: function() {
		this.setFile("");
		this.$video.hide();
	}
};
