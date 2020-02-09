var formidable = require('formidable');
var fs = require('fs');
module.exports = function (req, res) {
  var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var tmpfile = files.file.path;
      var file = __dirname + '/files/' + files.file.name;
      fs.copyFile(tmpfile, file, function (err) {
        if (err) throw err;
        fs.unlinkSync(tmpfile);

        console.log(`file uploaded at ${file}`);
        res.write(`'${files.file.name}' file uploaded`);
        res.end();
      });
 });
};
