# CricBox - Email & Booking Cancellation Features

## Overview
This document describes the completed email notification system and booking cancellation feature for the CricBox turf booking application.

## Features Implemented

### 1. Email Notifications on Booking Creation
When a turf booking is created, automated emails are sent to both the customer and the turf owner.

#### Customer Email
- **Trigger**: When booking is created
- **Content**:
  - Booking confirmation message
  - Turf details (name, sport, location, date, time slot)
  - Price information
  - Booking ID
  - Cancellation policy (1-hour window)
  - Contact information

#### Owner Email
- **Trigger**: When booking is created
- **Content**:
  - New booking notification
  - Customer details (name, email)
  - Turf details (name, sport, date, time slot)
  - Booking ID and payment status
  - Action required message

### 2. Email Notifications on Booking Cancellation
When a booking is cancelled, both customer and owner receive confirmation emails.

#### Customer Cancellation Email
- **Trigger**: When booking is cancelled
- **Content**:
  - Cancellation confirmation
  - Booking details
  - Refund information (Full refund within 3-5 business days)
  - Contact support information

#### Owner Cancellation Email
- **Trigger**: When booking is cancelled
- **Content**:
  - Cancellation notification
  - Customer and booking details
  - Time slot availability notification
  - Information that the slot is now available for new bookings

### 3. Booking Cancellation Feature
- **1-Hour Cancellation Window**: Users can only cancel bookings within 1 hour of creating the booking
- **After 1 Hour**: Cancellations are not allowed
- **Automatic Status Update**: Booking status changes from "pending/confirmed" to "cancelled"
- **Cancellation Tracking**: System tracks when cancellation occurred and reason

## API Endpoints

### Create Booking
```
POST /api/bookings/create
Headers: Authorization: Bearer <token>

Request Body:
{
  "groundId": "ground_id",
  "bookingDate": "2026-02-25",
  "timeSlot": "10:00 AM - 11:00 AM"
}

Response:
{
  "message": "Booking created successfully",
  "booking": {
    "_id": "booking_id",
    "userId": "user_id",
    "groundId": "ground_id",
    "groundName": "Cricket Ground A",
    "sportType": "cricket",
    "location": "Delhi",
    "bookingDate": "2026-02-25",
    "timeSlot": "10:00 AM - 11:00 AM",
    "price": 500,
    "status": "pending",
    "userEmail": "user@example.com",
    "ownerEmail": "owner@example.com",
    "createdAt": "2026-02-23T10:30:00Z"
  }
}
```

### Check Cancellation Eligibility
```
GET /api/bookings/:id/check-cancel
Headers: Authorization: Bearer <token>

Response:
{
  "bookingId": "booking_id",
  "canCancel": true,
  "status": "confirmed",
  "bookedAt": "2026-02-23T10:30:00Z",
  "deadline": "2026-02-23T11:30:00Z",
  "minutesElapsed": 25,
  "minutesRemaining": 35,
  "message": "You have 35 minute(s) left to cancel this booking"
}
```

### Cancel Booking
```
DELETE /api/bookings/:id
Headers: Authorization: Bearer <token>

Response (Success - Within 1 hour):
{
  "message": "Booking cancelled successfully",
  "canCancel": true,
  "booking": {
    "_id": "booking_id",
    "status": "cancelled",
    "cancelledAt": "2026-02-23T10:50:00Z",
    "cancellationReason": "User requested cancellation"
  }
}

Response (Error - After 1 hour):
{
  "message": "Cannot cancel - you booked this 65 minutes ago. Cancellations only allowed within 1 hour of booking.",
  "canCancel": false,
  "bookedAt": "2026-02-23T10:30:00Z",
  "deadline": "2026-02-23T11:30:00Z",
  "minutesElapsed": 65
}
```

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the backend directory with the following variables:

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017/cricbox

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server Port
PORT=5000

# Other configurations
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
JWT_SECRET=your_secret
```

### 2. Gmail Setup (for Email Sending)

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification

#### Step 2: Create App Password
1. Go to [Google Account App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer" (or your device)
3. Generate app password
4. Copy the generated 16-character password
5. Use this password as `EMAIL_PASSWORD` in `.env`

#### Step 3: Enable Less Secure App Access (Alternative Method)
If you don't want to use App Passwords:
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Scroll down to "Less secure app access"
3. Enable it

### 3. Install Required Dependencies
```bash
npm install nodemailer
```

The following packages should already be installed:
- express
- mongoose
- dotenv
- cors

### 4. Verify Setup
Test the email service by creating a booking and checking your email.

## Email Service Implementation Details

### Mail Service Functions

#### sendBookingConfirmationEmail(booking)
Sends confirmation email to customer when booking is created.

**Parameters:**
- `booking`: Booking document with all details

**Implementation:** [backend/utils/mailService.js](../../backend/utils/mailService.js)

#### sendBookingNotificationToOwner(booking)
Sends notification email to turf owner when new booking is created.

**Parameters:**
- `booking`: Booking document with all details

**Implementation:** [backend/utils/mailService.js](../../backend/utils/mailService.js)

#### sendCancellationEmailToCustomer(booking)
Sends cancellation confirmation email to customer.

**Parameters:**
- `booking`: Booking document with cancellation details

**Implementation:** [backend/utils/mailService.js](../../backend/utils/mailService.js)

#### sendCancellationEmailToOwner(booking)
Sends cancellation notification email to turf owner.

**Parameters:**
- `booking`: Booking document with cancellation details

**Implementation:** [backend/utils/mailService.js](../../backend/utils/mailService.js)

## Booking Model Updates

The Booking model has been updated with the following fields:

```javascript
{
  userId: ObjectId,              // Reference to User
  groundId: ObjectId,            // Reference to Ground
  groundName: String,            // Turf name
  sportType: String,             // Sport type
  location: String,              // Location
  bookingDate: Date,             // Scheduled booking date
  timeSlot: String,              // Time slot
  price: Number,                 // Booking price
  status: String,                // "pending", "confirmed", "cancelled"
  paymentStatus: String,         // "pending", "completed", "failed"
  paymentId: String,             // Razorpay payment ID
  notes: String,                 // Additional notes
  cancelledAt: Date,             // When booking was cancelled
  cancellationReason: String,    // Reason for cancellation
  ownerEmail: String,            // Owner email for notifications
  userEmail: String,             // Customer email for notifications
  userName: String,              // Customer name for emails
  createdAt: Date                // Booking creation time (for 1-hour window)
}
```

## Cancellation Logic

The 1-hour cancellation window is calculated from the **booking creation time** (`createdAt`), not from the scheduled booking time.

### Example Timeline:
```
Booking Created: 10:30 AM
Cancellation Deadline: 11:30 AM (exactly 1 hour later)

