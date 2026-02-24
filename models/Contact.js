const mongoose = require("mongoose");

const schema = new mongoose.Schema({

 name: String,

 email: String,

 message: String

},

{

 timestamps: true

});

module.exports = mongoose.model("Contact", schema);