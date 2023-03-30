const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  bannerImage: {
    type: Array,
    required: true,
  },
  mainHeading: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Banner", bannerSchema);