✅ Can Cancel: 10:30 AM - 11:30 AM
❌ Cannot Cancel: After 11:30 AM
```

### API Response Information:
- `minutesElapsed`: Minutes since booking was created
- `minutesRemaining`: Minutes left to cancel (if can still cancel)
- `canCancel`: Boolean indicating if cancellation is allowed
- `deadline`: Exact DateTime when cancellation window closes

## Error Handling

All email operations are non-blocking. If an email fails to send:
1. The booking is still created successfully
2. Error is logged to console
3. User is not notified of email failure
4. System continues to operate normally

This ensures email issues don't prevent bookings or cancellations.

## Testing the Features

### Test Booking Creation with Email:
1. Create a new booking through the API
2. Check customer email for confirmation
3. Check owner email for new booking notification
4. Verify booking details in both emails are correct

### Test Cancellation Feature:
1. Create a new booking
2. Immediately call `GET /api/bookings/:id/check-cancel`
3. Should return `canCancel: true` with remaining minutes
4. Cancel the booking with `DELETE /api/bookings/:id`
5. Check both customer and owner cancellation emails
6. Create another booking and wait 61+ minutes
7. Try to cancel - should get error message
8. Verify `canCancel: false` response

## Troubleshooting

### Emails Not Sending
1. Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
2. Check Gmail App Password setup
3. Verify Gmail account security settings
4. Check backend logs for error messages
5. Ensure MongoDB connection is working

### Wrong Email Address
1. Verify Ground model has `ownerId` populated
2. Check User model has correct `email` field
3. Verify booking creation stores correct email addresses

### Cancellation Not Working
1. Verify `createdAt` field in Booking model
2. Check server time is correct
3. Verify booking status before cancellation attempt
4. Ensure user ID matches booking userId (authorization check)

## Files Modified

1. **[backend/routes/bookingRoutes.js](../../backend/routes/bookingRoutes.js)**
   - Fixed email function calls in booking creation
   - Fixed email function calls in cancellation
   - Added `GET /:id/check-cancel` endpoint

2. **[backend/utils/mailService.js](../../backend/utils/mailService.js)**
   - Updated email function signatures
   - Enhanced email templates with better formatting
   - Added comprehensive booking and cancellation details

3. **[backend/models/Booking.js](../../backend/models/Booking.js)**
   - Already had `cancelledAt` and `cancellationReason` fields
   - Model supports all required features

4. **[backend/.env.example](../../backend/.env.example)**
   - Created example environment configuration

## Frontend Integration

For frontend integration, implement:

1. **Show Cancellation Eligibility:**
   ```javascript
   // Call check-cancel endpoint before showing cancel button
   const response = await fetch(`/api/bookings/${bookingId}/check-cancel`);
   const data = await response.json();
   
   if (data.canCancel) {
     // Show cancel button with remaining time
     console.log(`${data.minutesRemaining} minutes left to cancel`);
   } else {
     // Show message that cancellation is not allowed
     console.log(data.message);
   }
   ```

2. **Cancel Booking:**
   ```javascript
   const response = await fetch(`/api/bookings/${bookingId}`, {
     method: 'DELETE',
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   
   if (response.ok) {
     // Booking cancelled successfully
     // Show confirmation message
   } else {
     // Handle cancellation error
     const error = await response.json();
     console.log(error.message);
   }
   ```

3. **Display Cancellation Timer:**
   - Show countdown timer for remaining cancellation time
   - Update every second using JavaScript intervals
   - Hide cancel button when time expires

## Security Considerations

1. **Email Address Protection**: Email addresses are stored in booking for notifications only
2. **Authorization**: All cancellation requests require user authentication
3. **User ID Verification**: System verifies user owns the booking before allowing cancellation
4. **Non-blocking Emails**: Email failures don't compromise booking data
5. **Error Messages**: Detailed error messages guide users without exposing system internals

## Future Enhancements

1. **Partial Refunds**: Implement sliding scale refunds based on cancellation timing
2. **Email Templates**: Use more advanced template engine (Handlebars, EJS)
3. **SMS Notifications**: Add SMS alerts for bookings and cancellations
4. **Email Verification**: Verify email addresses before sending
5. **Cancellation Analytics**: Track cancellation patterns and reasons
6. **Customizable Email Templates**: Allow owners to customize email content
7. **Multilingual Emails**: Support multiple languages for international users
8. **Email Resend**: Implement retry mechanism for failed emails

## Support

For issues or questions regarding email setup or cancellation feature, refer to the troubleshooting section above or contact the development team.
