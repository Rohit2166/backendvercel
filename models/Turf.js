const mongoose = require("mongoose");

const turfSchema = new mongoose.Schema({

  name: String,

  location: String,

  address: String,

  sport: String,

  price: Number,

  description: String,

  images: [String],

  owner: {

    type: mongoose.Schema.Types.ObjectId,

    ref: "User"

  }

},

{

  timestamps: true

});



module.exports = mongoose.model("Turf", turfSchema);