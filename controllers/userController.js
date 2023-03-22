const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require('../models/brandModel');
const Cart = require('../models/cartModel');
const Orders  = require('../models/orderModel');
const bcrypt = require("bcrypt");
const {ObjectId}=require("mongodb")
require("dotenv").config();

const accountsid = process.env.TWILIO_ACCOUNT_SID;
const authtoken = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(accountsid, authtoken);

let msg;
let message;
let index;
let orderStatus=0;

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
        message: "Please provide your correct Mobile and password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.render("login" ,{message:"Mobile or Password incorrect"});
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

    res.render("login", { message: "Mobile or password is incorrect" });
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
      .limit(8);
      
 
    res.render("home", { session,product: productData,category:categoryData,message,msg });
     message = null;
  msg = null;
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
      const productData = await Product.find({ status: { $ne: 1 } }).sort({ _id: -1,});
      const categoryData = await Category.find();
      const brandData = await Brand.find();
      res.render('shop',{session,product:productData,category:categoryData,brand:brandData,message});
      message=null;
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


    const featured = await Product.find({ category: productData.category}).sort({id:-1}).limit(4);
    res.render("productShop", { product: productData, session,message,featured });
    message= null;
  } catch (error) {
    console.log(error);
    
  }
}


const filterPrice = async (req, res) => {
  try {
    const category = req.body.category;
    const brand = req.body.brand;
    const price = req.body.price;
    const sort = req.body.sort;


    


    const productList = await Product.find()
      .populate("category")
      .populate("brand");
    let product = productList.filter(
      (ok) =>
        (ok.category._id == category || ok.category == category || !category) &&
        (ok.brand._id == brand || ok.brand == brand || !brand) &&
        (price === "1-1000"
          ? ok.price >= 1 && ok.price <= 1000
          : price === "1000-1500"
          ? ok.price >= 1000 && ok.price <= 1500
          : price === "1500-2000"
          ? ok.price >= 1500 && ok.price <= 2000
          : price === "2000-3000"
          ? ok.price >= 2000 && ok.price <= 3000
          : price === "3000-1000000"
          ? ok.price >= 3000
          : true)
    );

    if (sort === "low-to-high") {
      product.sort((a, b) => a.price - b.price);
    } else if (sort === "high-to-low") {
      product.sort((a, b) => b.price - a.price);
    } 
    const categoryData = await Category.find();
    const brandData = await Brand.find();

    let session = req.body.user_id;
    res.render("shop", {
      product,
      session,
      category: categoryData,
      brand: brandData,
      message,
    });

    message = null;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



/////////////////////////////////Cart///////////////////////////////////////////





const loadCart = async(req,res) => {
  try {
     let totalPrice = 0;
      session = req.session.user_id;
      const cart = await Cart.findOne({ userId: session }).populate('item.product');
    if (!cart) {
       res.render("cart", { items: [], totalPrice, session });
    }
   
    if(cart && cart.item!=null){
      cart.item.forEach(value => {
        totalPrice += value.price * value.quantity;
      })
    }
    await Cart.updateOne({userId:session},{$set:{totalPrice:totalPrice}});
    const items = cart.item;
    
    res.render('cart', { items ,session,totalPrice,msg});
  } catch (err) {
    console.error(err);
   
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
      
    }
    message = "Item Added Successfully"
     const referer = req.headers.referer || "/";
     res.redirect(referer);
  }else{
    res.redirect('/login');
    message = "Login with your account to access this page";
  }
  } catch (error) {
    console.log(error);
  }
};

const incrementCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const itemId = req.body.itemId;
    const cartCount = await Cart.findOne({ "item._id": itemId });
    const item = cartCount.item.find((item) => item._id.toString() === itemId);
    const product = await Product.findOne({ _id: item.product });
    if (item) {
      if (item.quantity >= product.quantity) {
        res.status(400).json({ error: "oooopps out of stock" });
      } else {
        await Cart.updateOne(
          { userId: userId, "item._id": itemId },
          { $inc: { "item.$.quantity": 1 } }
        );
        const updatedCartCount = await Cart.findOne({ "item._id": itemId });
        const updatedItem = updatedCartCount.item.find((item) => item._id.toString() === itemId);
        const updatedPrice = (updatedItem.price * updatedItem.quantity).toFixed(2);
        res.json({ success: true, updatedPrice });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};




const decrementCart = async (req, res) => {
  console.log("Ajax ok ok");

  try {
    const userId = req.session.user_id;
    const itemid = req.body.itemId;
    const cartCount = await Cart.findOne({ "item._id": itemid });
    
    const item = cartCount.item.find((item) => item._id.toString() === itemid);
   
    const product = await Product.findOne({ _id: item.product });
    if (item) {
      if (item.quantity <= 1) {
        res.status(400).json({ error: "Can't make below 1" });
      } else {
        await Cart.updateOne(
          { userId: userId, "item._id": itemid },
          { $inc: { "item.$.quantity": -1 } }
        );
        res.json({ success: true });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};





const removeCart = async (req, res) => {
  const id = req.body.id;
  const userId = req.session.user_id;
  const del = await Cart.updateOne(
    { userId: new Object(userId) },
    { $pull: { item: { _id: id } } }
  );
 
  res.json({ success: true });
};




////////////////////WishList Managment/////////////////////////




const loadWishlist = async (req, res) => {
  try {
    let session = req.session.user_id;
    const wishlist = await User.findOne({ _id: session }).populate(
      "wishlist.product"
    );
    

    if (!wishlist) {
      res.render("wishlist", { items: [], session });
    }
    // const itemsId = wishlist.wishlist.toString();

    const items = await Product.find({ _id: { $in: wishlist.wishlist } }).populate('brand').populate('category');

    
    res.render("wishlist", { items, session });
  } catch (error) {
    console.log(error);
  }
};





const addToWishlist  =  async(req,res) => {
  if(req.session.user_id){
    const productId = req.query.id;
    const userId = req.session.user_id;
      try {
        
        const user = await User.findById(userId);
        if (user.wishlist.includes(productId)) {
          return res
            .status(400)
            .json({ message: "Product already in wishlist" });

            // const referer = req.headers.referer || "/";
            // res.redirect(referer);
        }

        
        user.wishlist.push(productId);
        await user.save();
        res.redirect('/wishlist')
        // return res.status(200).json({ message: "Product added to wishlist" });
        
        // const referer = req.headers.referer || "/";
        // res.redirect(referer);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
      }
  }else{
    res.redirect('/login');
    message = "Login with your account to access this page"
  }
}


/////////////////////////////////Checkout/////////////////////////////////////

const loadCheckOut = async(req,res) => {
  if(req.session.user_id){
  try {
    let totalPrice = 0;
    let session = req.session.user_id;
    const userDetails = await User.findById({_id:session});
    
    const userAddress = userDetails.address;
    const cart = await Cart.findOne({ userId: session }).populate("item.product");
    console.log(cart.item);
    const items = cart.item;
    if (cart && cart.item != null) {
      cart.item.forEach((value) => {
        totalPrice += value.price * value.quantity;
      });
    }
    
    res.render('checkout',{session,userAddress,msg,items,totalPrice,items});
    msg=null;
  } catch (error) {
    
    console.log(error);
  }
}else{

}
}





const addressPage =  async(req,res) => {
  try {
    session = req.session.user_id;
    res.render('address',{session,message,msg})
    message=null;
    msg=null;
  } catch (error) {
    console.log(error);
  }
}



const addAddress  =  async (req,res) => {
  try {
    const id =  req.session.user_id;
    const user =  await User.find({_id:id});
        const data = req.body;
        if ((data.address, data.city, data.district, data.state, data.zip,data.name,data.mobile,data.email)) {
          const userData = await User.findOne({ _id: new Object(id) });
          userData.address.push(data);
          await userData.save();

          res.redirect("/addAddress");
          msg = "Address added success fully";
        } else {
          res.redirect("/addAddress");
          message   = "Please fill all the forms";
        }
  } catch (error) {
    console.log(error);
  }
}


const editAddressLoad = async(req,res) => {
  try {
    const session = req.session.user_id;
    const index = req.query.index;
    console.log(index);
    const findUser = await User.findById({_id:session});
    const address = findUser.address[index];
    console.log(address);

    res.render('editAddress',{session,address,index,message,msg})

  } catch (error) {
    console.log(error);
  }
}

const editAddress = async (req,res) => {
  try {
     const id =  req.session.user_id;
    const user =  await User.find({_id:id});
    const index = req.query.index;
        const data = req.body;
     
        const key =   `address.${index}`
        if ((data.address, data.city, data.district, data.state, data.zip,data.name,data.mobile,data.email)){
             const editAddress = {
          name:data.name,
          email:data.email,
          mobile:data.mobile,
          city:data.city,
          address:data.address,
          district:data.district,
          state:data.state,
          zip:data.zip
          
        };
       const updatedAddress =    await User.updateOne({_id:id},{$set:{[key]:editAddress}});
        if(updatedAddress){
          res.redirect("/checkout");
          msg = "Address Updated successfully";
        }else{
          res.redirect("/checkout");
          message = "Error";
        }
        }else{
          res.redirect("/editAddress");
          message = "Please fill all the forms";
        }
    
  } catch (error) {
    console.log(error);
  }
}


loadPaymentPage = async (req, res) => {
  try {
   index = req.body.address;
    console.log(index);
    let session = req.session.user_id;
    let product = await Cart.findOne({ userId: session }, { totalPrice: 1 });
    let Total = parseInt(product.totalPrice)
    
    res.render("paymentPage",{Total,session,msg});
  } catch (error) {
    console.log(error);
  }
};



const orderConfirm = async(req,res) => {
  try {
    const session = req.body.user_id;
    const payment = req.body;
    console.log(payment);
    if (payment.flexRadioDefault == "cashOn") {
      orderStatus = 1;

      res.redirect("/orderDetails");
    } else if (payment.flexRadioDefault == "online") {
      res.send("online");
    } else {
      res.send("error");
    }
    
  } catch (error) {
    console.log(error);
  }
}


const orderDetails = async (req, res) => {
  try {
    const session = req.session.user_id;
    let message = null;

    if (!session) {
      res.redirect("/login");
      message = "Login to Access this page";
      return;
    }

    const userData = await User.findOne({ _id: session });

    if (orderStatus === 1) {
      console.log('===============');
      const cart = await Cart.findOne({ userId: session }).populate(
        "item.product"
      );
      const user = await User.findOne({ _id: session });

      let address = user.address[0];

      if (index !== undefined) {
        address = user.address[index];
      }

      const orderItems = cart.item.map((item) => ({
        product: item.product._id,
        price: item.price,
        quantity: item.quantity,
      }));

      const latestOrder = await Orders.findOne().sort("-orderCount").exec();
      const order = new Orders({
        userId: session,
        item: orderItems,
        address,
        totalPrice: cart.totalPrice,
        orderCount: latestOrder ? latestOrder.orderCount + 1 : 1,
        order_date: new Date().toLocaleDateString("en-GB"),
      });

      await order.save();
console.log("prrrr");


      const orderData = await Orders.findOne({ userId: session }).populate("item.product");
        console.log("ssss");
      orderData.item.forEach(async (item) => {
        const productid = item.product._id;
        const decreaseQuantity = item.quantity;
        console.log("kkkkk");
        await Product.updateOne(
          { _id: productid },
          { $inc: { quantity: -decreaseQuantity } }
        );
      });

      await Cart.deleteMany({ userId: session });

      orderStatus = 0;
    }
      console.log("hlooo");
    const orders = await Orders.find({
      $and: [
        { userId: session },
        { user_cancelled: false },
        { admin_cancelled: false },
      ],
    }).populate("item.product");
    console.log("fdkfdskfkj");
    res.render("orderDetails", { userData, session, message, orders });
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
  incrementCart,
  decrementCart,
  removeCart,
  addToWishlist,
  loadWishlist,
  loadCheckOut,
  addressPage,
  addAddress,
  editAddressLoad,
  editAddress,
  loadPaymentPage,
  orderDetails,
  orderConfirm,
};
