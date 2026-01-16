const API_BASE = '/api';

// Public Create
async function createBooking(data) {
    const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response;
}

// Owner Fetch All
async function getOwnerBookings() {
    const response = await fetch(`${API_BASE}/owner/bookings`);
    return await response.json();
}

// Owner Manual Create
async function createManualBooking(data) {
    const response = await fetch(`${API_BASE}/owner/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response;
}

// Update Status (Confirm)
async function updateBookingStatus(id, status) {
    const response = await fetch(`${API_BASE}/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    return response;
}

// Delete Booking
async function deleteBooking(id) {
    const response = await fetch(`${API_BASE}/bookings/${id}`, {
        method: 'DELETE'
    });
    return response;
}
