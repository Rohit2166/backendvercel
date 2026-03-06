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
   ref: "User",
   default: null
 }

},

{

 timestamps: true

});

// Add a virtual for getting ownerId as string
schema.virtual('ownerIdString').get(function() {
  if (this.ownerId) {
    return this.ownerId.toString();
  }
  return null;
});

// Ensure virtuals are included in JSON
schema.set('toJSON', { virtuals: true });
schema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Ground", schema);
