var fs = require("fs");
var path = require("path");
var _ = require("underscore");

var supported_extensions = [".jpg", ".jpeg", ".png", ".gif", ".apng", ".agif", ".swf", ".webm", ".mp4"];

exports.getImages = function(callback) {
	fs.readdir(process.cwd(), function(err, files) {
		var images = _.filter(files, function(file) {
			var ext = path.extname(file).toLowerCase();
			return supported_extensions.indexOf(ext) >= 0;
		});
		images = _.map(images, function(file) {
			return file;
		});
		callback(images);
	});
};

exports.getTags = function(callback) {
	var current_dir = process.cwd();
	var pre_tags = path.basename(current_dir).split(" ");
	fs.readdir(current_dir, function(err, files) {
		var dirs = _.filter(files, function(file) {
			var ext = path.extname(file).toLowerCase();
			if (supported_extensions.indexOf(ext) >= 0) {
				return false;
			}
			try {
				var stat = fs.statSync(file);
				return stat.isDirectory();
			} catch(e) {}
			return false;
		});
		var tags = [];
		_.each(pre_tags.concat(dirs), function(tag) {
			if (tags.indexOf(tag) < 0 && /^[a-z0-9\-]+$/i.test(tag)) {
				tags.push(tag);
			}
		});
		callback(tags);
	});
};

exports.save = function(images) {
	_.each(images, function(tag_path, src_path) {
		var dst_path = tag_path + "/" + path.basename(src_path);
		if (!fs.existsSync(tag_path)) {
			fs.mkdirSync(tag_path);
		}
		fs.renameSync(src_path, dst_path);
	})
};
