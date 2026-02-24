const mongoose = require("mongoose");

const groundSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  sport: {
    type: String,
    enum: ["cricket", "badminton", "basketball", "pickleball", "tennis"],
    required: true
  },

  image: String,

  images: [String],

  description: String,

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  availableSlots: [
    {
      day: String,
      slots: [String]
    }
  ],

  isAvailable: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Ground", groundSchema);