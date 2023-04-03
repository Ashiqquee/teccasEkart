const User = require("../models/userModel");
const Coupon = require("../models//couponModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Brand = require("../models/brandModel");
const bcrypt = require("bcrypt");
const Orders = require("../models/orderModel");
const mime = require("mime-types");
const { db } = require("../models/userModel");
const { json } = require("body-parser");
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
    let DailyEnd = new Date();
    let DailyStart = new Date(DailyEnd.getTime() - 86400000);
    // let weeklyStart = new Date(new Date() - 7 * 24 * 60 * 60 * 1000);
    // let weeklyEnd = new Date();
    let monthlyStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    let monthlyEnd = (DailyEnd = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ));

      let yearlyStart = new Date(new Date().getFullYear(), 0, 1);
      let yearlyEnd = new Date(new Date().getFullYear(), 11, 31);

    let dailySalesData = await Orders.find({
      is_delivered: true,
      is_returned: 0,
      delivered_date: {
        $gte: DailyStart,
        $lte: DailyEnd,
      },
    })
      .populate("userId")
      .populate("item.product");

    const dailySales = dailySalesData.reduce((total, order) => {
      const itemTotal = order.item.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      return total + itemTotal;
    }, 0);

    const dailySalesDocument = await Orders.find({
      is_delivered: true,
      is_returned: 0,
      delivered_date: {
        $gte: DailyStart,
        $lte: DailyEnd,
      },
    })
      .populate("userId")
      .populate("item.product")
      .countDocuments();

    const dailySalesProduct = dailySalesData.reduce((total, order) => {
      const orderProductsCount = order.item.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      return total + orderProductsCount;
    }, 0);

    let monthlySalesData = await Orders.find({
      is_delivered: true,
      is_returned: 0,
      delivered_date: {
        $gte: monthlyStart,
        $lte: monthlyEnd,
      },
    })
      .populate("userId")
      .populate("item.product");

    const monthlySales = monthlySalesData.reduce((total, order) => {
      const itemTotal = order.item.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      return total + itemTotal;
    }, 0);

    const monthlySaleDocument = await Orders.find({
      is_delivered: true,
      is_returned: 0,
      delivered_date: {
        $gte: monthlyStart,
        $lte: monthlyEnd,
      },
    })
      .populate("userId")
      .populate("item.product")
      .countDocuments();

    const monthlySalesProduct = monthlySalesData.reduce((total, order) => {
      const orderProductsCount = order.item.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      return total + orderProductsCount;
    }, 0);

    let yearlySalesData = await Orders.find({
      is_delivered: true,
      is_returned: 0,
      delivered_date: {
        $gte: yearlyStart,
        $lte: yearlyEnd,
      },
    })
      .populate("userId")
      .populate("item.product");

    const yearlySalesProduct = yearlySalesData.reduce((total, order) => {
      const orderProductsCount = order.item.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      return total + orderProductsCount;
    }, 0);

    const yearlySaleDocument = await Orders.find({
      is_delivered: true,
      is_returned: 0,
      delivered_date: {
        $gte: yearlyStart,
        $lte: yearlyEnd,
      },
    })
      .populate("userId")
      .populate("item.product")
      .countDocuments();

    const yearlySales = yearlySalesData.reduce((total, order) => {
      const itemTotal = order.item.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      return total + itemTotal;
    }, 0);

    const startDate = req.query.start_date
      ? new Date(req.query.start_date)
      : null;
    const endDate = req.query.end_date ? new Date(req.query.end_date) : null;
    if (endDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
      console.log(startDate, endDate);
    let query = { is_delivered: true, is_returned: 0 };
    if (startDate && endDate) {
      query.delivered_date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.delivered_date = { $gte: startDate };
    } else if (endDate) {
      query.delivered_date = { $lte: endDate };
    }
    const salesData = await Orders.find(query).populate("userId");
    let totalAmount = 0;
    for (i = 0; i < salesData.length; i++) {
      totalAmount += parseInt(salesData[i].totalPrice);
    }

    const monthlySalesDetails = [];
    for (let i = 0; i < 12; i++) {
      const salesOfMonth = yearlySalesData.filter((order) => {
        return order.delivered_date.getMonth() === i;
      });

      const totalSalesOfMonth = salesOfMonth.reduce((total, order) => {
        return (
          total +
          order.item.reduce((sum, item) => {
            return sum + item.price * item.quantity;
          }, 0)
        );
      }, 0);

      monthlySalesDetails.push(totalSalesOfMonth);
    }
     

const allMonthsUser = [...Array(12).keys()].map((m) => m + 1);

let monthlyOrderCounts = allMonthsUser.reduce((acc, cur) => {
  acc[cur - 1] = 0;
  return acc;
}, []);

yearlySalesData.forEach((order) => {
  let deliveredDate = new Date(order.delivered_date);
  let month = deliveredDate.getMonth() + 1; 
  monthlyOrderCounts[month - 1]++;
});





const allMonthsProduct = [...Array(12).keys()].map((m) => m + 1); 

let monthlyProductCounts = allMonthsProduct.reduce((acc, cur) => {
  acc[cur - 1] = 0;
  return acc;
}, []);

yearlySalesData.forEach((order) => {
  let deliveredDate = new Date(order.delivered_date);
  let month = deliveredDate.getMonth() + 1; 
  order.item.forEach((item) => {
    monthlyProductCounts[month - 1] += item.quantity;
  });
});

console.log(monthlyProductCounts);



   
    

   
    
    res.render("home", {
      dailySales,
      monthlySales,
      monthlySaleDocument,
      dailySalesProduct,
      monthlySalesProduct,
      dailySalesDocument,
      yearlySales,
      yearlySaleDocument,
      yearlySalesProduct,
      data: salesData,
      totalAmount,
      monthlySalesDetails: JSON.stringify(monthlySalesDetails),
      monthlyOrderCounts: JSON.stringify(monthlyOrderCounts),
      monthlyProductCounts: JSON.stringify(monthlyProductCounts),
    });
  } catch (error) {
    console.log(error.message);
  }
};



let adminDashboard = async (req, res) => {
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

};
