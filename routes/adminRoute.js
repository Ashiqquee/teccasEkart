const express = require("express");

const admin_route = express();

const session = require("express-session");

const multerConfig = require('../config/multer');

const upload = multerConfig.createMulter();

const path = require("path");



admin_route.set("views", "./views/admin");

const auth = require("../middleware/adminAuth");

const adminController = require("../controllers/adminController");

admin_route.use(express.static('public'));



///////////////////////Login Route////////////////////////////



admin_route.get("/", auth.isLogout, adminController.loadLogin);

admin_route.post("/", auth.isLogout, adminController.verifyLogin);



///////////////////////Home  Route////////////////////////////


admin_route.get("/home", auth.isLogin, adminController.loadDashboard);


///////////////////////User Controll  Route////////////////////



admin_route.get("/dashboard", auth.isLogin, adminController.adminDashboard);



admin_route.get("/blockUser", auth.isLogin, adminController.blockUser);

admin_route.get("/unBlockUser", auth.isLogin, adminController.unBlockUser);


///////////////////////Coupon Controll  Route////////////////////



admin_route.get("/coupon-dashboard", auth.isLogin, adminController.couponDashboard);

admin_route.get("/coupon-details", auth.isLogin, adminController.couponDetails);

admin_route.get("/new-coupon",auth.isLogin, adminController.newCoupon);

admin_route.post("/new-coupon", auth.isLogin, adminController.addCoupon);

admin_route.get("/delete-coupon", auth.isLogin, adminController.deleteCoupon);

admin_route.get("/blockCoupon", auth.isLogin, adminController.blockCoupon);

admin_route.get("/unBlockCoupon", auth.isLogin, adminController.unBlockCoupon);

admin_route.get("/edit-coupon", auth.isLogin, adminController.editCouponLoad);

admin_route.post("/edit-coupon", auth.isLogin, adminController.updateCoupon);



///////////////////////Category Controll  Route////////////////////



admin_route.get("/category-dashboard", auth.isLogin,adminController.categoryDashboard);

// admin_route.get("/deleteCategory",auth.isLogin, adminController.deleteCatogery);

admin_route.get("/edit-category",auth.isLogin,adminController.editCategoryLoad);

admin_route.post("/edit-category",auth.isLogin,adminController.updateCategory);

admin_route.get("/new-category",auth.isLogin, adminController.newCategory);

admin_route.post("/new-category", auth.isLogin, adminController.addCategory);




///////////////////////Product Controll  Route////////////////////


admin_route.get("/product-dashboard", auth.isLogin,adminController.productDashboard);

admin_route.get("/addProduct", auth.isLogin, adminController.addProduct);

admin_route.post("/addProduct",upload.array("file",5),auth.isLogin,adminController.insertProduct);

admin_route.get("/product-details", auth.isLogin, adminController.productDetails);

admin_route.get("/blockProduct",auth.isLogin,adminController.blockProduct);

admin_route.get("/unBlockProduct",auth.isLogin,adminController.unBlockProduct);

admin_route.get("/edit-product", auth.isLogin, adminController.editProductLoad);

admin_route.post("/edit-product",upload.array("file",5), auth.isLogin, adminController.updateProduct);

admin_route.get("/deletImage",auth.isLogin,adminController.deleteImage);




///////////////////////Brand Controll  Route////////////////////


admin_route.get("/brand-dashboard",auth.isLogin,adminController.brandDashboard);

admin_route.get("/new-brand", auth.isLogin, adminController.newBrand);

admin_route.post("/new-brand", auth.isLogin, adminController.addBrand);

admin_route.get("/edit-brand", auth.isLogin, adminController.editBrandLoad);

admin_route.post("/edit-brand", auth.isLogin, adminController.updateBrand);

admin_route.get("/order-dashboard", auth.isLogin, adminController.orderLoad);

///////////////////////Special Route////////////////////


admin_route.get("/cancelOrder",auth.isLogin,adminController.cancelOrder);

admin_route.get("/orderStatus",auth.isLogin,adminController.orderDelivered);




admin_route.get("/logout", auth.isLogin, adminController.logout);




admin_route.get("*", function (req, res) {
  res.redirect("/admin");
});




module.exports = admin_route;
