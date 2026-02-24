const router = require("express").Router();

const Booking = require("../models/Booking");

const auth = require("../middleware/authMiddleware");


// Create booking
router.post("/create", auth, async (req, res) => {
  try {
    const { groundId, bookingDate, timeSlot } = req.body;
    
    // Get ground info for price
    const Ground = require("../models/Ground");
    const ground = await Ground.findById(groundId);
    
    if (!ground) {
      return res.status(404).json({ message: "Ground not found" });
    }
    
    const booking = await Booking.create({
      userId: req.userId,
      groundId,
      bookingDate,
      timeSlot,
      price: ground.price,
      status: "confirmed"
    });
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get user's bookings
router.get("/user/bookings", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId })
      .populate("groundId")
      .sort({ createdAt: -1 });
    
    // Transform data to include ground details
    const transformedBookings = bookings.map(booking => ({
      _id: booking._id,
      groundId: booking.groundId?._id,
      groundName: booking.groundId?.name || "Unknown Ground",
      groundImage: booking.groundId?.image,
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
    res.status(500).json({ message: error.message, canCancel: false });
  }
});


// Get all bookings (for admin/owner)
router.get("/all", auth, async (req, res) => {
  try {
    const bookings = await Booking.find().populate("userId groundId");
    res.json(bookings);
  } catch (error) {
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
    
    // Check if within cancellation window
    const bookingTime = new Date(booking.createdAt).getTime();
    const currentTime = Date.now();
    const minutesElapsed = Math.floor((currentTime - bookingTime) / (1000 * 60));
    
    if (minutesElapsed >= 30) {
      return res.status(400).json({ 
        message: "Cancellation window of 30 minutes has expired" 
      });
    }
    
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
