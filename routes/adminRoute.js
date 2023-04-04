const express = require("express");

const admin_route = express();

const session = require("express-session");

const multerConfig = require('../config/multer');

const upload = multerConfig.createMulter();

const path = require("path");



admin_route.set("views", "./views/admin");

const auth = require("../middleware/adminAuth");

const adminController = require("../controllers/adminController");

const couponController = require('../controllers/couponController');

const productController = require('../controllers/productController');

const orderController   = require('../controllers/orderController');

const bannerController = require("../controllers/bannerController");

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



admin_route.get("/coupon-dashboard",auth.isLogin,couponController.couponDashboard);

admin_route.get("/new-coupon", auth.isLogin, couponController.newCoupon);

admin_route.post("/new-coupon", auth.isLogin, couponController.addCoupon);

admin_route.get("/delete-coupon", auth.isLogin, couponController.deleteCoupon);

admin_route.get("/blockCoupon", auth.isLogin, couponController.blockCoupon);

admin_route.get("/unBlockCoupon", auth.isLogin, couponController.unBlockCoupon);

admin_route.get("/edit-coupon", auth.isLogin, couponController.editCouponLoad);

admin_route.post("/edit-coupon", auth.isLogin, couponController.updateCoupon);



///////////////////////Category Controll  Route////////////////////



admin_route.get(
  "/category-dashboard",
  auth.isLogin,
  productController.categoryDashboard
);

admin_route.get(
  "/edit-category",
  auth.isLogin,
  productController.editCategoryLoad
);

admin_route.post(
  "/edit-category",
  auth.isLogin,
  productController.updateCategory
);

admin_route.get("/new-category", auth.isLogin, productController.newCategory);

admin_route.post("/new-category", auth.isLogin, productController.addCategory);




///////////////////////Product Controll  Route////////////////////


admin_route.get(
  "/product-dashboard",
  auth.isLogin,
  productController.productDashboard
);

admin_route.get("/addProduct", auth.isLogin, productController.addProduct);

admin_route.post(
  "/addProduct",
  upload.array("file", 5),
  auth.isLogin,
  productController.insertProduct
);

admin_route.get(
  "/product-details",
  auth.isLogin,
  productController.productDetails
);

admin_route.get("/blockProduct", auth.isLogin, productController.blockProduct);

admin_route.get(
  "/unBlockProduct",
  auth.isLogin,
  productController.unBlockProduct
);

admin_route.get(
  "/edit-product",
  auth.isLogin,
  productController.editProductLoad
);

admin_route.post(
  "/edit-product",
  upload.array("file", 5),
  auth.isLogin,
  productController.updateProduct
);

admin_route.get("/deletImage", auth.isLogin, productController.deleteImage);




///////////////////////Brand Controll  Route////////////////////


admin_route.get(
  "/brand-dashboard",
  auth.isLogin,
  productController.brandDashboard
);

admin_route.get("/new-brand", auth.isLogin, productController.newBrand);

admin_route.post("/new-brand", auth.isLogin, productController.addBrand);

admin_route.get("/edit-brand", auth.isLogin, productController.editBrandLoad);

admin_route.post("/edit-brand", auth.isLogin, productController.updateBrand);



///////////////////////Special Route////////////////////
admin_route.get("/order-dashboard", auth.isLogin, orderController.orderLoad);

admin_route.get("/cancelOrder", auth.isLogin, orderController.cancelOrder);

admin_route.get("/orderStatus", auth.isLogin, orderController.orderDelivered);

admin_route.get("/viewOrder", auth.isLogin, orderController.DetailedOrderView);

admin_route.get("/banner-dashboard", auth.isLogin,bannerController.bannerDashboard );

admin_route.get("/addBanner", auth.isLogin, bannerController.addBanner);

admin_route.post("/addBanner",auth.isLogin,upload.array("file", 1),bannerController.newBanner);

admin_route.get("/delete-banner", auth.isLogin,bannerController.deletebanner);



admin_route.get("/logout", auth.isLogin, adminController.logout);




admin_route.get("*", function (req, res) {
  res.redirect("/admin");
});




module.exports = admin_route;
