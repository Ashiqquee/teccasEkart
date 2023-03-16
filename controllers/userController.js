const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require('../models/brandModel');
const Cart = require('../models/cartModel');
const bcrypt = require("bcrypt");

require("dotenv").config();

const accountsid = process.env.TWILIO_ACCOUNT_SID;
const authtoken = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(accountsid, authtoken);

let msg;
let message;

const loadRegister = async (req, res) => {
  try {
   
    res.render("signup",{msg,message});
    msg= null;
    message = null;
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};



const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to hash password");
  }
};



////////////////////////signup Manangement///////////////////////




const insertUser = async (req, res) => {
  try {
    const {  mno } = req.body;

  

    const existingNumber = await User.findOne({ mobile: mno });
    if (existingNumber) {
         redirect("/signup");
         msg = "Mobile already registered";
    }
  
      req.session.phone = mno;
      try {
        const verification = await client.verify
          .services(TWILIO_SERVICE_SID)
          .verifications.create({ to: `+91${mno}`, channel: "sms" });
        console.log(mno);
        res.render("verifySignup");
      } catch (err) {
        console.error(err);
        redirect("/signup");
        msg = "Failed to send Otp ";
      }
  
  } catch (error) {
    console.error(error);
    res.redirect('/signup');
    message= "Error"
  }
};



