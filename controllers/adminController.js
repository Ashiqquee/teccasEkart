const User = require("../models/userModel");
const Coupon = require("../models//couponModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Brand = require("../models/brandModel");
const bcrypt = require("bcrypt");
const Orders  = require('../models/orderModel')
const mime = require('mime-types');
const { db } = require("../models/userModel");
let message;

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
    
    const couponData = await Coupon.findOne({_id:req.query.id});
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
    const minAmount= req.body.minAmount;
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
      minAmount: minAmount,
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
    console.log("hjdaskhdaskdkhaskhaskjasdh");
    console.log(req.query.id);

   const { id,couponName, couponCode, startDate, endDate, maxDiscount, minAmount, quantity } =
     req.body;
    console.log(id,couponName,couponCode,startDate,endDate,maxDiscount,minAmount,quantity);


   const updatedCoupon = await Coupon.updateOne(
     { _id: req.query.id },
     {
       $set: {
         couponName,
         couponCode,
         startDate,
         endDate,
         maxDiscount,
         minAmount,
         quantity,
       },
     }
   );

   res.redirect("/admin/coupon-dashboard");

   res.redirect("/admin/coupon-dashboard");
    

    res.redirect("/admin/coupon-dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

////////////////////category Controller/////////////////////////////



const categoryDashboard = async (req, res) => {
  try {
    const categoryData = await Category.find();
    res.render("categoryDash", { category: categoryData ,message});
    message=null
  } catch (error) {
    console.log(error.message);
  }
};


// const deleteCatogery = async (req, res) => {
//   try {
//     const id = req.query.id;

//     const cat = await Category.findOne({ _id: id }, { _id: 1 });

//     const productData = await Product.findOne({
//       category: new Object(id),
//     }).populate("category");

//     if (
//       productData ) {
//       res.redirect("/admin/category-dashboard");
//       message = "category on use";
//     } else {
//       await Category.deleteOne({ _id: new Object(id) });
//       res.redirect("/admin/category-dashboard");
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };


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
    if (!name || name.trim().length < 2) {
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



const editCategoryLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findById({ _id: id });
    if (categoryData) {
      res.render("edit-category", { category: categoryData });
    } else {
      res.redirect("/admin/category-dashboard");
    }
  } catch (error) {
    console.log(error);
  }
};


const updateCategory = async (req, res) => {
  console.log(req.query);
   
  const id = req.query.id;
  console.log(id);

  const existingCategory = await Category.findOne({
      name: req.body.name,
    });
    if (existingCategory) {
      return res.render("edit-category", {
        message: "Category is Already added",
      })};

  const CategoryData = await Category.findByIdAndUpdate({_id:id}, {
    $set: { name: req.body.name },
  });
  res.redirect("/admin/category-dashboard");
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
    const brandData =  await Brand.find();
    res.render("addProduct", { category: categoryData ,brand:brandData});
  } catch (error) {
    console.log(error);
  }
};

const insertProduct = async (req, res) => {
  try {
    const category = await Category.findOne({ name: req.body.category });
    const brand = await Brand.findOne({ brandName: req.body.brand });
    console.log(req.files);
    let arrImages = [];
     if (req.files) {
       req.files.forEach((file) => {
         const mimeType = mime.lookup(file.originalname);
         if (mimeType && mimeType.includes("image/")) {
           arrImages.push(file.filename);
         } else {
          
          res.render('addProduct')
          // message="Add Valid Image"
         }
       });
     }
    const product = new Product({
      productName: req.body.productName,
      price: req.body.price,
      description: req.body.description,
      quantity: req.body.quantity,
      category: category._id,
      brand: brand._id,
      status: 0,
      productImages: arrImages,
    });

    const productData = await product.save();
    if (productData) {
      res.redirect("/admin/product-dashboard");
    }
  } catch (error) {
    console.log(error);
  }
};

const productDetails = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findOne({_id:id}).populate("category").populate('brand');
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

