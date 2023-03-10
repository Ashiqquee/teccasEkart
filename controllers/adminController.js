const User = require("../models/userModel");
const Coupon = require("../models//couponModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const bcrypt = require("bcrypt");


////////////////////Admin Controller/////////////////////////////

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("login", {
            message: "Email and password is incorrect, not an admin",
          });
        } else {
          req.session.Auser_id = userData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("login", { message: "Email or password is incorrect" });
      }
    } else {
      res.render("login", {
        message: "Please provide your Email and password",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.Auser_id });
    res.render("home", { admin: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const adminDashboard = async (req, res) => {
  try {
    const userData = await User.find({ is_admin: 0 });
    res.render("userDash", { users: userData });
  } catch (error) {
    console.log(error.message);
  }
};

////////////////////User Controller/////////////////////////////

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};





const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const user = await User.findOne({ _id: new Object(id) });

    if (req.session.user_id === user._id.toString()) {
      req.session.user_id = null;
    }

    await User.updateOne({ _id: new Object(id) }, { $set: { is_blocked: 1 } });

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error);
  }
};

const unBlockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.updateOne({ _id: new Object(id) }, { $set: { is_blocked: 0 } });
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error);
  }
};

const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });

    if (userData) {
      res.render("edit-user", { user: userData });
    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mno,
        },
      }
    );

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

////////////////////Coupon Controller/////////////////////////////

const couponDashboard = async (req, res) => {
  try {
    const couponData = await Coupon.find();
    res.render("couponDash", { coupon: couponData });
  } catch (error) {
    console.log(error.message);
  }
};

const newCoupon = async (req, res) => {
  try {
    res.render("new-coupon");
  } catch (error) {
    console.log(error.message);
  }
};

const couponDetails = async (req, res) => {
  try {
    const couponData = await Coupon.find();
    res.render("couponDetails", { coupon: couponData });
  } catch (error) {
    console.log(error);
  }
};

const addCoupon = async (req, res) => {
  try {
    const name = req.body.couponName;
    const code = req.body.couponCode;
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const quantity = req.body.quantity;
    const maxDiscount = req.body.maxDiscount;
    const currentDate = new Date();

    if (!code || code.trim().length < 6) {
      return res.render("new-coupon", { message: "Please enter a valid code" });
    }
    if (!code || !code.startsWith("#") || code.trim().length < 6) {
      return res.render("new-coupon", {
        message: "Please enter a valid code starting with #",
      });
    }
    const existingCode = await Coupon.findOne({ code: req.body.couponCode });
    if (existingCode) {
      return res.render("new-coupon", {
        message: "Code is Already added",
      });
    }

    if (startDate.getTime() <= currentDate.getTime()) {
      return res.render("new-coupon", {
        message: "Start date must be after the current date",
      });
    }

    if (startDate.getTime() >= endDate.getTime()) {
      return res.render("new-coupon", {
        message: "End date must be after the start date",
      });
    }

    const coupon = new Coupon({
      couponName: name,
      couponCode: code,
      startDate: startDate,
      endDate: endDate,
      maxDiscount: maxDiscount,
      quantity: quantity,
    });

    const couponData = await coupon.save();

    if (couponData) {
      res.redirect("/admin/coupon-dashboard");
    } else {
      res.render("new-coupon", { message: "Something wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};


const deleteCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    await Coupon.deleteOne({ _id: new Object(id) });
    res.redirect("/admin/coupon-dashboard");
  } catch (error) {
    console.log(error);
  }
};

const unBlockCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    await Coupon.updateOne({ _id: new Object(id) }, { $set: { status: 0 } });
    res.redirect("/admin/coupon-dashboard");
  } catch (error) {
    console.log(error);
  }
};

const blockCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    await Coupon.updateOne({ _id: new Object(id) }, { $set: { status: 1 } });
    res.redirect("/admin/coupon-dashboard");
  } catch (error) {
    console.log(error);
  }
};

const editCouponLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const couponData = await Coupon.findById({ _id: id });

    if (couponData) {
      res.render("edit-coupon", { coupon: couponData });
    } else {
      res.redirect("/admin/coupon-dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateCoupon = async (req, res) => {
  try {

    const couponData = await Coupon.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          code: req.body.code,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          maxDiscount: req.body.maxDiscount,
          quantity: req.body.quantity,
        },
      }
    );

    res.redirect("/admin/coupon-dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

////////////////////category Controller/////////////////////////////



const categoryDashboard = async (req, res) => {
  try {
    const categoryData = await Category.find();
    res.render("categoryDash", { category: categoryData });
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCatogery = async (req, res) => {
  try {
    const id = req.query.id;
    await Category.deleteOne({ _id: new Object(id) });
    res.redirect("/admin/category-dashboard");
  } catch (error) {
    console.log(error);
  }
};

const newCategory = async (req, res) => {
  try {
    res.render("new-category");
  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    const name = req.body.name;
    if (!name || name.trim().length < 3) {
      return res.render("new-category", {
        message: "Please enter a valid name",
      });
    }
    const existingCategory = await Category.findOne({
      name: req.body.name,
    });
    if (existingCategory) {
      return res.render("new-category", {
        message: "Category is Already added",
      });
      console.log("scene");
    }

    const category = new Category({
      name: name,
    });

    const categoryData = await category.save();

    if (categoryData) {
      console.log("ok");
      res.redirect("/admin/category-dashboard");
    }
  } catch (error) {
    console.log(error);
  }
};

////////////////////Product Controller/////////////////////////////

const productDashboard = async (req, res) => {
  try {
    const productData = await Product.find();
    res.render("productDash", { product: productData });
  } catch (error) {
    console.log(error.message);
  }
};

const addProduct = async (req, res) => {
  try {
    const categoryData = await Category.find();
    res.render("addProduct", { category: categoryData });
  } catch (error) {
    console.log(error);
  }
};


const insertProduct = async (req, res) => {
  try {
    const category = await Category.findOne({ name: req.body.category });
    console.log(req.files);
    let arrImages = [];
    if (req.files) {
      req.files.forEach((file) => arrImages.push(file.filename));
    }
    const product = new Product({
      productName: req.body.productName,
      price: req.body.price,
      description: req.body.description,
      quantity: req.body.quantity,
      color: req.body.color,
      category: category._id,
      brand: req.body.brand,
      status: 0,
      productImages: arrImages,
    });

    const productData = await product.save();
    if(productData){
      res.redirect('/admin/product-dashboard')
    }
  } catch (error) {
    console.log(error);
  }
};





const productDetails = async (req, res) => {
  try {
    const productData = await Product.find().populate("category").lean()
    res.render("productDetails", { product: productData });
  } catch (error) {
    console.log(error);
  }
};


const blockProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await Product.updateOne({ _id: new Object(id) }, { $set: { status: 1 } });
    res.redirect("/admin/product-dashboard");
  } catch (error) {
    console.log(error);
  }
};



const unBlockProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await Product.updateOne({ _id: new Object(id) }, { $set: { status: 0 } });
    res.redirect("/admin/product-dashboard");
  } catch (error) {
    console.log(error);
  }
};





////////////////////Logout Controller/////////////////////////////

const logout = async (req, res) => {
  try {
    req.session.Auser_id = null;
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  adminDashboard,
  editUserLoad,
  updateUser,
  blockUser,
  unBlockUser,
  blockCoupon,
  unBlockCoupon,
  couponDashboard,
  couponDetails,
  newCoupon,
  addCoupon,
  deleteCoupon,
  editCouponLoad,
  updateCoupon,
  categoryDashboard,
  deleteCatogery,
  newCategory,
  addCategory,
  productDashboard,
  addProduct,
  insertProduct,
  productDetails,
  blockProduct,
  unBlockProduct,
};
