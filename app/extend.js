var _ = require("underscore");

/**
 * @returns {function}
 */
module.exports = function(child_prototype) {
	var prototype = new this();
	_.defaults(prototype, this.prototype);
	return _.extend(prototype, child_prototype);
};