const editProductLoad = async (req, res) => {
  try {
    const id = req.query.id;
    req.session.id = id;
    const productData = await Product.findById({ _id: id }).populate('brand').populate('category');
    const categoryData = await Category.find();
    const brandData = await Brand.find();

    if (productData) {
      res.render("edit-product", {
        product: productData,
        category: categoryData,
        brand:brandData
      });
    } else {
      res.redirect("/admin/product-dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateProduct = async (req, res) => {
  try {
   
    const category = await Category.findOne({ name: req.body.category });
    const brand = await Brand.findOne({ brandName: req.body.brand });
    console.log(req.files);
    
    if (req.files) {
      for( let i =0;i<req.files.length; i++){
        const image = req.files[i].filename;
        console.log(image);
        const addImage = await Product.updateOne(
          { _id: req.query.id },
          { $push: { productImages: image } }
        );
        console.log(addImage);
      }
    }

    const productData = await Product.updateOne(
      { _id: req.query.id },
      {
        $set: {
          productName: req.body.productName,
          price: req.body.price,
          description: req.body.description,
          quantity: req.body.quantity,
          category: category._id,
          brand: brand._id,
          status: 0,
          
        },
      }
    );

    console.log(productData);

    if (productData) {
      res.redirect("/admin/product-dashboard");
    }
  } catch (error) {
    console.log(error);
  }
};

const deleteImage = async (req,res) => {
  try {
    const productId= req.query.productId;
    const index = req.query.index;
    const deletedImage = await Product.updateOne(
      { _id: productId },
      { $unset: { [`productImages.${index}`]: "" } }
    );
    const deletedImages = await Product.updateOne(
     { _id: productId },
      { $pull: { productImages: null } }
      );

   console.log(deletedImage, deletedImage);
    res.redirect("/admin/edit-product?id=" + productId);
  } catch (error) {
    console.log(error);
  }
}


////////////////////Brand Controller/////////////////////////////



const brandDashboard = async (req, res) => {
  try {
    const brandData = await Brand.find();
    res.render("brandDash", { brand: brandData, message });
    message = null;
  } catch (error) {
    console.log(error.message);
  }
};

const newBrand = async (req, res) => {
  try {
    res.render("new-brand");
  } catch (error) {
    console.log(error.message);
  }
};



const addBrand = async (req, res) => {
  try {
    const brandName = req.body.brandName;
    if (!brandName || brandName.trim().length < 2) {
       res.redirect("/admin/new-brand");
       message = "Enter a valid Brand Name";
    }
    const existingBrand = await Brand.findOne({
      brandName: req.body.brandName,
    });
    if (existingBrand) {
       res.redirect("/admin/new-brand" )
        message = "Brand is Already added";
     
      console.log("scene");
    }

    const brand = new Brand({
      brandName: brandName,
    });

    const brandData = await brand.save();

    if (brandData) {
      console.log("ok");
      res.redirect("/admin/brand-dashboard");
    }
  } catch (error) {
    console.log(error);
  }
};

const editBrandLoad = async(req,res) => {
  try {
    const id = req.query.id;
    const brandData = await Brand.findById({ _id: id });
    if (brandData) {
      res.render("edit-brand", { brand: brandData });
    } else {
      res.redirect("/admin/coupon-dashboard");
    }
    
  } catch (error) {
    console.log(error);
  }
}



const updateBrand  =  async(req,res) => {
  const id = req.query.id;
  
  const brandData = await Brand.findByIdAndUpdate(
    { _id: id },
    {$set:{brandName:req.body.brandName}}
    );
    res.redirect('/admin/brand-dashboard')
}




///////////////////////Order Managment////////////////////////


const orderLoad = async(req,res) => {
  try {
    
    const orderData = await Orders.find();
    res.render('orderDetails',{orders:orderData});
  } catch (error) {
    console.log(error);
  }
}


const cancelOrder = async(req,res) => {
  try {
    id= req.query.orderId;
    const orderData = await Orders.updateOne(
      { _id: id },
      { $set: { admin_cancelled :true} }
    );
     const orderDetails = await Orders.findOne({_id:id});
        if (
          orderDetails.paymentType === "online" ||
          orderDetails.paymentType === "wallet"
        ) {
          increaseAmount = orderDetails.totalPrice;
          console.log(increaseAmount);
       const ans=   await User.updateOne(
            { _id: orderDetails.userId },
            { $inc: { wallet: increaseAmount } }
          );
          console.log(ans);
        }
        
        // const productInc = await Orders.findOne({ userId:orderDetails.userId })
        //   .sort({ _id: -1 })
        //   .populate("item.product");
        // console.log("ssss");
        // orderData.item.forEach(async (item) => {
        //   const productid = item.product._id;
        //   const increaseQuantity = item.quantity;
        //   console.log("kkkkk");
        //   await Product.updateOne(
        //     { _id: productid },
        //     { $inc: { quantity: increaseQuantity } }
        //   );
        // });
      
     res.redirect("/admin/order-dashboard");
  } catch (error) {
    console.log(error);
  }
}


const orderDelivered = async (req, res) => {
  try {
    id = req.query.orderId;
    const orderData = await Orders.updateOne({_id:id},{$set: {is_delivered:true}});
    const orderDetails = await Orders.find();
    res.redirect("/admin/order-dashboard");
  } catch (error) {
    console.log(error);
  }
};



const DetailedOrderView = async(req,res) => {
  try {
    const id = req.query.orderId;
    const orderData = await Orders.findOne({ _id: id }).populate(
      "item.product"
    );
    if (id) {
      res.render("orderPage", { orders: orderData});
    } else {
      res.redirect("/admin/orders-dashboard");
    }
  } catch (error) {
    console.log(error);
  }
}

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
  editCategoryLoad,
  updateCategory,
  newCategory,
  addCategory,
  productDashboard,
  addProduct,
  insertProduct,
  productDetails,
  blockProduct,
  unBlockProduct,
  editProductLoad,
  updateProduct,
  brandDashboard,
  newBrand,
  addBrand,
  editBrandLoad,
  updateBrand,
  orderLoad,
  cancelOrder,
  orderDelivered,
  DetailedOrderView,
  deleteImage,

};
