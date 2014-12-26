var fs = require("fs");
var node_path = require("path");
var _ = require("underscore");

var supported_extensions = [".jpg", ".jpeg", ".png", ".gif", ".apng", ".agif", ".swf", ".webm", ".mp4"];

exports.getImages = function(path, callback) {
	fs.readdir(path, function(err, files) {
		var images = _.filter(files, function(file) {
			var ext = node_path.extname(file).toLowerCase();
			return supported_extensions.indexOf(ext) >= 0;
		});
		images = _.map(images, function(file) {
			return path + "/" + file;
		});
		callback(images);
	});
};

exports.getTags = function(path, callback) {
	var tags = node_path.basename(path).split(" ");
	fs.readdir(path, function(err, files) {
		var dirs = _.filter(files, function(file) {
			var ext = node_path.extname(file).toLowerCase();
			if (supported_extensions.indexOf(ext) >= 0) {
				return false;
			}
			var file_path = path + "/" + file;
			try {
				var stat = fs.statSync(file_path);
				return stat.isDirectory();
			} catch(e) {}
			return false;
		});
		tags = _.filter(tags.concat(dirs), function(tag) {
			return /^[a-z0-9_\-]+$/i.test(tag);
		});
		callback(tags);
	});
};