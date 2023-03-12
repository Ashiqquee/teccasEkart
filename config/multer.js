const multer = require("multer");
const path = require("path");

function createMulter() {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(
        null,
        path.join(__dirname, "../public/productImages"),
        function (success, err) {
          if (err) {
            throw err;
          }
        }
      );
    },
    filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname;
      cb(null, name, function (success, err) {
        if (err) {
          throw err;
        }
      });
    },
  });

  let upload = multer({ storage: storage });
  return upload;
}

module.exports = {
  createMulter,
};
