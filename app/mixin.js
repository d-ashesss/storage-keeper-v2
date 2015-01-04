var _ = require("underscore");

/**
 * @returns {function}
 * @this {function}
 */
module.exports = function(target_prototype) {
	var mixin = new this();
	return _.extend(target_prototype, this.prototype, mixin);
};
