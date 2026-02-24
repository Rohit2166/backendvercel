const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["customer", "owner"],
    default: "customer"
  },

  phone: {
    type: String,
    default: null
  },

  profileImage: {
    type: String,
    default: null
  },

  address: String,

  city: String,

  state: String,

  isVerified: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("User", userSchema);