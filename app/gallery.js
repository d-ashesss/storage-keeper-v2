var fs = require("fs");
var path = require("path");
var _ = require("underscore");

var Directory = require("./gallery/directory");

exports.readdir = function(callback) {
	var current_dir = process.cwd();
	fs.readdir(current_dir, function(err, files) {
		var dir = new Directory(current_dir);
		dir.setContent(files);
		callback(dir);
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