const resendOTP = async (req, res) => {
  const { phone } = req.session;
  try {
    const verification = await client.verify
      .services(TWILIO_SERVICE_SID)
      .verifications.create({ to: `+91${phone}`, channel: "sms" });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};



const otpVerify = async (req, res) => {
  const { otp } = req.body;
  password = req.body.password
  let { phone } = req.session;
  console.log(otp, phone);
  client.verify.v2
    .services(TWILIO_SERVICE_SID)
    .verificationChecks.create({ to: `+91${phone}`, code: otp })
    .then(async (verification_check) => {
      if (verification_check.status == "approved") {
        req.session.otpcorrect = true;
         const spassword = await securePassword(password);
         const user = new User({
          mobile:phone,
          password:spassword,
         });
         const userData = user.save();
         if(userData){
        res.redirect("/login");
        msg="verification success,now login with your account";
         }
      } else {
        res.render('verifySignup',{msg:"Otp incorrect"})
      }
    })

    .catch((error) => {
      console.log(error);
    });
};




const loginLoad = async (req, res) => {
  try {
    res.render("login", { msg, message });
    msg=null;
    message= null;
  } catch (error) {
    console.log(error.message);
  }
};





const verifyLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    console.log(mobile,password);

    const userData = await User.findOne({ mobile:mobile });

    if (!userData) {
      return res.render("login", {
        message: "Please provide your correct Email and password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.render("login" ,{message:"Email or Password incorrect"});
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
    const categoryData =  await Category.find();
    
    const productData = await Product.find({ status: { $ne: 1 } })
      .sort({ _id: -1 })
      .limit(4);
      console.log(productData);
  
    res.render("home", { session,product: productData,category:categoryData });
  } catch (error) {
    console.log(error);
  }
};







///////////////////////////////Reset password Managment/////////////////////////

const resetPassword = async (req, res) => {
  try {
    res.render("resetPassword");
  } catch (error) {
    console.log(err);
  }
};

const sendReset = async (req, res) => {
  try {
    if (!req.body.mno) {
      throw new Error("Mobile number is not defined");
    }

    const existingNumber = await User.findOne({ mobile: req.body.mno });

    if (existingNumber) {
      console.log("ok");
      req.session.phone = req.body.mno;
      
      res.render('changePassword')
      client.verify.v2
        .services(TWILIO_SERVICE_SID)
        .verifications.create({ to: `+91${req.body.mno}`, channel: "sms" })
        .then((verification) => {
          console.log(req.body.mno);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("ji");
      res.render('resetPassword',{msg:"This Number is Not Registered"})
    }
  } catch (error) {
    console.log(error);
  }
};

const verifyReset = async (req, res) => {
  const { otp, password } = req.body;
  const phone = req.session.phone;
  console.log("otp:", otp);
  console.log("phone:", phone);

  try {
    const verification_check = await client.verify
      .v2.services(TWILIO_SERVICE_SID)
      .verificationChecks.create({ to: `+91${phone}`, code: otp });
    
    
    if (verification_check.status === "approved") {
      const spassword = await securePassword(req.body.password);
      // await  User.updateOne({mobile:phone},{$set:{is_verified:1}})
      await User.updateOne({ mobile: phone }, { $set: { password: spassword } });
      
      req.session.otpcorrect = true;
      res.redirect('/login')
      msg = "Verfied Succesfully,Login with account"
    } else {
      res.render('changePassword',{msg:"Incorrect Otp"})
      
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while verifying OTP.");
  }
};



///////////////////////////////Profile Managment//////////////////////////////////



const profileLoad = async(req,res) => {
  try {

   if(req.session.user_id){
    
     const id = req.session.user_id;
     
     const userData = await User.findOne({ _id: id });
     res.render("profile",{userData:userData});
   }
   res.redirect('/login');
   message="Login with your account to access this page"
    
  } catch (error) {
    console.log(error);
    
  }
}



/////////////////////////////////Shop///////////////////////////////////////////




const loadShop = async(req,res) => {
    try {
      const session = req.session.user_id;
      const productData = await Product.find();
      const categoryData = await Category.find();
      const brandData = await Brand.find();
      res.render('shop',{session,product:productData,category:categoryData,brand:brandData});
      
    } catch (error) {
      console.log(error);
      
    }
}




const productShop = async(req,res) =>{
  try {
    const session = req.session.user_id;
    const id = req.query.id;
    const productData = await Product.findOne({ _id: new Object(id) })
      .populate("category")
      .populate("brand");
    
    res.render("productShop", { product: productData, session });
  } catch (error) {
    console.log(error);
    
  }
}




const filterPrice = async (req, res) => {
  try {
    const category = req.body.category;
    const brand = req.body.brand;
    const price = req.body.price;
 console.log(category,brand,price);
    
    const query = {};

    if (category) {
      const categoryObject = await Category.findOne({ name: category });
      console.log(categoryObject);
      query.category = categoryObject.name;
      console.log(query.category);
    }

    if (brand) {
      const brandObject = await Brand.findOne({ brandName: brand });
      console.log(brandObject);
      query.brand = brandObject.brandName;
      console.log(query.brand);
    }

    if (price) {
      const [min, max] = price.split('-');
      query.price = { $gte: min, $lte: max };
    }

    
    const categoryData = await Category.find();
    const brandData = await Brand.find();
    const product = await Product.find(query);
    let session  = req.body.user_id;
    res.render('shop', { product,session,category:categoryData,brand:brandData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/////////////////////////////////Cart///////////////////////////////////////////




const loadCart = async(req,res) => {
  try {
      session = req.session.user_id;
           const cart = await Cart.findOne({ userId: session }).populate('item.product');
    if (!cart) {
      return res.render('cart', { items: [] ,session});
    }
    const items = cart.item;
    res.render('cart', { items ,session});
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Something went wrong' });
  }
    
  } 



const addToCart = async (req, res) => {
  try {

    if(req.session.user_id){
    const productId = req.query.id;
    const userId = req.session.user_id;

    const product = await Product.findOne({ _id: productId });
    const userCart = await Cart.findOne({ userId: userId });

    if (userCart) {
      const itemIndex = userCart.item.findIndex(
        (item) => item.product._id.toString() === productId
      );

      if (itemIndex >= 0) {
        const inc = await Cart.updateOne(
          { userId: userId, "item.product": productId },
          { $inc: { "item.$.quantity": 1 } }
        );
        console.log(inc);
      } else {
        const create = await Cart.updateOne(
          { userId: userId },
          {
            $push: {
              item: {
                product: productId,
                price: product.price,
                quantity: 1,
              },
            },
          }
        );
        console.log(create);
      }
    } else {
      const createNew = await Cart.create({
        userId: userId,
        item: [
          {
            product: productId,
            price: product.price,
            quantity: 1,
          },
        ],
      });
      console.log(createNew);
    }

    res.redirect("/");
  }else{
    res.redirect('/login');
    message = "Login with your account to access this page";
  }
  } catch (error) {
    console.log(error);
  }
};







/////////////////////////////////Logout///////////////////////////////////////////

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
  resendOTP,
  loadHome,
  userLogout,
  verifyReset,
  sendReset,
  resetPassword,
  otpVerify,
  profileLoad,
  loadShop,
  productShop,
  loadCart,
  addToCart,
  filterPrice,
};
