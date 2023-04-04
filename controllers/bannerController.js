const Banner = require('../models/bannerModel');
const mime = require("mime-types");
const { findByIdAndDelete } = require('../models/bannerModel');
const bannerDashboard = async (req, res) => {
  try {
    const banner = await Banner.find();
    res.render("bannerDash", { banner });
  } catch (error) {
    console.log(error);
  }
}


const addBanner = async (req, res) => {
  try {

    res.render('addBanner')
  } catch (error) {
    console.log(error);
  }
}

const newBanner = async (req, res) => {
  try {
    const { mainHeading, description } = req.body;
    console.log(mainHeading, description);
    let arrImages = [];
    if (req.files) {
      req.files.forEach((file) => {
        const mimeType = mime.lookup(file.originalname);
        if (mimeType && mimeType.includes("image/")) {
          arrImages.push(file.filename);
        } else {
          res.redirect("/admin/addBanner");

        }
      });
    }
    const bannerData = new Banner({
      bannerImage: arrImages,
      mainHeading: mainHeading,
      description: description,
    });
    bannerData.save();
    res.redirect("/admin/banner-dashboard");
  } catch (error) {
    console.log(error);
  }
};

const deletebanner = async (req, res) => {
  try {
    const id = req.query.id;
    await Banner.findByIdAndDelete({ _id: id })
    res.redirect('/admin/banner-dashboard')
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  bannerDashboard,
  addBanner,
  newBanner,
  deletebanner,
};



