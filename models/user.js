// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100,
  },
  password_hash: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    maxlength: 15,
  },
  role: {
    type: String,
    enum: ["farmer", "consumer", "courier", "admin"],
    default: "consumer",
  },
  address: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
