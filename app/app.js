function NwDispatcher() {}
NwDispatcher.prototype = {
	/** @type {function(): NwGui} */
	requireNwGui: function() {}
};

function NwGui() {}
NwGui.prototype = {
	/** @type {NwWindow} */
	Window: null
};

function NwWindow() {}
NwWindow.prototype = {
	maximize: function() {}
};

/**
 * @param {Window} window
 * @returns {App}
 */
module.exports = function(window) {
	return new App(window);
};

/**
 * @param {Window} window
 * @constructor
 */
function App(window) {
	this.window = window;
	this.localStorage = window.localStorage;
	this.sessionStorage = window.sessionStorage;
	this.nwGui = window["nwDispatcher"].requireNwGui();
	this.nwWindow = this.nwGui.Window.get();

	process.on("uncaughtException", (function(error) {
		this.onError(error);
	}).bind(this));
}

App.prototype = {
	APP_INITIALIZED: "app-started",
	WINDOW_MAXIMIZE: "maximize",
	RECENT_DIRS_LIST: "recent-dirs",
	PINNED_DIRS_LIST: "pinned-dirs",
	OPEN_DIR: "open-dir",

	/** @type {Window} */
	window: null,
	/** @type {Storage} */
	localStorage: null,
	/** @type {Storage} */
	sessionStorage: null,
	/** @type {NwGui} */
	nwGui: null,
	/** @type {NwWindow} */
	nwWindow: null,

	initWindow: function() {
		if (this.sessionStorage[this.APP_INITIALIZED]) {
			return;
		}
		this.sessionStorage[this.APP_INITIALIZED] = 1;

		if (this.localStorage.getItem(this.WINDOW_MAXIMIZE)) {
			this.nwWindow.maximize();
		}
		this.nwWindow.on("maximize", (function() {
			this.localStorage.setItem(this.WINDOW_MAXIMIZE, true);
		}).bind(this));
		this.nwWindow.on("unmaximize", (function() {
			this.localStorage.removeItem(this.WINDOW_MAXIMIZE);
		}).bind(this));
	},

	/**
	 * @param {Error} error
	 */
	onError: function(error) {},

	reload: function() {
		this.nwWindow.reload();
	},

	reloadDev: function() {
		this.nwWindow.reloadDev();
	},

	toggleFullscreen: function() {
		this.nwWindow.toggleFullscreen();
	}
};
