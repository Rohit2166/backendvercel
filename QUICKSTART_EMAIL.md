# Email & Cancellation Feature - Quick Reference

## 🚀 Quick Start

### Setup Required (Backend)
1. Configure Gmail App Password in `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```
2. Ensure MongoDB is running
3. Run backend: `npm run dev`

### ✅ Automatic Emails Sent

#### When booking is created:
- ✉️ **Customer** → Confirmation email with full booking details
- ✉️ **Owner** → New booking notification with customer info

#### When booking is cancelled:
- ✉️ **Customer** → Cancellation confirmation + refund info
- ✉️ **Owner** → Cancellation notification + time slot availability

---

## 📱 Frontend Integration

### 1. Check Cancellation Eligibility

```javascript
// Before showing cancel button, check if user can still cancel
const checkCancellation = async (bookingId) => {
  const response = await fetch(`/api/bookings/${bookingId}/check-cancel`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  const data = await response.json();
  
  return {
    canCancel: data.canCancel,
    minutesRemaining: data.minutesRemaining,
    message: data.message
  };
};

// Usage in component
const booking = /* ... */;
const { canCancel, minutesRemaining } = await checkCancellation(booking._id);

if (canCancel) {
  // Show cancel button with timer
  console.log(`${minutesRemaining} minutes left to cancel`);
} else {
  // Show disabled button with message
  console.log('Cancellation window has expired');
}
```

### 2. Cancel Booking

```javascript
const cancelBooking = async (bookingId) => {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      // Success - booking cancelled
      // Both customer and owner will receive emails
      return { success: true, message: 'Booking cancelled successfully' };
    } else {
      const error = await response.json();
      // Error - cannot cancel (time expired)
      return { success: false, message: error.message };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
};
```

### 3. Display Cancellation Timer

```javascript
import { useEffect, useState } from 'react';

const CancellationTimer = ({ booking }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [canCancel, setCanCancel] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const response = await fetch(`/api/bookings/${booking._id}/check-cancel`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      
      setCanCancel(data.canCancel);
      setTimeRemaining(data.minutesRemaining);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [booking._id]);

  if (!canCancel) {
    return <p className="text-red-500">Cannot cancel - booking is locked</p>;
  }

  return (
    <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
      <p className="text-amber-800">
        ⏰ Cancel within <strong>{timeRemaining} minutes</strong>
      </p>
      <button onClick={() => cancelBooking(booking._id)}>
        Cancel Booking
      </button>
    </div>
  );
};
```

### 4. Show Booking Details with Email Status

```javascript
const BookingCard = ({ booking }) => {
  return (
    <div className="booking-card">
      <h3>{booking.groundName}</h3>
      <p>{booking.bookingDate} - {booking.timeSlot}</p>
      <p className="text-green-600">✅ Confirmation email sent</p>
      
      {/* Show different UI based on booking age */}
      {isWithinCancellationWindow(booking.createdAt) ? (
        <CancellationTimer booking={booking} />
      ) : (
        <p className="text-red-600">❌ Cannot cancel - 1 hour window expired</p>
      )}
    </div>
  );
};

// Helper function
const isWithinCancellationWindow = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const minutesElapsed = (now - created) / (1000 * 60);
  return minutesElapsed < 60;
};
```

---

## 📧 Email Templates

### Booking Confirmation Email
- Customer receives: Full booking details + cancellation policy
- Shows: 1-hour cancellation window clearly

### Booking Notification Email (to Owner)
- Owner receives: Customer details + booking info
- Shows: Action required message

### Cancellation Email (Customer)
- Shows: Cancellation details + refund information
- Mentions: Refund within 3-5 business days

### Cancellation Email (Owner)
- Shows: Cancelled booking details
- Mentions: Time slot now available for new bookings

---

## 🔍 API Response Examples

### Check Cancellation Eligibility - Success
```json
{
  "bookingId": "507f1f77bcf86cd799439011",
  "canCancel": true,
  "status": "confirmed",
  "bookedAt": "2026-02-23T10:30:00Z",
  "deadline": "2026-02-23T11:30:00Z",
  "minutesElapsed": 15,
  "minutesRemaining": 45,
  "message": "You have 45 minute(s) left to cancel this booking"
}
```

### Check Cancellation Eligibility - Expired
```json
{
  "bookingId": "507f1f77bcf86cd799439011",
  "canCancel": false,
  "status": "confirmed",
  "bookedAt": "2026-02-23T10:30:00Z",
  "deadline": "2026-02-23T11:30:00Z",
  "minutesElapsed": 75,
  "minutesRemaining": 0,
  "message": "Cannot cancel - you booked this 75 minutes ago. Cancellations only allowed within 1 hour of booking."
}
```

### Cancel Booking - Success
```json
{
  "message": "Booking cancelled successfully",
  "canCancel": true,
  "booking": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "cancelled",
    "cancelledAt": "2026-02-23T10:50:00Z",
    "cancellationReason": "User requested cancellation"
  }
}
```

### Cancel Booking - Error
```json
{
  "message": "Cannot cancel - you booked this 65 minutes ago. Cancellations only allowed within 1 hour of booking.",
  "canCancel": false,
  "bookedAt": "2026-02-23T10:30:00Z",
  "deadline": "2026-02-23T11:30:00Z",
  "minutesElapsed": 65
}
```

---

## 🐛 Troubleshooting

### Emails Not Received
1. Check spam/junk folder
2. Verify EMAIL_USER and EMAIL_PASSWORD in backend .env
3. Check backend console for email errors
4. Ensure Gmail App Password is correct (16 characters)

### Cannot Cancel (But Should Be Able To)
1. Check server time is correct
2. Verify booking `createdAt` timestamp
3. Call `GET /api/bookings/:id/check-cancel` to see deadline
4. Ensure you have valid auth token

### Cancellation Allowed (But Shouldn't Be)
1. Check backend time synchronization
2. Verify cancellation deadline calculation
3. See: `createdAt + 60 minutes = deadline`

---

## 📝 Key Points

- **Email sending is asynchronous** - Doesn't block booking/cancellation
- **1-hour window starts at** `booking.createdAt` (creation time)
- **Emails are optional** - System works even if emails fail
- **Refunds are full** - If cancelled within 1 hour window
- **Cancellation is permanent** - No recovery after expiry window

---

## 📚 Full Documentation

For comprehensive information, see [Email & Cancellation Guide](./EMAIL_AND_CANCELLATION_GUIDE.md)
