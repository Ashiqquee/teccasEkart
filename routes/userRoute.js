const express = require("express");
const user_route = express();

const session = require("express-session");


const auth = require("../middleware/auth");

user_route.set("views", "./views/users");

const userController = require("../controllers/userController");

user_route.get("/signup", auth.isLogout, userController.loadRegister);

user_route.post("/signup", userController.insertUser);

user_route.get("/login", auth.isLogout, userController.loginLoad);

user_route.post("/login", userController.verifyLogin);

user_route.get("/", userController.loadHome);

user_route.get("/logout", auth.isLogin, userController.userLogout);

user_route.post("/verifyOtp", userController.otpVerify);

user_route.get("/resetPassword", userController.resetPassword);

user_route.post("/resetPassword", userController.sendReset);

user_route.post("/verifyReset", userController.verifyReset);

user_route.get("/profile", userController.profileLoad);



module.exports = user_route;
