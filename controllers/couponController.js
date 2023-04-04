const User = require("../models/userModel");
const Coupon = require("../models//couponModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Brand = require("../models/brandModel");
const Cart = require("../models/cartModel");
const bcrypt = require("bcrypt");
const Orders = require("../models/orderModel");
const mime = require("mime-types");
const { db } = require("../models/userModel");
let message;

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



const addCoupon = async (req, res) => {
  try {
    const name = req.body.couponName;
    const code = req.body.couponCode;
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const quantity = req.body.quantity;
    const minAmount = req.body.minAmount;
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

    const {
      id,
      couponName,
      couponCode,
      startDate,
      endDate,
      maxDiscount,
      minAmount,
      quantity,
    } = req.body;
    console.log(
      id,
      couponName,
      couponCode,
      startDate,
      endDate,
      maxDiscount,
      minAmount,
      quantity
    );

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

module.exports = {
  blockCoupon,
  unBlockCoupon,
  couponDashboard,
  newCoupon,
  addCoupon,
  deleteCoupon,
  editCouponLoad,
  updateCoupon,
};
