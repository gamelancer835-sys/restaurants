const Booking = require('../models/Booking');

const MAX_TABLES = 10; // Hardcoded limit

// Validate mandatory fields
function validateBookingRequest(body) {
    const requiredFields = ['customer_name', 'phone_number', 'guest_count', 'booking_date', 'time_slot'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
        return { isValid: false, message: `Missing required fields: ${missingFields.join(', ')}` };
    }

    // Phone Validation: 10 digits only
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(body.phone_number)) {
        return { isValid: false, message: 'Please enter a valid 10-digit mobile number' };
    }

    // Guest Count Validation: 1-20
    const guests = parseInt(body.guest_count, 10);
    if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
        return { isValid: false, message: 'Guest count must be between 1 and 20' };
    }

    // Time Slot Validation: 10 AM - 11 PM
    const [hour, minute] = body.time_slot.split(':').map(Number);
    if (hour < 10 || hour > 23 || (hour === 23 && minute > 0)) {
        return { isValid: false, message: 'Bookings are only allowed between 10:00 AM and 11:00 PM' };
    }
    return { isValid: true };
}

// Check if date/time is in the past
function isDateInPast(dateStr, timeStr) {
    const dateTimeString = `${dateStr} ${timeStr}`;
    const bookingTime = new Date(dateTimeString);
    const now = new Date();

    return bookingTime < now;
}

// Check slot availability (Conflict Prevention)
async function isSlotAvailable(date, time) {
    // Count bookings for this slot where status is NOT Cancelled
    const count = await Booking.countDocuments({
        booking_date: date,
        time_slot: time,
        status: { $ne: 'Cancelled' }
    });

    return count < MAX_TABLES;
}

// Mongoose doesn't strictly need the transaction passed around for simple reads, 
// but if we were using sessions we would. For now, we'll just reuse the main logic 
// or if we really want to support 'session' argument:
async function isSlotAvailableWithTransaction(date, time, session) {
    const count = await Booking.countDocuments({
        booking_date: date,
        time_slot: time,
        status: { $ne: 'Cancelled' }
    }).session(session);
    return count < MAX_TABLES;
}

module.exports = { validateBookingRequest, isDateInPast, isSlotAvailable, isSlotAvailableWithTransaction };
