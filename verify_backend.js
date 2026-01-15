const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowDate = tomorrow.toISOString().split('T')[0];

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayDate = yesterday.toISOString().split('T')[0];

const TEST_SLOT = '19:00';

async function runTests() {
    console.log('Starting Verification...\n');

    try {
        // 1. Happy Path: valid booking
        console.log('Test 1: Create Valid Booking (Public)');
        await axios.post(`${BASE_URL}/bookings`, {
            customer_name: 'John Doe',
            phone_number: '1234567890',
            guest_count: 2,
            booking_date: tomorrowDate,
            time_slot: TEST_SLOT
        });
        console.log('✅ Passed\n');

        // 2. Validation: Missing Fields
        console.log('Test 2: Validation Check (Missing Name)');
        try {
            await axios.post(`${BASE_URL}/bookings`, {
                phone_number: '1234567890',
                guest_count: 2,
                booking_date: tomorrowDate,
                time_slot: TEST_SLOT
            });
            console.log('❌ Failed: Should have rejected missing name\n');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Passed (Got 400 Bad Request)\n');
            } else {
                console.log(`❌ Failed: Unexpected error ${error.message}\n`);
            }
        }

        // 3. Past Date Prevention
        console.log('Test 3: Past Date Prevention');
        try {
            await axios.post(`${BASE_URL}/bookings`, {
                customer_name: 'Time Traveler',
                phone_number: '123',
                guest_count: 2,
                booking_date: yesterdayDate,
                time_slot: TEST_SLOT
            });
            console.log('❌ Failed: Should have rejected past date\n');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Passed (Got 400 Bad Request)\n');
            } else {
                console.log(`❌ Failed: Unexpected error ${error.message}\n`);
            }
        }

        // 4. Fill up the slot (Conflict Prevention)
        console.log('Test 4.1: Filling up the slot (MAX = 10)');
        // We already have 1 booking from Test 1. We need 9 more.
        for (let i = 0; i < 9; i++) {
            await axios.post(`${BASE_URL}/bookings`, {
                customer_name: `Guest ${i + 2}`,
                phone_number: '123',
                guest_count: 2,
                booking_date: tomorrowDate,
                time_slot: TEST_SLOT
            });
        }
        console.log('✅ Filled 10 slots\n');

        console.log('Test 4.2: Attempt 11th Booking (Public)');
        try {
            await axios.post(`${BASE_URL}/bookings`, {
                customer_name: 'Overflow Guest',
                phone_number: '123',
                guest_count: 2,
                booking_date: tomorrowDate,
                time_slot: TEST_SLOT
            });
            console.log('❌ Failed: Should have been rejected due to conflict\n');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('✅ Passed (Got 409 Conflict)\n');
            } else {
                console.log(`❌ Failed: Unexpected error ${error.message}\n`);
            }
        }

        // 5. Owner Dashboard Logic
        console.log('Test 5: Owner List View');
        const ownerRes = await axios.get(`${BASE_URL}/owner/bookings`);
        if (ownerRes.data.length >= 10) {
            console.log(`✅ Passed (Retrieved ${ownerRes.data.length} bookings)\n`);
        } else {
            console.log(`❌ Failed: Expected at least 10 bookings, got ${ownerRes.data.length}\n`);
        }

        // 6. Owner Bypass Rules
        console.log('Test 6.1: Owner Past Date (Should Succeed)');
        try {
            await axios.post(`${BASE_URL}/owner/bookings`, {
                customer_name: 'Owner Past',
                phone_number: '000',
                guest_count: 1,
                booking_date: yesterdayDate,
                time_slot: TEST_SLOT
            });
            console.log('✅ Passed (Owner created past booking)\n');
        } catch (error) {
            console.log(`❌ Failed: Owner should bypass past date. Got ${error.message}\n`);
        }

        console.log('Test 6.2: Owner Conflict Limit (Should Fail if rules apply)');
        // Current slot usage: 10 (from public). Owner tries 11th.
        // Prompt says: "follows the same conflict prevention rules". So this SHOULD fail.
        try {
            await axios.post(`${BASE_URL}/owner/bookings`, {
                customer_name: 'Owner Overflow',
                phone_number: '000',
                guest_count: 1,
                booking_date: tomorrowDate,
                time_slot: TEST_SLOT
            });
            console.log('❌ Failed: Owner should NOT bypass table limit\n');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('✅ Passed (Got 409 Conflict - Limit Enforced)\n');
            } else {
                console.log(`❌ Failed: Unexpected error ${error.message}\n`);
            }
        }

    } catch (error) {
        console.error('Test Script Error:', error);
    }

    // 7. Update & Delete (New Features)
    console.log('Test 7: Update and Delete');
    try {
        // Create a temp booking
        const res = await axios.post(`${BASE_URL}/bookings`, {
            customer_name: 'To Delete',
            phone_number: '999',
            guest_count: 1,
            booking_date: tomorrowDate,
            time_slot: '20:00' // Different slot
        });
        const bookingId = res.data.booking.booking_id;

        // Confirm it
        console.log('Test 7.1: Confirm Booking');
        const confirmRes = await axios.put(`${BASE_URL}/bookings/${bookingId}`, { status: 'Confirmed' });
        if (confirmRes.data.booking.status === 'Confirmed') {
            console.log('✅ Passed (Status Updated)\n');
        } else {
            console.log('❌ Failed: Status not updated\n');
        }

        // Delete it
        console.log('Test 7.2: Delete Booking');
        await axios.delete(`${BASE_URL}/bookings/${bookingId}`);

        // Verify deletion
        try {
            await axios.put(`${BASE_URL}/bookings/${bookingId}`, { status: 'Confirmed' });
            console.log('❌ Failed: Should have 404ed on deleted booking\n');
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.log('✅ Passed (Booking Deleted)\n');
            }
        }

    } catch (error) {
        console.error('Update/Delete Test Error:', error);
    }

    // 8. Strict Validation Tests
    console.log('Test 8: Strict Validation');

    // 8.1 Phone
    try {
        await axios.post(`${BASE_URL}/bookings`, {
            customer_name: 'Test Phone', phone_number: '123', guest_count: 2, booking_date: tomorrowDate, time_slot: '12:00'
        });
        console.log('❌ Failed: Should reject invalid phone\n');
    } catch (e) {
        if (e.response && e.response.status === 400 && e.response.data.error.includes('10-digit'))
            console.log('✅ Passed (Invalid Phone Rejected)\n');
        else console.log('❌ Failed: ' + (e.response ? e.response.data.error : e.message) + '\n');
    }

    // 8.2 Guest Count
    try {
        await axios.post(`${BASE_URL}/bookings`, {
            customer_name: 'Test Guest', phone_number: '1234567890', guest_count: 25, booking_date: tomorrowDate, time_slot: '12:00'
        });
        console.log('❌ Failed: Should reject guest > 20\n');
    } catch (e) {
        if (e.response && e.response.status === 400 && e.response.data.error.includes('1 and 20'))
            console.log('✅ Passed (Invalid Guest Count Rejected)\n');
        else console.log('❌ Failed: ' + (e.response ? e.response.data.error : e.message) + '\n');
    }

    // 8.3 Hours
    try {
        await axios.post(`${BASE_URL}/bookings`, {
            customer_name: 'Test Hours', phone_number: '1234567890', guest_count: 2, booking_date: tomorrowDate, time_slot: '09:00'
        });
        console.log('❌ Failed: Should reject 9 AM\n');
    } catch (e) {
        if (e.response && e.response.status === 400 && e.response.data.error.includes('10:00 AM'))
            console.log('✅ Passed (Invalid Hours Rejected)\n');
        else console.log('❌ Failed: ' + (e.response ? e.response.data.error : e.message) + '\n');
    }

    // 9. Concurrency / Double Booking Check
    console.log('Test 9: Concurrency Check');
    // We need a NEW slot to fill up simultaneously.
    const CONCURRENCY_SLOT = '13:00';
    // Fill 9 slots first
    for (let i = 0; i < 9; i++) {
        await axios.post(`${BASE_URL}/bookings`, {
            customer_name: `Filler ${i}`, phone_number: '1234567890', guest_count: 2, booking_date: tomorrowDate, time_slot: CONCURRENCY_SLOT
        });
    }

    // Now fire 5 requests for the LAST slot simultaneously
    const promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(
            axios.post(`${BASE_URL}/bookings`, {
                customer_name: `Race ${i}`, phone_number: '1234567890', guest_count: 2, booking_date: tomorrowDate, time_slot: CONCURRENCY_SLOT
            }).then(r => ({ status: r.status, id: r.data.booking.booking_id }))
                .catch(e => ({ status: e.response ? e.response.status : 500 }))
        );
    }

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.status === 201).length;
    const conflictCount = results.filter(r => r.status === 409).length;

    console.log(`Results: ${successCount} Success, ${conflictCount} Conflicts`);
    if (successCount === 1 && conflictCount === 4) {
        console.log('✅ Passed (Strictly 1 booking allowed)\n');
    } else {
        console.log('❌ Failed (Concurrency Leak?)\n');
    }
}

runTests();
