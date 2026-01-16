// Set minimum date to today
const dateInput = document.getElementById('booking_date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

const form = document.getElementById('booking-form');
const loading = document.getElementById('loading');
const errorMsg = document.getElementById('error-msg');
const successModal = document.getElementById('success-modal');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset UI
        loading.classList.remove('hidden');
        errorMsg.classList.add('hidden');
        errorMsg.textContent = '';

        const formData = {
            customer_name: form.customer_name.value,
            phone_number: form.phone_number.value,
            guest_count: form.guest_count.value,
            booking_date: form.booking_date.value,
            time_slot: form.time_slot.value
        };

        try {
            const response = await createBooking(formData);
            const data = await response.json();

            if (response.ok) {
                // Success
                document.getElementById('confirmed-name').textContent = data.booking.customer_name;
                document.getElementById('confirmed-date').textContent = data.booking.booking_date;
                document.getElementById('confirmed-time').textContent = data.booking.time_slot;
                document.getElementById('booking-id').textContent = data.booking.booking_id;

                successModal.classList.remove('hidden');
            } else {
                // API Error (Validation, Conflict, etc)
                throw new Error(data.error || 'Failed to create booking');
            }
        } catch (error) {
            errorMsg.textContent = error.message;
            errorMsg.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
        }
    });
}
