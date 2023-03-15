const User = require('../models/userModel')

const isBlocked = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const userData = await User.findOne({ _id: req.session.user_id });
      if(userData.is_blocked===1){
        req.session.user_id = null;
      }
      next()
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};


module.exports = {
  isBlocked
}