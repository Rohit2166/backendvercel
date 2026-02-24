const nodemailer = require('nodemailer');

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Send booking confirmation email to customer
const sendBookingConfirmationEmail = async (booking) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: booking.userEmail,
      subject: `Booking Confirmed - ${booking.groundName} | CricBox`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            
            <h2 style="color: #333; text-align: center;">🎉 Booking Confirmed!</h2>
            
            <p style="color: #555; font-size: 16px;">Hi ${booking.userName},</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #22c55e; margin: 20px 0;">
              <h3 style="color: #22c55e; margin-top: 0;">Booking Details</h3>
              
              <p><strong>Turf Name:</strong> ${booking.groundName}</p>
              <p><strong>Sport:</strong> ${booking.sportType.charAt(0).toUpperCase() + booking.sportType.slice(1)}</p>
              <p><strong>Location:</strong> ${booking.location}</p>
              <p><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p><strong>Time Slot:</strong> ${booking.timeSlot}</p>
              <p><strong>Price:</strong> ₹${booking.price}</p>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
            </div>

            <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;"><strong>⏰ Important:</strong> You can cancel this booking only within 1 hour of making this booking. After 1 hour, cancellation is not allowed.</p>
            </div>

            <div style="margin: 30px 0;">
              <p>Thank you for booking with <strong>CricBox</strong>! We hope you enjoy your game.</p>
              <p style="color: #666; font-size: 14px;">If you have any questions, please contact us at support@cricbox.com</p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd;">
            
            <p style="text-align: center; color: #999; font-size: 12px;">© 2026 CricBox. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation email sent to ${booking.userEmail}`);
  } catch (error) {
    console.error('❌ Error sending booking email:', error.message);
  }
};

// Send booking notification email to owner
const sendBookingNotificationToOwner = async (booking) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: booking.ownerEmail,
      subject: `New Booking - ${booking.groundName} | CricBox`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            
            <h2 style="color: #333; text-align: center;">📅 New Booking Received!</h2>
            
            <div style="background-color: #dbeafe; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Customer Details</h3>
              
              <p><strong>Customer Name:</strong> ${booking.userName}</p>
              <p><strong>Customer Email:</strong> ${booking.userEmail}</p>
            </div>

            <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #22c55e; margin: 20px 0;">
              <h3 style="color: #166534; margin-top: 0;">Booking Information</h3>
              
              <p><strong>Turf:</strong> ${booking.groundName}</p>
              <p><strong>Sport:</strong> ${booking.sportType.charAt(0).toUpperCase() + booking.sportType.slice(1)}</p>
              <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p><strong>Time Slot:</strong> ${booking.timeSlot}</p>
              <p><strong>Price:</strong> ₹${booking.price}</p>
              <p><strong>Status:</strong> ${booking.status.toUpperCase()}</p>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
            </div>

            <div style="background-color: #e0e7ff; padding: 20px; border-left: 4px solid #6366f1; margin: 20px 0;">
              <h3 style="color: #3730a3; margin-top: 0;">Action Required</h3>
              <p>Please ensure your turf is ready for the customer at the scheduled time. If there are any issues, please contact the customer immediately at ${booking.userEmail}.</p>
            </div>

            <div style="margin: 30px 0;">
              <p>You have received a new booking for your turf. Please ensure the ground is ready for the customer.</p>
              <p style="color: #666; font-size: 14px;">Log in to your CricBox account to manage this booking.</p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd;">
            
            <p style="text-align: center; color: #999; font-size: 12px;">© 2026 CricBox. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Booking notification email sent to ${booking.ownerEmail}`);
  } catch (error) {
    console.error('❌ Error sending owner notification:', error.message);
  }
};

// Send cancellation email to customer
const sendCancellationEmailToCustomer = async (booking) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: booking.userEmail,
      subject: `Booking Cancelled - ${booking.groundName} | CricBox`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            
            <h2 style="color: #dc2626; text-align: center;">❌ Booking Cancelled</h2>
            
            <p style="color: #555; font-size: 16px;">Hi ${booking.userName},</p>
            
            <div style="background-color: #fee2e2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3 style="color: #991b1b; margin-top: 0;">Cancellation Details</h3>
              
              <p><strong>Turf:</strong> ${booking.groundName}</p>
              <p><strong>Sport:</strong> ${booking.sportType.charAt(0).toUpperCase() + booking.sportType.slice(1)}</p>
              <p><strong>Location:</strong> ${booking.location}</p>
              <p><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p><strong>Time Slot:</strong> ${booking.timeSlot}</p>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
              <p><strong>Cancelled On:</strong> ${booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString('en-IN') : 'Just now'}</p>
            </div>

            <div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-radius: 5px;">
              <p style="color: #92400e; margin: 0;"><strong>💚 Refund Status:</strong> Your full amount of ₹${booking.price} will be refunded to your account within 3-5 business days.</p>
            </div>

            <div style="margin: 30px 0;">
              <p>We hope to see you next time! Feel free to browse other turfs and make new bookings on CricBox.</p>
              <p style="color: #666; font-size: 14px;">If you have any questions about the cancellation or refund, please contact us at support@cricbox.com</p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd;">
            
            <p style="text-align: center; color: #999; font-size: 12px;">© 2026 CricBox. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Cancellation email sent to ${booking.userEmail}`);
  } catch (error) {
    console.error('❌ Error sending cancellation email:', error.message);
  }
};

// Send cancellation notification to owner
const sendCancellationEmailToOwner = async (booking) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: booking.ownerEmail,
      subject: `Booking Cancelled - ${booking.groundName} | CricBox`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            
            <h2 style="color: #dc2626; text-align: center;">❌ Booking Cancelled</h2>
            
            <div style="background-color: #fee2e2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3 style="color: #991b1b; margin-top: 0;">Cancellation Details</h3>
              
              <p><strong>Customer Name:</strong> ${booking.userName}</p>
              <p><strong>Customer Email:</strong> ${booking.userEmail}</p>
              <p><strong>Turf:</strong> ${booking.groundName}</p>
              <p><strong>Sport:</strong> ${booking.sportType.charAt(0).toUpperCase() + booking.sportType.slice(1)}</p>
              <p><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p><strong>Time Slot:</strong> ${booking.timeSlot}</p>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
              <p><strong>Cancelled On:</strong> ${booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString('en-IN') : 'Just now'}</p>
            </div>

            <div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-radius: 5px;">
              <p style="color: #92400e; margin: 0;"><strong>ℹ️ Note:</strong> The customer has cancelled their booking. The time slot is now available for new bookings.</p>
            </div>

            <div style="margin: 30px 0;">
              <p>You can now accept new bookings for this time slot on the CricBox platform.</p>
              <p style="color: #666; font-size: 14px;">If you have any questions, please contact us at support@cricbox.com</p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd;">
            
            <p style="text-align: center; color: #999; font-size: 12px;">© 2026 CricBox. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Cancellation notification sent to ${booking.ownerEmail}`);
  } catch (error) {
    console.error('❌ Error sending owner cancellation email:', error.message);
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  sendBookingNotificationToOwner,
  sendCancellationEmailToCustomer,
  sendCancellationEmailToOwner
};
