const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const Cart = require("../models/cartModel");
const Orders = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const Banner = require("../models/bannerModel");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
require("dotenv").config();

const { update } = require("../models/userModel");
const paypal = require("paypal-rest-sdk");
paypal.configure({
  mode: "sandbox",
  client_id: process.env.client_id,
  client_secret: process.env.client_secret,
});
const Razorpay = require("razorpay");
const instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

const accountsid = process.env.TWILIO_ACCOUNT_SID;
const authtoken = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(accountsid, authtoken);

let msg;
let message;
let index;
let orderStatus = 0;
let paymentType;

const loadRegister = async (req, res) => {
  try {
    res.render("signup", { msg, message });
    msg = null;
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
    const { mno } = req.body;

    const existingNumber = await User.findOne({ mobile: mno });
    if (existingNumber) {
      redirect("/signup");
      msg = "Mobile already registered";
    }

    req.session.phone = mno;
    try {
      const verification = await client.verify
        .v2.services(TWILIO_SERVICE_SID)
        .verifications.create({ to: `+91${mno}`, channel: "sms" });
      console.log(mno);
      res.render("verifySignup");
    } catch (err) {
      console.error(err);
      res.redirect("/signup");
      message = "Failed to send Otp ";
    }
  } catch (error) {
    console.error(error);
    res.redirect("/signup");
    message = "Error";
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
  password = req.body.password;
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
          mobile: phone,
          password: spassword,
        });
        const userData = user.save();
        if (userData) {
          res.redirect("/login");
          msg = "verification success,now login with your account";
        }
      } else {
        res.render("verifySignup", { msg: "Otp incorrect" });
      }
    })

    .catch((error) => {
      console.log(error);
    });
};

