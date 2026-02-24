const router = require("express").Router();

const Contact = require("../models/Contact");


// Create contact message
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: "Name, email, and message are required" 
      });
    }
    
    const data = await Contact.create({
      name,
      email,
      message
    });
    
    res.json({
      success: true,
      message: "Message sent successfully",
      data
    });
  } catch (error) {
    res.status(500).json({ 
      message: error.message 
    });
  }
});


// Get all contacts (admin only - for future use)
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ 
      message: error.message 
    });
  }
});


module.exports = router;
