const express = require("express");
const user_route = express();

const session = require("express-session");

const blocked  = require('../middleware/blocked');

const auth = require("../middleware/auth");

user_route.set("views", "./views/users");

const userController = require("../controllers/userController");

user_route.get("/signup", auth.isLogout,blocked.isBlocked, userController.loadRegister);

user_route.post("/signup",auth.isLogout,blocked.isBlocked,userController.insertUser);

user_route.get("/login",auth.isLogout,blocked.isBlocked,userController.loginLoad);

user_route.post("/login",auth.isLogout,blocked.isBlocked,userController.verifyLogin);

user_route.get("/", blocked.isBlocked, userController.loadHome);

user_route.get("/logout",auth.isLogin,userController.userLogout);

user_route.post("/verifyOtp", userController.otpVerify);

user_route.get("/resetPassword", userController.resetPassword);

user_route.post("/resetPassword", userController.sendReset);

user_route.post("/verifyReset", userController.verifyReset);

user_route.get("/profile", blocked.isBlocked, userController.profileLoad);

user_route.get("/shop", blocked.isBlocked, userController.loadShop);

user_route.get("/productShop", blocked.isBlocked, userController.productShop);

user_route.get("/cart", blocked.isBlocked, userController.loadCart);

user_route.get('/addToCart',blocked.isBlocked,userController.addToCart );



module.exports = user_route;
