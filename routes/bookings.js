const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { validateBookingRequest, isDateInPast, isSlotAvailable } = require('../utils/validation');

// POST /api/bookings - Create a new booking
router.post('/', async (req, res) => {
    try {
        // 1. Validate Mandatory Fields & Constraints
        const validation = validateBookingRequest(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
        }

        const { customer_name, phone_number, guest_count, booking_date, time_slot } = req.body;

        // 2. Past Date Prevention
        if (isDateInPast(booking_date, time_slot)) {
            return res.status(400).json({ error: 'Cannot book for a past date or time.' });
        }

        // 3. Concurrency Safe Booking Creation
        // With Mongoose, we can use a simpler approach for this demo or a session if precise ACID is needed.
        // We will do a check then save.

        const available = await isSlotAvailable(booking_date, time_slot);
        if (!available) {
            return res.status(409).json({ error: 'This time slot is fully booked.' });
        }

        const newBooking = new Booking({
            customer_name,
            phone_number,
            guest_count,
            booking_date,
            time_slot,
            status: 'Pending',
            source: 'Online'
        });

        await newBooking.save();

        res.status(201).json({ message: 'Booking created successfully.', booking: newBooking });

    } catch (error) {
        console.error('Booking Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, ...updates } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (status) booking.status = status;

        if (updates.booking_date || updates.time_slot) {
            const newDate = updates.booking_date || booking.booking_date;
            const newTime = updates.time_slot || booking.time_slot;

            if (newDate !== booking.booking_date || newTime !== booking.time_slot) {
                const available = await isSlotAvailable(newDate, newTime);
                if (!available) {
                    return res.status(409).json({ error: 'New time slot is fully booked.' });
                }
            }
            // Update fields
            Object.keys(updates).forEach(key => {
                booking[key] = updates[key];
            });
        }

        await booking.save();
        res.json({ message: 'Booking updated', booking });

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findByIdAndDelete(id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted successfully' });

    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
