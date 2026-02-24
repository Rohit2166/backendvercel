const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");

const Ground = require("../models/Ground");

const authMiddleware = require("../middleware/authMiddleware");

const Razorpay = require("razorpay");

const { 
  sendBookingConfirmationEmail, 
  sendBookingNotificationToOwner,
  sendCancellationEmailToCustomer,
  sendCancellationEmailToOwner
} = require("../utils/mailService");


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret"
});


// for Create booking

router.post("/create", authMiddleware, async(req,res)=>{

  try {
    const { groundId, bookingDate, timeSlot } = req.body;

    const ground = await Ground.findById(groundId).populate("ownerId", "email name");

    if (!ground) {
      return res.status(404).json({ message: "Ground not found" });
    }

    // Get user email
    const User = require("../models/User");
    const user = await User.findById(req.userId);

    const booking = new Booking({
      userId: req.userId,
      groundId,
      groundName: ground.name,
      sportType: ground.sport,
      location: ground.location,
      bookingDate,
      timeSlot,
      price: ground.price,
      status: "pending",
      ownerEmail: ground.ownerId.email,
      userEmail: user.email,
      userName: user.name
    });

    await booking.save();

    // Send booking confirm email (non-blocking)
    try {
      await sendBookingConfirmationEmail(booking);
      await sendBookingNotificationToOwner(booking);
    } catch (emailError) {
      console.log('Email notification failed (booking still created):', emailError.message);
    }

    res.status(201).json({
      message: "Booking created successfully",
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


// Get user bookings

router.get("/user/bookings", authMiddleware, async(req,res)=>{

  try {
    const bookings = await Booking.find({ userId: req.userId })
      .populate("groundId")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


// Get all bookings (Admin)

router.get("/", async(req,res)=>{

  try {
    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate("groundId")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


// Get booking by ID

router.get("/:id", async(req,res)=>{

  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId")
      .populate("groundId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


// Check if booking can be cancelled (within 1 hour of creation)

router.get("/:id/check-cancel", authMiddleware, async(req,res)=>{

  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const bookingCreatedTime = new Date(booking.createdAt);
    const cancellationDeadline = new Date(bookingCreatedTime.getTime() + 60 * 60 * 1000); // +1 hour
    const now = new Date();
    const canCancel = now <= cancellationDeadline;
    const minutesRemaining = Math.ceil((cancellationDeadline - now) / 60000);
    const minutesElapsed = Math.floor((now - bookingCreatedTime) / 60000);

    res.json({
      bookingId: booking._id,
      canCancel: canCancel,
      status: booking.status,
      bookedAt: bookingCreatedTime,
      deadline: cancellationDeadline,
      minutesElapsed: minutesElapsed,
      minutesRemaining: canCancel ? minutesRemaining : 0,
      message: canCancel 
        ? `You have ${minutesRemaining} minute(s) left to cancel this booking`
        : `Cannot cancel - you booked this ${minutesElapsed} minutes ago. Cancellations only allowed within 1 hour of booking.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


// Update booking status

router.put("/:id", authMiddleware, async(req,res)=>{

  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


// Cancel booking (only within 1 hour of BOOKING CREATION time, not scheduled time)

router.delete("/:id", authMiddleware, async(req,res)=>{

  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // NEW RULE: Can only cancel within 1 hour of BOOKING CREATION (createdAt)
    // NOT 1 hour before the scheduled booking time
    const bookingCreatedTime = new Date(booking.createdAt);
    const cancellationDeadline = new Date(bookingCreatedTime.getTime() + 60 * 60 * 1000); // +1 hour
    const now = new Date();

    if (now > cancellationDeadline) {
      const minutesElapsed = Math.floor((now - bookingCreatedTime) / 60000);
      return res.status(400).json({
        message: `Cannot cancel - you booked this ${minutesElapsed} minutes ago. Cancellations only allowed within 1 hour of booking.`,
        canCancel: false,
        bookedAt: bookingCreatedTime,
        deadline: cancellationDeadline,
        minutesElapsed: minutesElapsed
      });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = "User requested cancellation";
    await booking.save();

    // Send cancellation emails (non-blocking)
    try {
      await sendCancellationEmailToCustomer(booking);
      await sendCancellationEmailToOwner(booking);
    } catch (emailError) {
      console.log('Cancellation email failed:', emailError.message);
    }

    res.json({ 
      message: "Booking cancelled successfully",
      canCancel: true,
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


// Create payment order

router.post("/payment/create-order", authMiddleware, async(req,res)=>{

  try {
    const { bookingId, amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: bookingId
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


// Verify payment

router.post("/payment/verify", authMiddleware, async(req,res)=>{

  try {
    const { bookingId, paymentId } = req.body;

    const booking = await Booking.findById(bookingId);

    if (booking.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    booking.paymentId = paymentId;
    booking.paymentStatus = "completed";
    booking.status = "confirmed";
    await booking.save();

    res.json({ message: "Payment verified successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});

module.exports = router;