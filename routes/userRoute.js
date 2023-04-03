const express = require("express");
const user_route = express();

const session = require("express-session");

const blocked  = require('../middleware/blocked');

const auth = require("../middleware/auth");

user_route.set("views", "./views/users");

const userController = require("../controllers/userController");

const couponController = require('../controllers/couponController')

user_route.get("/signup", auth.isLogout,blocked.isBlocked, userController.loadRegister);

user_route.post("/signup",auth.isLogout,blocked.isBlocked,userController.insertUser);

user_route.get("/login",auth.isLogout,blocked.isBlocked,userController.loginLoad);

user_route.post("/login",auth.isLogout,blocked.isBlocked,userController.verifyLogin);

user_route.get("/", blocked.isBlocked, userController.loadHome);

user_route.get("/logout",auth.isLogin,userController.userLogout);

user_route.post("/verifyOtp", userController.otpVerify);

user_route.post("/resendOTp", userController.resendOTP);

user_route.get("/resetPassword", userController.resetPassword);

user_route.post("/resetPassword", userController.sendReset);

user_route.post("/verifyReset", userController.verifyReset);

user_route.get("/profile", blocked.isBlocked, userController.profileLoad);

user_route.get("/editProfile", blocked.isBlocked, userController.profileEditLoad);

user_route.post("/editProfile",blocked.isBlocked,userController.updateProfile);

user_route.get("/shop", blocked.isBlocked, userController.loadShop);

user_route.get("/productShop", blocked.isBlocked, userController.productShop);

user_route.post("/productShop", blocked.isBlocked, userController.addReview);

user_route.get("/cart", blocked.isBlocked, userController.loadCart);

user_route.get('/addToCart',blocked.isBlocked,userController.addToCart );

user_route.post('/incrementCart',blocked.isBlocked,userController.incrementCart);

user_route.post("/decrementCart",blocked.isBlocked, userController.decrementCart);

user_route.post("/removeCart", blocked.isBlocked, userController.removeCart);

user_route.get("/wishlist", blocked.isBlocked, userController.loadWishlist);

user_route.get("/addToWishlist", blocked.isBlocked, userController.addToWishlist);

user_route.get('/checkout',blocked.isBlocked,userController.loadCheckOut);

user_route.get("/addAddress", blocked.isBlocked, userController.addressPage);

user_route.post("/addAddress", blocked.isBlocked, userController.addAddress);

user_route.get("/editAddress", blocked.isBlocked, userController.editAddressLoad);

user_route.post("/editAddress", blocked.isBlocked, userController.editAddress);

user_route.get("/deleteAddress",blocked.isBlocked,userController.deleteAddress);

user_route.post('/shop',blocked.isBlocked,userController.filterPrice);

user_route.post("/paymentPage", blocked.isBlocked, userController.loadPaymentPage);

user_route.get("/orderConfirmation",blocked.isBlocked,userController.orderDetails);

user_route.post("/orderConfirm",blocked.isBlocked,userController.orderConfirm);

user_route.get("/cancelOrder",blocked.isBlocked,userController.cancelOrder);

user_route.get("/orderDetails", blocked.isBlocked, userController.fullOrder);

user_route.get('/returnOrder',blocked.isBlocked,userController.returnOrder);

user_route.get("/success",blocked.isBlocked,userController.confirmPayment);

user_route.get("/removeFromWishlist",blocked.isBlocked,userController.removeFromWishlist);

user_route.post("/checkCoupon", blocked.isBlocked, userController.applyCoupon);

user_route.post("/shopFilter", blocked.isBlocked, userController.productFilter);

user_route.get("/orders",auth.isLogin, blocked.isBlocked, userController.orderData);

user_route.get("/razorpayPayment", userController.razorpayConfirm);

// user_route.get('*',userController.notFound)


module.exports = user_route;
