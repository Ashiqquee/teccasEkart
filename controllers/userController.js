const User = require("../models/userModel");
const bcrypt = require("bcrypt");

require('dotenv').config();

const accountsid = process.env.TWILIO_ACCOUNT_SID;
const authtoken = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = process.env.TWILIO_SERVICE_SID;
const client = require('twilio')(accountsid,authtoken);


const loadRegister = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error.message);
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.render("signup", {
        msg: "Email already registered",
      });
    }

    const existingNumber = await User.findOne({ mobile: req.body.mno });
    if (existingNumber) {
      return res.render("signup", {
        msg: "Mobile number already registered",
      });
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!req.body.mno || !mobileRegex.test(req.body.mno)) {
      return res.render("signup", {
        msg: "Please enter a valid mobile number",
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!req.body.email || !emailRegex.test(req.body.email)) {
      return res.render("signup", {
        msg: "Please enter a valid email address",
      });
    }

    if (!req.body.name || req.body.name.trim().length < 3) {
      return res.render("signup", {
        msg: "Please enter a valid name",
      });
    }
    const spassword = await securePassword(req.body.pwd);
     
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      is_admin: 0,
      is_blocked: 0,
    });
    
    const userData = await user.save();
  
    if (userData) {
      req.session.phone = req.body.mno;
      client.verify.v2
        .services(TWILIO_SERVICE_SID)
        .verifications.create({ to: `+91${req.body.mno}`, channel: "sms" })
        .then((verification) => {
          console.log(req.body.mno);
        })
        .catch((err) => {
          
        });
      res.render("verifySignup");
    } else {
      res.render("signup", { msg: "Registration failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};


const otpVerify = async (req, res) => {
  const { otp } = req.body;
  let { phone } = req.session;
  console.log(otp, phone);
  client.verify.v2
    .services(TWILIO_SERVICE_SID)
    .verificationChecks.create({ to: `+91${phone}`, code: otp })
    .then(async (verification_check) => {
      if (verification_check.status == "approved") {
        req.session.otpcorrect = true;
        // Update the user's is_verified field in the database
        await User.updateOne({ phone }, { $set: { is_verified: 1 } });
        res.redirect("/login");
      } else {
      }
    })

    .catch((error) => {
      console.log(error);
    });
};




const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await User.findOne({ email });

    if (!userData) {
      return res.render("login", {
        message: "Please provide your correct Email and password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.render("login");
    }

    if (userData.is_blocked === 1) {
      return res.render("login", {
        message: "Your account is blocked,conatct:teccas@gmail.com",
      });
    }

    if (userData.is_admin === 0) {
      req.session.user_id = userData._id;
      return res.redirect("/");
    }

    res.render("login", { message: "Email or password is incorrect" });
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const session = req.session.user_id;
    res.render("home", { session });
  } catch (error) {
    console.log(error);
  }
};




const userLogout = async (req, res) => {
  try {
    req.session.user_id = null;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};




module.exports = {
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  loadHome,
  userLogout,
  otpVerify
  
};
