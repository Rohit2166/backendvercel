const router = require("express").Router();

const Booking = require("../models/Booking");
const Ground = require("../models/Ground");

const auth = require("../middleware/authMiddleware");
const mongoose = require("mongoose");


// Create booking
router.post("/create", auth, async (req, res) => {
  try {
    const { groundId, bookingDate, timeSlot } = req.body;
    
    console.log("Booking request received:", { groundId, bookingDate, timeSlot, userId: req.userId });
    
    // Check if userId is properly set from auth middleware
    if (!req.userId) {
      console.error("User ID is undefined. Auth middleware may have failed.");
      return res.status(401).json({ message: "Authentication failed. Please login again." });
    }
    
    // Validate input
    if (!groundId || !bookingDate || !timeSlot) {
      return res.status(400).json({ message: "Missing required fields: groundId, bookingDate, timeSlot" });
    }
    
    // Validate groundId format
    if (!mongoose.Types.ObjectId.isValid(groundId)) {
      return res.status(400).json({ message: "Invalid ground ID format" });
    }
    
    // Get ground info for price
    const ground = await Ground.findById(groundId);
    
    if (!ground) {
      console.log("Ground not found for ID:", groundId);
      return res.status(404).json({ message: "Ground not found. Please select a valid ground." });
    }
    
    console.log("Ground found:", ground.name, "Price:", ground.price);
    
    // Create booking with userId - ensure userId is a valid ObjectId
    const bookingData = {
      userId: new mongoose.Types.ObjectId(req.userId),
      groundId: new mongoose.Types.ObjectId(groundId),
      bookingDate: bookingDate,
      timeSlot: timeSlot,
      price: ground.price,
      status: "confirmed"
    };
    
    console.log("Creating booking with data:", bookingData);
    
    const booking = await Booking.create(bookingData);
    
    console.log("Booking created successfully:", booking._id);
    
    res.json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: error.message || "Failed to create booking" });
  }
});


// Get user's bookings
router.get("/user/bookings", auth, async (req, res) => {
  try {
    console.log("Fetching bookings for user:", req.userId);
    
    const bookings = await Booking.find({ userId: req.userId })
      .populate("groundId")
      .sort({ createdAt: -1 });
    
    console.log("Found bookings:", bookings.length);
    
    // Transform data to include ground details
    const transformedBookings = bookings.map(booking => ({
      _id: booking._id,
      groundId: booking.groundId?._id,
      groundName: booking.groundId?.name || "Unknown Ground",
      groundImage: booking.groundId?.image || (booking.groundId?.images && booking.groundId.images[0]),
      location: booking.groundId?.location || booking.groundId?.address || "",
      sportType: booking.groundId?.sport || "",
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      price: booking.price || booking.groundId?.price || 0,
      status: booking.status,
      createdAt: booking.createdAt
    }));
    
    res.json(transformedBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: error.message });
  }
});


// Check if booking can be cancelled (within 30 minutes)
router.get("/:id/check-cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found", canCancel: false });
    }
    
    // Check ownership
    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized", canCancel: false });
    }
    
    if (booking.status === "cancelled") {
      return res.json({ 
        canCancel: false, 
        message: "Booking already cancelled" 
      });
    }
    
    // Calculate time since booking
    const bookingTime = new Date(booking.createdAt).getTime();
    const currentTime = Date.now();
    const minutesElapsed = Math.floor((currentTime - bookingTime) / (1000 * 60));
    const minutesRemaining = 30 - minutesElapsed;
    
    if (minutesElapsed >= 30) {
      return res.json({
        canCancel: false,
        minutesElapsed,
        minutesRemaining: 0,
        message: "Cancellation window of 30 minutes has expired"
      });
    }
    
    res.json({
      canCancel: true,
      minutesElapsed,
      minutesRemaining,
      message: "Booking can be cancelled"
    });
  } catch (error) {
    console.error("Error checking cancel:", error);
    res.status(500).json({ message: error.message, canCancel: false });
  }
});


// Get all bookings (for admin/owner)
router.get("/all", auth, async (req, res) => {
  try {
    const bookings = await Booking.find().populate("userId groundId");
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ message: error.message });
  }
});


// Update booking status
router.put("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: error.message });
  }
});


// Cancel/delete booking
router.delete("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check ownership
    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
