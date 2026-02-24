const mongoose = require("mongoose");

const schema = new mongoose.Schema({

 name: String,

 address: String,

 location: String,

 price: Number,

 sport: String,

 image: String,

 images: [String],

 description: String,

 ownerId: {

  type: mongoose.Schema.Types.ObjectId,

  ref: "User"

 }

},

{

 timestamps: true

});

module.exports = mongoose.model("Ground", schema);