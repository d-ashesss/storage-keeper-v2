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

	if (this.sessionStorage[this.CURRENT_DIR]) {
		process.chdir(this.sessionStorage[this.CURRENT_DIR]);
	}
}

App.prototype = {
	WINDOW_STATE_INITIALIZED: "window-state-initialized",
	WINDOW_MAXIMIZED: "window-maximized",
	CURRENT_DIR: "current-dir",

	/** @enum */
	keys: {
		BACKSPACE: 8,
		TAB: 9,
		ENTER: 13,
		PAUSE: 19,
		ESC: 27,
		SPACE: 32,
		PGUP: 33,
		PGDOWN: 34,
		END: 35,
		HOME: 36,
		INSERT: 45,
		DELETE: 46,

		0: 48,
		1: 49,
		2: 50,
		3: 51,
		4: 52,
		5: 53,
		6: 54,
		7: 55,
		8: 56,
		9: 57,

		MENU: 93,
		NUMPAD_ASTERISK: 106,
		NUMPAD_PLUS: 107,
		NUMPAD_MINUS: 109,
		NUMPAD_SLASH: 111,

		F1: 112,
		F2: 113,
		F3: 114,
		F4: 115,
		F5: 116,
		F6: 117,
		F7: 118,
		F8: 119,
		F9: 120,
		F10: 121,
		F11: 122,
		F12: 123,

		EQUAL: 187,
		MINUS: 189,
		SLASH: 191,
		TILDA: 192,
		BACKSLASH: 220
	},

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
		if (!this.sessionStorage[this.WINDOW_STATE_INITIALIZED]) {
			if (this.localStorage.getItem(this.WINDOW_MAXIMIZED)) {
				this.nwWindow.maximize();
			}
			this.nwWindow.show();
			this.sessionStorage[this.WINDOW_STATE_INITIALIZED] = 1;
		}

		this.nwWindow.on("maximize", (function() {
			try {
				this.localStorage.setItem(this.WINDOW_MAXIMIZED, true);
			} catch (/** Error */ error) {
				console.warn(error.message);
			}
		}).bind(this));
		this.nwWindow.on("unmaximize", (function() {
			try {
				this.localStorage.removeItem(this.WINDOW_MAXIMIZED);
			} catch (/** Error */ error) {
				console.warn(error.message);
			}
		}).bind(this));

		window.jQuery(window).keydown((function(event) {
			if (event.keyCode == this.keys.F5) {
				this.reload();
			} else if (event.keyCode == this.keys.F6) {
				this.reloadDev();
			} else if (event.keyCode == this.keys.F11) {
				this.toggleFullscreen();
			} else if (event.keyCode == this.keys.F12) {
				this.showDevTools();
			} else {
				return;
			}
			event.preventDefault();
			event.stopImmediatePropagation();
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
	},

	showDevTools: function() {
		this.nwWindow.showDevTools();
	},

	/**
	 * @param {string} dir
	 */
	chdir: function(dir) {
		process.chdir(dir);
		this.sessionStorage[this.CURRENT_DIR] = dir;
	}
};
