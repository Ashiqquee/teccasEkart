const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require('../models/brandModel');
const Cart = require('../models/cartModel');
const Orders  = require('../models/orderModel');
const Coupon =  require('../models/couponModel')
const bcrypt = require("bcrypt");
const {ObjectId}=require("mongodb");
const mongoose = require("mongoose");
require("dotenv").config();

const { update } = require("../models/userModel");
const paypal = require('paypal-rest-sdk');
paypal.configure({
  mode: "sandbox",
  client_id:
    "ASFB_e0NpyeiyAi5WX4mUgxvEB3YK-o6ThKyTQV6pv9vbt8_0fKK-Dyy0kXwayAUYnGM2QW-5T484rPX",
  client_secret:
    "EONYzhNHWjTVHEoDhOncyUEpTT79EqlBDxkBaStG7ZnZWE5Wa6dokO9qNPktlnH--WMXGlpWbOgUixD7",
});
 

const accountsid = process.env.TWILIO_ACCOUNT_SID;
const authtoken = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(accountsid, authtoken);




let msg;
let message;
let index;
let orderStatus=0;
let paymentType;

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
    let wallet;
   if(session){
     const user = await User.findOne({ _id: session });
     
      wallet = user.wallet;
   }
    
    const productData = await Product.find({ status: { $ne: 1 } })
      .sort({ _id: -1 })
      .limit(8);
      
 
    res.render("home", { session,product: productData,category:categoryData,message,msg,wallet });
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


const loadSearch = async(Req,res) => {
  try {
    const categoryData = await Category.find();
    const brandData = await Brand.find();
    res.render("404", { category: categoryData, brand: brandData });
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
    if (!cart || !session) {
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



  const removeFromWishlist = async (req, res) => {
    try {
      const productId = req.query.id;
      
      const session = req.session.user_id;
      const user = await User.findById({ _id:session });
      console.log(user);
      user.wishlist.pull(productId);
      await user.save();
      res.redirect('/wishlist')
    } catch (error) {
      console.log(error);
    }
  };
/////////////////////////////////Checkout/////////////////////////////////////

const loadCheckOut = async(req,res) => {
  if(req.session.user_id){
   
  const cart = await Cart.findOne({ userId: req.session.user_id });
  if(!cart){
    res.redirect('/cart')
  }
  try {
    let totalPrice = 0;
    let session = req.session.user_id;
    const userDetails = await User.findById({_id:session});
    
    const userAddress = userDetails.address;
    const cart = await Cart.findOne({ userId: session }).populate("item.product");
    
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
res.redirect('/login')
message="Login With your account to access this page"
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
    const Total = req.body.totalPrice;
     const user = await User.findOne({ _id: session });

     wallet = user.wallet;
    console.log(Total);
    res.render("paymentPage",{Total,session,msg,wallet});
  } catch (error) {
    console.log(error);
  }
};



const orderConfirm = async(req,res) => {
  try {
    const session = req.body.user_id;
    const payment = req.body;
    console.log(payment);
    paymentType = payment.flexRadioDefault;
    console.log(paymentType);

    if (payment.flexRadioDefault == "COD") {
      orderStatus = 1;

      res.redirect("/orderDetails");
    } else if (payment.flexRadioDefault == "online") {
      orderStatus = 1;
       const create_payment_json = {
         intent: "sale",
         payer: {
           payment_method: "paypal",
         },
         redirect_urls: {
           return_url: "http://localhost:1212/success",
           cancel_url: "http://localhost:1212/checkout",
         },
         transactions: [
           {
             item_list: {
               items: [
                 {
                   name: "Redhock Bar Soap",
                   sku: "001",
                   price: "25.00",
                   currency: "USD",
                   quantity: 1,
                 },
               ],
             },
             amount: {
               currency: "USD",
               total: "25.00",
             },
             description: "Washing Bar soap",
           },
         ],
       };

       paypal.payment.create(create_payment_json, function (error, payment) {
         if (error) {
           throw error;
         } else {
           for (let i = 0; i < payment.links.length; i++) {
             if (payment.links[i].rel === "approval_url") {
               res.redirect(payment.links[i].href);
             }
           }
         }
       });
     
    }else if (payment.flexRadioDefault == "wallet") {
      console.log(req.session.user_id);
      const user = await User.findById({ _id: req.session.user_id });
      console.log(user.wallet);
      const cart = await Cart.findOne({ userId: req.session.user_id });
      console.log(cart.totalPrice);
      if(user.wallet >= cart.totalPrice){
         orderStatus = 1;
        await User.updateOne(
          { _id: req.session.user_id },
          { $inc: { wallet: -cart.totalPrice } }
        );
         res.redirect("/orderDetails");
      }else{
        res.send('fail')
      }
    } else {
      res.send("error");
    }
    
  } catch (error) {
    console.log(error);
  }
}


const confirmPayment = async (req, res) => {
 const payerId = req.query.PayerID;
 const paymentId = req.query.paymentId;

 const execute_payment_json = {
   payer_id: payerId,
   transactions: [
     {
       amount: {
         currency: "USD",
         total: "25.00",
       },
     },
   ],
 };


 paypal.payment.execute(
   paymentId,
   execute_payment_json,
   function (error, payment) {

     if (error) {
       console.log(error.response);
       throw error;
     } else {
       console.log(JSON.stringify(payment));
       res.redirect("/orderDetails");
     }
   }
 );
};

 

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
      console.log('hadhashd');
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
        start_date: Date.now(),
        totalPrice: cart.totalPrice,
        orderCount: latestOrder ? latestOrder.orderCount + 1 : 1,
        order_date: new Date().toLocaleDateString("en-GB"),
        paymentType: paymentType,
      });

      await order.save();
      console.log("prrrr");


      const orderData = await Orders.findOne({ userId: session }).sort({_id:-1}).populate("item.product");
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
    res.render("orderPage", { userData, session, message, orders });
  } catch (error) {
    console.log(error);
  }
};



