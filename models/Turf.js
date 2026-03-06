// const mongoose = require("mongoose");

// const schema = new mongoose.Schema({

//  name: String,

//  location: String,

//  address: String,

//  sport: String,

//  price: Number,

//  description: String,

//  images: [String],

//  owner: {
//    type: mongoose.Schema.Types.Mixed,
//    ref: "User"
//  }

// },

// {

//  timestamps: true

// });

// // Add a virtual for getting owner as string
// schema.virtual('ownerString').get(function() {
//   if (this.owner) {
//     return this.owner.toString();
//   }
//   return null;
// });

// // Ensure virtuals are included in JSON
// schema.set('toJSON', { virtuals: true });
// schema.set('toObject', { virtuals: true });

// module.exports = mongoose.model("Turf", schema);

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
}, {
  timestamps: true
});

module.exports = mongoose.model("Turf", turfSchema);
