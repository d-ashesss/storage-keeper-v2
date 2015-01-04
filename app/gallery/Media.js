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
	getMargin: function(max_width, actual_width) {
		var margin = (max_width - actual_width) / 2;
		return margin > 0 ? margin : 0;
	}
};

EventEmiter.mixin(Media.prototype);