const cancelOrder =  async(req,res) => {
  try {
    const id = req.query.orderId;
    session = req.session.user_id;
    console.log(id);
    const orderDetails = await Orders.updateOne({_id:id},{$set:{user_cancelled:true}});
     const orderData = await Orders.findOne({ userId: session })
       .sort({ _id: -1 })
       .populate("item.product");
     console.log("ssss");
     orderData.item.forEach(async (item) => {
       const productid = item.product._id;
       const increaseQuantity = item.quantity;
       console.log("kkkkk");
       await Product.updateOne(
         { _id: productid },
         { $inc: { quantity: increaseQuantity } }
       );
     });
     console.log(orderData);
     console.log(orderData.paymentType);
     if (
       orderData.paymentType === "online" ||
       orderData.paymentType === "wallet"
     ) {
       increaseAmount = orderData.totalPrice;
       console.log(increaseAmount);
       await User.updateOne(
         { _id: session },
         { $inc: { wallet: increaseAmount } }
       );
     }
    res.redirect('/orderDetails')
    
  } catch (error) {
    console.log(error);
  }
}


const fullOrder = async (req,res) => {
  try {
    const id = req.query.orderId;
    const session = req.session.user_id;
    const orderData = await Orders.findOne({_id:id}).populate('item.product');
    if(id){
    res.render('orderDetails',{orders:orderData,session})
    }else{
      res.redirect('/orders')
    }
  } catch (error) {
    console.log(error);
  }
}


const returnOrder = async (req,res) => {
  try {
   const id = req.query.orderId;
   const session = req.session.user_id;
   console.log(id,session);
   const orderDetails = await Orders.findById({_id:id});
   increaseAmount = orderDetails.totalPrice;
   
   await Orders.findByIdAndUpdate({ _id: id }, { $set: { is_returned :1} });
   
   const ans = await User.updateOne(
     { _id: session },
     { $inc: { wallet: increaseAmount } }
   );
   res.redirect('/orders')
  } catch (error) {
    console.log(error);
  }
}


const applyCoupon = async (req,res) => {
  try { 
     let code = req.body.coupon;
    
     console.log(req.body);
    console.log("helloooo");
    console.log(code);
    console.log("helloooo");
    req.session.coupon=code
    console.log(req.session.coupon);
    if (req.session.user_id) {
      let session = req.session.user_id;
      const userId = await User.findOne({ _id: session }, {});

      let coupons = await Coupon.findOne({
        couponCode: code,
        status: 0,
      }).lean();
      console.log(coupons);
      if (coupons != null) {
        let today = new Date();
        console.log(today, coupons.endDate);
        if (coupons.endDate > today) {
          let userfind = await Coupon.findOne(
            { couponId: code, user: userId._id },
            {}
          ).lean();
          console.log(session);
            const cart = await Cart.findOne({userId:session},{totalPrice:1});
            console.log(cart);
            
          let userID = userId._id;
          console.log(userID);
          if (userfind == null) {
            let discount = 10
          
            
            const discountPrice = Math.min(
              coupons.maxDiscount,
              (cart.totalPrice * discount) / 100
            );
            console.log(discountPrice);
            cart.totalPrice = cart.totalPrice - discountPrice;
            amount = cart.totalPrice;
            
            ///////////////////////////////////////////
            //////////////////////////////////////////////////////////
            await userId.save();
            await Coupon.findOneAndUpdate(
              { couponId: code },
              { $push: { user: userId._id } }
            );
            res.json({ status: true, discountPrice,amount });
            
          } else {
            res.json({ used: true });
            console.log("useddd");
          }
        } else {
          res.json({ expired: true });
        }
      } else {
        res.json({ noMatch: true });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
   res.redirect('/SomeThingWentWrong')
  }
}


/////////////////////////////////Logout///////////////////////////////////////////

const userLogout = async (req, res) => {
  try {
    req.session.user_id = null;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const ok = async (req, res) => {
  let {
    page = 1,
    search,
    category,
    brand,
    sort,
    minPrice,
    maxPrice,
  } = req.query;
  
  console.log(req.query);
  const limit = 4;

  const searchCondition = search
    ? {
        productName: {
          $regex: search,
          $options: "i",
        },
      }
    : {};
  const filterCondition = {
    ...searchCondition,
    ...(category
      ? {
          category: mongoose.Types.ObjectId(category),
        }
      : {}),
    ...(brand
      ? {
          brand: mongoose.Types.ObjectId(brand),
        }
      : {}),
    ...(minPrice && maxPrice
      ? {
          price: {
            $gte: minPrice,
            $lte: maxPrice,
          },
        }
      : minPrice
      ? {
          price: {
            $gte: minPrice,
          },
        }
      : maxPrice
      ? {
          price: {
            $lte: maxPrice,
          },
        }
      : {}),
  };  const sortCondition =
    sort === "low-to-high"
      ? { price: 1 }
      : sort === "high-to-low"
      ? { price: -1 }
      : {};

  try {
    const products = await Product.find(filterCondition)
      .sort(sortCondition)
      .skip((page - 1) * limit)
      .limit(limit * 1);
    const count = await Product.find(filterCondition).countDocuments();
    const totalPage = Math.ceil(count / limit);

    res.send({
      products,
      count,
      totalPage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};





module.exports = {
  ok,
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  resendOTP,
  loadHome,
  loadSearch,
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
  cancelOrder,
  fullOrder,
  returnOrder,
  confirmPayment,
  removeFromWishlist,
  applyCoupon,
};
