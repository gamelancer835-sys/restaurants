const { validateBookingRequest } = require('./utils/validation');

console.log('Testing Validation...');

const validBody = {
    customer_name: 'Valid',
    phone_number: '1234567890',
    guest_count: 2,
    booking_date: '2026-01-20',
    time_slot: '12:00'
};

const invalidPhone = { ...validBody, phone_number: '123' };
const invalidGuest = { ...validBody, guest_count: 25 };
const invalidHour = { ...validBody, time_slot: '09:00' };

function test(name, body, shouldBeValid) {
    const res = validateBookingRequest(body);
    if (res.isValid === shouldBeValid) {
        console.log(`✅ ${name} Passed`);
    } else {
        console.log(`❌ ${name} Failed. Expected ${shouldBeValid}, got ${res.isValid}. Msg: ${res.message}`);
    }
}

test('Valid Request', validBody, true);
test('Invalid Phone', invalidPhone, false);
test('Invalid Guest', invalidGuest, false);
test('Invalid Hour', invalidHour, false);
