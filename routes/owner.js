const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { validateBookingRequest, isSlotAvailable } = require('../utils/validation');

// GET /api/owner/bookings - List all bookings
router.get('/bookings', async (req, res) => {
    try {
        // Mongoose sort: { field: 1 (asc) or -1 (desc) }
        const bookings = await Booking.find().sort({ booking_date: 1, time_slot: 1 });
        res.json(bookings);
    } catch (error) {
        console.error('Owner Fetch Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/owner/bookings - Manual booking
router.post('/bookings', async (req, res) => {
    try {
        // Validate Mandatory Fields
        const validation = validateBookingRequest(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
        }

        const { customer_name, phone_number, guest_count, booking_date, time_slot } = req.body;

        // Conflict Prevention
        const available = await isSlotAvailable(booking_date, time_slot);
        if (!available) {
            return res.status(409).json({ error: 'This time slot is fully booked (Table Limit Reached).' });
        }

        // Create Booking
        const newBooking = new Booking({
            customer_name,
            phone_number,
            guest_count,
            booking_date,
            time_slot,
            status: 'Confirmed', // Manual bookings are confirmed by default? Or Pending? Original code said Confirmed.
            source: 'Manual'
        });

        await newBooking.save();

        res.status(201).json({ message: 'Manual booking added successfully.', booking: newBooking });

    } catch (error) {
        console.error('Owner Booking Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