const loginLoad = async (req, res) => {
  try {
    res.render("login", { msg, message });
    msg = null;
    message = null;
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    console.log(mobile, password);

    const userData = await User.findOne({ mobile: mobile });

    if (!userData) {
      return res.render("login", {
        message: "Please provide your correct Mobile and password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.render("login", { message: "Mobile or Password incorrect" });
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
    const categoryData = await Category.find();
    const banner = await Banner.find();
    
    let wallet;
    let user;
    if (session) {
      user = await User.findOne({ _id: session });

      wallet = user.wallet;
    }

    const productData = await Product.find({ status: { $ne: 1 } })
      .sort({ _id: -1 })
      .limit(8);

    res.render("home", {
      session,
      product: productData,
      category: categoryData,
      message,
      msg,
      wallet,
      user,
      banner,
    });
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

      res.render("changePassword");
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
      res.render("resetPassword", { msg: "This Number is Not Registered" });
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
    const verification_check = await client.verify.v2
      .services(TWILIO_SERVICE_SID)
      .verificationChecks.create({ to: `+91${phone}`, code: otp });

    if (verification_check.status === "approved") {
      const spassword = await securePassword(req.body.password);
      // await  User.updateOne({mobile:phone},{$set:{is_verified:1}})
      await User.updateOne(
        { mobile: phone },
        { $set: { password: spassword } }
      );

      req.session.otpcorrect = true;
      res.redirect("/login");
      msg = "Verfied Succesfully,Login with account";
    } else {
      res.render("changePassword", { msg: "Incorrect Otp" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while verifying OTP.");
  }
};

///////////////////////////////Profile Managment//////////////////////////////////

const profileLoad = async (req, res) => {
  try {
    const session = req.session.user_id;

    if (req.session.user_id) {
      const userData = await User.findOne({ _id: session });
      const wallet = userData.wallet
      const orders = await Orders.find({ userId: session });
      res.render("profile", { user: userData, session, orders, wallet });
    } else {
      message = "Login with your account to access this page";
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const profileEditLoad = async (req, res) => {
  try {
    session = req.session.user_id;
    let user = await User.findById({ _id: session });
    res.render("editProfile", { user, session });
  } catch (error) {
    console.log(error);
  }
};

const updateProfile = async (req, res) => {
  try {
    session = req.session.user_id;

    await User.updateOne(
      { _id: session },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
        },
      }
    );
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
  }
};

/////////////////////////////////Shop///////////////////////////////////////////

const loadShop = async (req, res) => {
  try {
    const session = req.session.user_id;
    let page = req.query.page || 1;
    const productData = await Product.find({ status: { $ne: 1 } })
      .sort({
        _id: -1,
      })
      .limit(6)
      .skip((page - 1) * 6)
      .exec();
    const count = await Product.find({ status: { $ne: 1 } })
      .sort({
        _id: -1,
      })
      .countDocuments();
    const categoryData = await Category.find();
    const brandData = await Brand.find();

    if (session) {
    }
    const userData = await User.findOne({ _id: session });
    res.render("shop", {
      session,
      product: productData,
      category: categoryData,
      brand: brandData,
      message,
      user: userData,
      totalPages: Math.ceil(count / 6),
    });
    message = null;
  } catch (error) {
    console.log(error);
  }
};

const loadSearch = async (Req, res) => {
  try {
    const categoryData = await Category.find();
    const brandData = await Brand.find();
    res.render("404", { category: categoryData, brand: brandData });
  } catch (error) {
    console.log(error);
  }
};

const productShop = async (req, res) => {
  try {
    const session = req.session.user_id;
    const id = req.query.id;
    const productData = await Product.findOne({ _id: new Object(id) })
      .populate("category")
      .populate("brand");

    const user = await User.findOne({ _id: session });

    const order = await Orders.findOne({
      userId: session,
      "item.product": id,
    });
    const hasPurchasedProduct = !!order;
    const featured = await Product.find({ category: productData.category })
      .sort({ id: -1 })
      .limit(5);
    res.render("productShop", {
      product: productData,
      session,
      message,
      featured,
      user,
      hasPurchasedProduct,
    });
    message = null;
  } catch (error) {
    console.log(error);
  }
};


/////////////////////////////////Cart///////////////////////////////////////////

const loadCart = async (req, res) => {
  try {
    let totalPrice = 0;
    session = req.session.user_id;
    const cart = await Cart.findOne({ userId: session }).populate(
      "item.product"
    );
    if (!cart || !session) {
      res.render("cart", { items: [], totalPrice, session });
    }

    if (cart && cart.item != null) {
      cart.item.forEach((value) => {
        totalPrice += value.price * value.quantity;
      });
    }
    await Cart.updateOne(
      { userId: session },
      { $set: { totalPrice: totalPrice } }
    );

    const items = cart.item;
    res.render("cart", { items, session, totalPrice, msg });
  } catch (err) {
    console.error(err);
  }
};

const addToCart = async (req, res) => {
  try {
    if (req.session.user_id) {
      const productId = req.query.id;
      const userId = req.session.user_id;

      const product = await Product.findOne({ _id: productId });
      const userCart = await Cart.findOne({ userId: userId });

      if (product.quantity < 1) {
        return res.status(200).json({
          message: "Sorry,Out of Stock",
        });
      }
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
      
      res.redirect('/cart');
    } else {
      res.redirect("/login");
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
        const updatedItem = updatedCartCount.item.find(
          (item) => item._id.toString() === itemId
        );
        const updatedPrice = (updatedItem.price * updatedItem.quantity).toFixed(
          2
        );
        let total = 0;
        updatedCartCount.item.forEach((value) => {
          total += value.price * value.quantity
        })
        console.log(total);
        await Cart.updateOne({ userId: userId }, { $set: { totalPrice: total } })
        totalPrice = total;
        
        res.json({ success: true, updatedPrice,totalPrice });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const decrementCart = async (req, res) => {


  try {
    const userId = req.session.user_id;
    const itemid = req.body.itemId;
    let totalPrice;
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
        const updatedCart = await Cart.findOne({ userId: userId });
       
        let total=0;
        updatedCart.item.forEach((value) => {
          total += value.price * value.quantity
        })
        console.log(total);
        await Cart.updateOne({userId:userId},{$set:{totalPrice:total}})
         totalPrice = total;
        const updatedItem = updatedCart.item.find(
          (item) => item._id.toString() === itemid
        );
        const updatedPrice = (updatedItem.price * updatedItem.quantity).toFixed(
          2
        );
        res.json({ success: true, totalPrice, updatedPrice });
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

    const items = await Product.find({ _id: { $in: wishlist.wishlist } })
      .populate("brand")
      .populate("category");

    res.render("wishlist", { items, session });
  } catch (error) {
    console.log(error);
  }
};

const addToWishlist = async (req, res) => {
  if (req.session.user_id) {
    const productId = req.query.id;
    const userId = req.session.user_id;
    try {
      const user = await User.findById(userId);
      if (user.wishlist.includes(productId)) {
        res.redirect("/wishlist");
      }

      user.wishlist.push(productId);
      await user.save();
      res.redirect("/wishlist");
      // return res.status(200).json({ message: "Product added to wishlist" });

      // const referer = req.headers.referer || "/";
      // res.redirect(referer);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  } else {
    res.redirect("/login");
    message = "Login with your account to access this page";
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const productId = req.query.id;

    const session = req.session.user_id;
    const user = await User.findById({ _id: session });

    user.wishlist.pull(productId);
    await user.save();
    res.redirect("/wishlist");
  } catch (error) {
    console.log(error);
  }
};

/////////////////////////////////Checkout/////////////////////////////////////

const loadCheckOut = async (req, res) => {
  if (req.session.user_id) {
    const cart = await Cart.findOne({ userId: req.session.user_id });
    if (!cart) {
      res.redirect("/cart");
    }
    try {
      let totalPrice = 0;
      let session = req.session.user_id;
      const userDetails = await User.findById({ _id: session });

      const userAddress = userDetails.address;
      const cart = await Cart.findOne({ userId: session }).populate(
        "item.product"
      );
      const wallet = userDetails.wallet
      const items = cart.item;
      if (cart && cart.item != null) {
        cart.item.forEach((value) => {
          totalPrice += value.price * value.quantity;
        });
      }

      res.render("checkout", {
        session,
        userAddress,
        msg,
        items,
        totalPrice,
        items,
        wallet
      });
      msg = null;
    } catch (error) {
      console.log(error);
    }
  } else {
    res.redirect("/login");
    message = "Login With your account to access this page";
  }
};

///////////////////Address Management./////////////////////

const addressPage = async (req, res) => {
  try {
    session = req.session.user_id;
    res.render("address", { session, message, msg });
    message = null;
    msg = null;
  } catch (error) {
    console.log(error);
  }
};

const addAddress = async (req, res) => {
  try {
    const id = req.session.user_id;
    const user = await User.find({ _id: id });
    const data = req.body;
    if (
      (data.address,
        data.city,
        data.district,
        data.state,
        data.zip,
        data.name,
        data.mobile,
        data.email)
    ) {
      const userData = await User.findOne({ _id: new Object(id) });
      userData.address.push(data);
      await userData.save();

      res.redirect("/addAddress");
      msg = "Address added success fully";
    } else {
      res.redirect("/addAddress");
      message = "Please fill all the forms";
    }
  } catch (error) {
    console.log(error);
  }
};

const editAddressLoad = async (req, res) => {
  try {
    const session = req.session.user_id;
    const index = req.query.index;

    const findUser = await User.findById({ _id: session });
    const address = findUser.address[index];
    if (session === undefined) {
      res.redirect("/login");
      message = "Login with your account";
    }

    res.render("editAddress", { session, address, index, message, msg });
    message = null;
    msg = null;
  } catch (error) {
    console.log(error);
  }
};

const editAddress = async (req, res) => {
  try {
    const id = req.session.user_id;
    const user = await User.find({ _id: id });
    const index = req.query.index;
    const data = req.body;
    if (id === undefined) {
      res.redirect("/login");
      message = "Login with your account";
    }
    const key = `address.${index}`;
    if (
      (data.address,
        data.city,
        data.district,
        data.state,
        data.zip,
        data.name,
        data.mobile,
        data.email)
    ) {
      const editAddress = {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        city: data.city,
        address: data.address,
        district: data.district,
        state: data.state,
        zip: data.zip,
      };
      const updatedAddress = await User.updateOne(
        { _id: id },
        { $set: { [key]: editAddress } }
      );
      if (updatedAddress) {
        res.redirect("/editAddress?index=" + index);
        msg = "Address Updated successfully";
      } else {
        res.redirect("/checkout");
        message = "Error";
      }
    } else {
      res.redirect("/editAddress?index=" + index);
      message = "Please fill all the forms";
    }
  } catch (error) {
    console.log(error);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const session = req.session.user_id;
    const index = req.query.index;
    const deletedAddress = await User.updateOne(
      { _id: session },
      { $unset: { [`address.${index}`]: "" } }
    );
    await User.updateOne({ _id: session }, { $pull: { address: null } });


    res.redirect("/checkout");
  } catch (error) {
    console.log(error);
  }
};

////////////////Order Managemnet///////////////////////

loadPaymentPage = async (req, res) => {
  try {
   
    index = req.body.address;
    if (!index) {
      res.redirect('/addAddress')
    }
    let session = req.session.user_id;
    const Total = req.body.totalPrice;
    req.session.total = Total;
    const user = await User.findOne({ _id: session });

    wallet = user.wallet;

    if (req.body.flexRadioDefault === "wallet") {
      if (wallet >= Total) {
        const ok = await User.updateOne(
          { _id: session },
          { $inc: { wallet: -Total } }
        );

        paymentType = req.body.flexRadioDefault;

        if (wallet >= Total) {

          orderStatus = 1;

          res.redirect("/orderConfirmation");
        }
      }

    }
    if (req.body.flexRadioDefault === "wallet") {
      req.session.ok = Total - wallet;
      req.session.wallet = wallet;
      res.render("paymentPage", { Total, session, msg, wallet });
    } else {
      let wallet = 0;
      req.session.wallet = null;
      req.session.ok = Total;
      res.render("paymentPage", { Total, session, msg, wallet });
    }
  } catch (error) {
    console.log(error);
  }
};

const orderConfirm = async (req, res) => {
  try {
    const payment = req.body;

    paymentType = payment.flexRadioDefault;


    if (payment.flexRadioDefault == "COD") {
      orderStatus = 1;

      res.redirect("/orderConfirmation");
    } else if (payment.flexRadioDefault == "online") {
      const currencyMap = {
        840: "USD",
        978: "EUR",
        826: "GBP",
      };
      const currencyCode = currencyMap["840"];

      const amount = {
        currency: currencyCode,
        total: req.session.ok,
      };

      
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
            amount,
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
    }
  } catch (error) {
    console.log(error);
  }
};

const confirmPayment = async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: req.session.ok,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    async function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        console.log(JSON.stringify(payment));

        orderStatus = 1;
        res.redirect("/orderConfirmation");
      }
    }
  );
};

const razorpayConfirm = async (req, res) => {
  try {

    var options = {
      amount: req.session.ok * 100,
      currency: "INR",
      receipt: "order_rcptid_11qsasdasdasd",
    };
    const order = await instance.orders.create(options);

    res.json({ order });
  } catch (error) { }
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
    let decreasingAmount = req.session.wallet;
    await User.updateOne(
      { _id: session },
      { $inc: { wallet: -decreasingAmount } }
    );


    if (orderStatus === 1) {

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
        totalPrice: req.session.total,
        orderCount: latestOrder ? latestOrder.orderCount + 1 : 1,
        order_date: new Date().toLocaleDateString("en-GB"),
        paymentType: paymentType,
      });

      await order.save();


      const orderData = await Orders.findOne({ userId: session })
        .sort({ _id: -1 })
        .populate("item.product");

      orderData.item.forEach(async (item) => {
        const productid = item.product._id;
        const decreaseQuantity = item.quantity;

        await Product.updateOne(
          { _id: productid },
          { $inc: { quantity: -decreaseQuantity } }
        );
      });

      await Cart.deleteMany({ userId: session });

      orderStatus = 0;
    }


    const orders = await Orders.findOne({ userId: session })
      .sort({ _id: -1 })
      .limit(1)
      .populate("item.product");

    res.render("orderConfirmation", { orders, session, msg });
  } catch (error) {
    console.log(error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const id = req.query.orderId;
    session = req.session.user_id;

    const orderDetails = await Orders.updateOne(
      { _id: id },
      { $set: { user_cancelled: true } }
    );
    const orderData = await Orders.findOne({ userId: session })
      .sort({ _id: -1 })
      .populate("item.product");

    orderData.item.forEach(async (item) => {
      const productid = item.product._id;
      const increaseQuantity = item.quantity;

      await Product.updateOne(
        { _id: productid },
        { $inc: { quantity: increaseQuantity } }
      );
    });

    if (
      orderData.paymentType === "online" ||
      orderData.paymentType === "wallet"
    ) {
      increaseAmount = orderData.totalPrice;

      await User.updateOne(
        { _id: session },
        { $inc: { wallet: increaseAmount } }
      );
    }
    res.redirect("/orderDetails");
  } catch (error) {
    console.log(error);
  }
};

const fullOrder = async (req, res) => {
  try {
    const id = req.query.orderId;
    const session = req.session.user_id;
    const orderData = await Orders.findOne({ _id: id }).populate(
      "item.product"
    );
    if (id) {
      res.render("orderDetails", { orders: orderData, session });
    } else {
      res.redirect("/orders");
    }
  } catch (error) {
    console.log(error);
  }
};

const returnOrder = async (req, res) => {
  try {
    const id = req.query.orderId;
    const session = req.session.user_id;

    const orderDetails = await Orders.findById({ _id: id });
    increaseAmount = orderDetails.totalPrice;

    await Orders.findByIdAndUpdate({ _id: id }, { $set: { is_returned: 1 } });

    const ans = await User.updateOne(
      { _id: session },
      { $inc: { wallet: increaseAmount } }
    );
    res.redirect("/orders");
  } catch (error) {
    console.log(error);
  }
};

////////////////Apply Coupon /////////////////////////////

const applyCoupon = async (req, res) => {
  try {
    let code = req.body.coupon;
    const session = req.session.user_id;
    const cart = await Cart.findOne({ userId: session });
    req.session.coupon = code;

    if (req.session.user_id) {
      let session = req.session.user_id;
      const userId = await User.findOne({ _id: session });

      let coupons = await Coupon.findOne({
        couponCode: code,
        status: 0,
      }).lean();

      if (coupons != null) {
        if (cart.totalPrice > coupons.minAmount) {
          let today = new Date();
          console.log(code);
          if (coupons.endDate > today) {
            let userfind = await Coupon.findOne(
              { couponCode: code, user: userId._id },
              {}
            ).lean();


            const cart = await Cart.findOne(
              { userId: req.session.user_id },
              { totalPrice: 1 }
            );

            let userID = userId._id;

            if (userfind == null) {
              let discount = 10;

              const discountPrice = Math.min(
                coupons.maxDiscount,
                (cart.totalPrice * discount) / 100
              );


              amount = cart.totalPrice - discountPrice;

              await userId.save();
              await Coupon.findOneAndUpdate(
                { couponCode: code },
                { $push: { user: userId._id } }
              );
              res.json({ status: true, discountPrice, amount });
            } else {
              res.json({ used: true });

            }
          } else {
            res.json({ expired: true });
          }
        } else {
          res.json({ lowPrice: true });
        }
      } else {
        res.json({ noMatch: true });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

////////////////////////Logout/////////////////////////////////
const userLogout = async (req, res) => {
  try {
    req.session.user_id = null;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const productFilter = async (req, res) => {
  try {
    let product;
    let products = [];
    let Categorys;
    let Data = [];
    let Datas = [];

    const { categorys, search, brands, filterprice } = req.body;


    if (!search) {
      if (filterprice != 0) {
        if (filterprice.length == 2) {
          product = await Product.find({
            status: 0,
            $and: [
              { price: { $lte: Number(filterprice[1]) } },
              { price: { $gte: Number(filterprice[0]) } },
            ],
          })
            .populate("category")
            .populate("brand");
        } else {
          product = await Product.find({
            status: 0,
            $and: [{ price: { $gte: Number(filterprice[0]) } }],
          })
            .populate("category")
            .populate("brand");
        }
      } else {
        product = await Product.find({ status: 0 })
          .populate("category")
          .populate("brand");
      }
    } else {
      if (filterprice != 0) {
        if (filterprice.length == 2) {
          product = await Product.find({
            status: 0,
            $and: [
              { price: { $lte: Number(filterprice[1]) } },
              { price: { $gte: Number(filterprice[0]) } },
              {
                $or: [
                  {
                    productName: {
                      $regex: ".*" + search + ".*",
                      $options: "i",
                    },
                  },
                ],
              },
            ],
          })
            .populate("category")
            .populate("brand");
        } else {
          product = await Product.find({
            status: 0,
            $and: [
              { price: { $gte: Number(filterprice[0]) } },
              {
                $or: [
                  {
                    productName: {
                      $regex: ".*" + search + ".*",
                      $options: "i",
                    },
                  },
                ],
              },
            ],
          })
            .populate("category")
            .populate("brand");
        }
      } else {
        product = await Product.find({
          status: 0,
          $or: [
            { productName: { $regex: ".*" + search + ".*", $options: "i" } },
          ],
        })
          .populate("category")
          .populate("brand");
      }
    }

    Categorys = categorys.filter((value) => {
      return value !== null;
    });

    if (Categorys[0]) {
      Categorys.forEach((element, i) => {
        products[i] = product.filter((value) => {
          return value.category.name == element;
        });
      });

      products.forEach((value, i) => {
        Data[i] = value.filter((v) => {
          return v;
        });
      });

      if (brands[0]) {
        brands.forEach((value, i) => {
          Data.forEach((element) => {
            Datas[i] = element.filter((product) => {
              return product.brand.brandName == value;
            });
          });
        });
      }
      Datas.forEach((value, i) => {
        Data[i] = value;
      });
    } else {
      if (brands[0]) {
        brands.forEach((value, i) => {
          Data[i] = product.filter((element) => {
            return element.brand.brandName == value;
          });
        });
      } else {
        Data[0] = product;
      }
    }
    console.log(Data);
    res.json({ Data });
  } catch (error) {
    console.log(error.message);
  }
};

const addReview = async (req, res) => {
  try {
    const session = req.session.user_id;
    const name = req.body.name;
    const review = req.body.message;
    const productId = req.query.id;
    if (!session) {
      res.redirect("/login");
      message = "Login with your account to access this page";
    }
    const user = await User.findById({ _id: session });
    const order = await Orders.findOne({
      userId: session,
      "item.product": productId,
    });

    if (!order) {
      return res.status(200).json({
        message:
          "You can't review this product,purchase this product and make review",
      });
    } else {
      console.log(productId);
      const product = await Product.findById({ _id: productId });

      if (!product.reviews) {
        product.reviews = [];
      }

      Product.findOneAndUpdate(
        { _id: productId },
        {
          $push: {
            review: {
              userName: name,
              message: review,
            },
          },
        },
        { new: true }
      )
        .then((updatedProduct) => {
          console.log("Product updated:", updatedProduct);
        })
        .catch((err) => {
          console.error("Error updating product:", err);
        });

      res.redirect("/productShop?id=" + productId);
    }
  } catch (error) {
    console.log(error);
  }
};

const orderData = async (req, res) => {
  try {
    const session = req.session.user_id;
    let page = req.query.page || 1;
    const orders = await Orders.find({ userId: session })
      .populate("item.product")
      .sort({
        _id: -1,
      })
      .limit(4)
      .skip((page - 1) * 4)
      .exec();
    console.log(orders);
    const count = await Orders.find({ userId: session })
      .populate("item.product")
      .sort({
        _id: -1,
      })
      .countDocuments();
    res.render("orderPage", {
      orders,
      session,
      totalPages: Math.ceil(count / 4),
    });
  } catch (error) {
    console.log(error);
  }
};

const notFound = async (req, res) => {
  try {
    res.render("404");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
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
  profileEditLoad,
  loadShop,
  productShop,
  addReview,
  loadCart,
  addToCart,
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
  deleteAddress,
  loadPaymentPage,
  orderDetails,
  orderConfirm,
  cancelOrder,
  fullOrder,
  returnOrder,
  confirmPayment,
  removeFromWishlist,
  applyCoupon,
  updateProfile,
  productFilter,
  razorpayConfirm,
  orderData,
  notFound,
};
