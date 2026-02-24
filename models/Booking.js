const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  groundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ground",
    required: true
  },

  groundName: String,

  sportType: String,

  location: String,

  bookingDate: {
    type: Date,
    required: true
  },

  timeSlot: {
    type: String,
    required: true
  },

  price: Number,

  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending"
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },

  paymentId: String,

  notes: String,

  cancelledAt: Date,

  cancellationReason: String,

  ownerEmail: String,

  userEmail: String,

  userName: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Booking", bookingSchema);