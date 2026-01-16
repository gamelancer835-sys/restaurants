const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    customer_name: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },
    guest_count: {
        type: Number,
        required: true,
        min: 1,
        max: 20
    },
    booking_date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    time_slot: {
        type: String, // HH:mm
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
        default: 'Pending'
    },
    source: {
        type: String,
        default: 'Online'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to help with concurrency/uniqueness if we wanted strict uniqueness at DB level,
// but for slots, we allow multiple bookings until a limit.
// For now, we'll rely on app logic for slot limits.

module.exports = mongoose.model('Booking', BookingSchema);
