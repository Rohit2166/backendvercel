const mongoose = require("mongoose");

const schema = new mongoose.Schema({

 userId: {

  type: mongoose.Schema.Types.ObjectId,

  ref: "User"

 },

 groundId: {

  type: mongoose.Schema.Types.ObjectId,

  ref: "Ground"

 },

 bookingDate: Date,

 timeSlot: String,

 price: Number,

 status: {

  type: String,

  default: "pending"

 }

},

{

 timestamps: true

});

module.exports = mongoose.model("Booking", schema);