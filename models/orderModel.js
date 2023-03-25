const mongoose = require("mongoose");
const orderSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  item: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
        required: true,
      },
    },
  ],
  start_date: {
    type: Date,
  },
  delivered_date: {
    type: String,
  },
  totalPrice: {
    type: String,
  },
  is_delivered: {
    type: Boolean,
    default: false,
  },
  user_cancelled: {
    type: Boolean,
    default: false,
  },
  admin_cancelled: {
    type: Boolean,
    default: false,
  },
  orderCount: {
    type: Number,
    default: 0,
  },
  is_returned: {
    type: Number,
    default: 0,
  },
  address: {
    type: Array,
  },
  paymentType: {
    type: String,
  },
});

module.exports = mongoose.model("Orders", orderSchema);
