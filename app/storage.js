var storage = {};

exports.init = function(new_storage) {
	storage = new_storage;
};

exports.get = function(key, default_value) {
	if (typeof storage[key] == "undefined") {
		return default_value;
	}
	return storage[key];
};

exports.set = function(key, value) {
	storage[key] = value;
};

exports.remove = function(key) {
	delete storage[key];
};
