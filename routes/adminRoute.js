const express = require("express");

const admin_route = express();

const session = require("express-session");
const config = require("../config/config");

const multer = require("multer");
const path = require("path");



admin_route.set("views", "./views/admin");

const auth = require("../middleware/adminAuth");

const adminController = require("../controllers/adminController");

admin_route.use(express.static('public'));

const storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,path.join(__dirname,'../public/productImages'),function(success,err){
      if(err){
        throw err
      }

    })
  },
  filename:function(req,file,cb){
    const name = Date.now()+'-'+file.originalname;
    cb(null,name,function(success,err){
      if(err){
        throw err
      }
    })

  }
})

const upload = multer({storage:storage})



///////////////////////Login Route////////////////////////////



admin_route.get("/", auth.isLogout, adminController.loadLogin);

admin_route.post("/", adminController.verifyLogin);



///////////////////////Home  Route////////////////////////////


admin_route.get("/home", auth.isLogin, adminController.loadDashboard);


///////////////////////User Controll  Route////////////////////



admin_route.get("/dashboard", auth.isLogin, adminController.adminDashboard);

admin_route.get("/edit-user", auth.isLogin, adminController.editUserLoad);

admin_route.post("/edit-user", adminController.updateUser);

admin_route.get("/blockUser", adminController.blockUser);

admin_route.get("/unBlockUser", adminController.unBlockUser);


///////////////////////Coupon Controll  Route////////////////////



admin_route.get("/coupon-dashboard", auth.isLogin, adminController.couponDashboard);

admin_route.get("/coupon-details", auth.isLogin, adminController.couponDetails);

admin_route.get("/new-coupon",auth.isLogin, adminController.newCoupon);

admin_route.post("/new-coupon", auth.isLogin, adminController.addCoupon);

admin_route.get('/delete-coupon',adminController.deleteCoupon);

admin_route.get("/blockCoupon", adminController.blockCoupon);

admin_route.get("/unBlockCoupon", adminController.unBlockCoupon);

admin_route.get("/edit-coupon", auth.isLogin, adminController.editCouponLoad);

admin_route.post("/edit-coupon", auth.isLogin, adminController.updateCoupon);



///////////////////////Category Controll  Route////////////////////



admin_route.get("/category-dashboard", auth.isLogin,adminController.categoryDashboard);

admin_route.get("/deleteCategory", adminController.deleteCatogery);

admin_route.get("/new-category",auth.isLogin, adminController.newCategory);

admin_route.post("/new-category", auth.isLogin, adminController.addCategory);




///////////////////////Product Controll  Route////////////////////


admin_route.get("/product-dashboard", auth.isLogin,adminController.productDashboard);

admin_route.get("/addProduct", auth.isLogin, adminController.addProduct);

admin_route.post("/addProduct",upload.array("file"),auth.isLogin,adminController.insertProduct);

admin_route.get("/product-details", auth.isLogin, adminController.productDetails);

admin_route.get("/blockProduct",auth.isLogin,adminController.blockProduct);

admin_route.get("/unBlockProduct",auth.isLogin,adminController.unBlockProduct);



///////////////////////Special Route////////////////////


admin_route.get("/logout", auth.isLogin, adminController.logout);


admin_route.get("*", function (req, res) {
  res.redirect("/admin");
});




module.exports = admin_route;
