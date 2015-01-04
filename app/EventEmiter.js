var _ = require("underscore");

/**
 * @constructor
 */
function EventEmiter() {
}
module.exports = EventEmiter;

EventEmiter.mixin = require("./mixin");
EventEmiter.TIMEOUT = 10;

EventEmiter.prototype = {
	/** @type {Object.<string, Array.<function>>} */
	events: null,

	/**
	 * @param {string} event_name
	 * @param {function} handler
	 */
	on: function (event_name, handler) {
		if (this.events == null) {
			this.events = {};
		}
		if (!this.events[event_name]) {
			this.events[event_name] = [];
		}
		this.events[event_name].push(handler.bind(this));
	},

	/**
	 * @param {string} event_name
	 * @param {*=} data
	 */
	trigger: function (event_name, data) {
		if (this.events == null || !this.events[event_name]) {
			return;
		}
		_.each(this.events[event_name], function(handler) {
			setTimeout(handler, EventEmiter.TIMEOUT, data);
		});
	}
};
