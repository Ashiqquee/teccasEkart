const User = require("../models/userModel");
const Coupon = require("../models//couponModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Brand = require("../models/brandModel");
const bcrypt = require("bcrypt");
const Orders = require("../models/orderModel");
const mime = require("mime-types");
const { db } = require("../models/userModel");
let message;

const categoryDashboard = async (req, res) => {
  try {
    const categoryData = await Category.find();
    res.render("categoryDash", { category: categoryData, message });
    message = null;
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
    });
  }

  const CategoryData = await Category.findByIdAndUpdate(
    { _id: id },
    {
      $set: { name: req.body.name },
    }
  );
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
    const brandData = await Brand.find();
    res.render("addProduct", { category: categoryData, brand: brandData });
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
          res.render("addProduct");
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
    const productData = await Product.findOne({ _id: id })
      .populate("category")
      .populate("brand");
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
    const productData = await Product.findById({ _id: id })
      .populate("brand")
      .populate("category");
    const categoryData = await Category.find();
    const brandData = await Brand.find();

    if (productData) {
      res.render("edit-product", {
        product: productData,
        category: categoryData,
        brand: brandData,
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
      for (let i = 0; i < req.files.length; i++) {
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

const deleteImage = async (req, res) => {
  try {
    const productId = req.query.productId;
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
};

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
      res.redirect("/admin/new-brand");
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

const editBrandLoad = async (req, res) => {
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
};

const updateBrand = async (req, res) => {
  const id = req.query.id;

  const brandData = await Brand.findByIdAndUpdate(
    { _id: id },
    { $set: { brandName: req.body.brandName } }
  );
  res.redirect("/admin/brand-dashboard");
};

module.exports = {
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
  deleteImage,
};
