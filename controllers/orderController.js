
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

const orderLoad = async (req, res) => {
  try {
    const orderData = await Orders.find().populate('userId')
    res.render("orderDetails", { orders: orderData });
  } catch (error) {
    console.log(error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    id = req.query.orderId;
    const orderData = await Orders.updateOne(
      { _id: id },
      { $set: { admin_cancelled: true } }
    );
    const orderDetails = await Orders.findOne({ _id: id });
    if (
      orderDetails.paymentType === "online" ||
      orderDetails.paymentType === "wallet"
    ) {
      increaseAmount = orderDetails.totalPrice;
      console.log(increaseAmount);
      const ans = await User.updateOne(
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
};

const orderDelivered = async (req, res) => {
  try {
    id = req.query.orderId;
    const orderData = await Orders.updateOne(
      { _id: id },
      {
        $set: {
          is_delivered: true,
          delivered_date: Date.now(),
        },
      }
    );
    const orderDetails = await Orders.find();
    res.redirect("/admin/order-dashboard");
  } catch (error) {
    console.log(error);
  }
};

const DetailedOrderView = async (req, res) => {
  try {
    const id = req.query.orderId;
    const orderData = await Orders.findOne({ _id: id }).populate(
      "item.product"
    );
    if (id) {
      res.render("orderPage", { orders: orderData });
    } else {
      res.redirect("/admin/orders-dashboard");
    }
  } catch (error) {
    console.log(error);
  }
};




module.exports = {
  orderLoad,
  cancelOrder,
  orderDelivered,
  DetailedOrderView,
};