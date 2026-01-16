let allBookings = [];

// DOM Elements
const bookingsBody = document.getElementById('bookings-body');
const searchInput = document.getElementById('search-input');
const dateFilter = document.getElementById('date-filter');

// Stats Elements
const statsTotal = document.getElementById('stats-total');
const statsPending = document.getElementById('stats-pending');
const statsConfirmed = document.getElementById('stats-confirmed');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Set date filter to today by default? Or leave empty to show all. 
    // "Total Bookings Today" implies we need to know what "Today" is.
    // Let's set the date picker to today for convenience.
    const today = new Date().toISOString().split('T')[0];
    dateFilter.value = today;

    loadBookings();
});

async function loadBookings() {
    try {
        allBookings = await getOwnerBookings();
        renderDashboard();
    } catch (error) {
        console.error('Failed to load bookings:', error);
    }
}

function renderDashboard() {
    // 1. Filter Data
    const searchTerm = searchInput.value.toLowerCase();
    const filterDate = dateFilter.value;

    const filtered = allBookings.filter(b => {
        const matchesSearch = b.customer_name.toLowerCase().includes(searchTerm) || b.phone_number.includes(searchTerm);
        const matchesDate = filterDate ? b.booking_date === filterDate : true;
        return matchesSearch && matchesDate;
    });

    // 2. Update Stats (Based on "Today" or "Filtered View"? Prompt said "Total Bookings Today" specifically)
    // To strictly follow "Total Bookings Today", we should filter allBookings by *actual* today, independent of the view filter.
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysBookings = allBookings.filter(b => b.booking_date === todayStr);

    statsTotal.textContent = todaysBookings.length;
    statsPending.textContent = todaysBookings.filter(b => b.status === 'Pending').length;
    statsConfirmed.textContent = todaysBookings.filter(b => b.status === 'Confirmed').length;

    // 3. Render Table
    bookingsBody.innerHTML = filtered.map(b => `
    <tr>
        <td data-label="Actions" style="min-width: 150px;">
            ${b.status === 'Pending' ?
            `<button onclick="handleConfirm('${b._id}')" class="btn" style="padding:0.4rem; font-size:0.8rem; background:var(--primary-teal-light); color:var(--primary-teal); margin-right:5px; border:1px solid var(--primary-teal);">Confirm</button>`
            : ''}
            <button onclick="handleDelete('${b._id}')" class="btn" style="padding:0.4rem; font-size:0.8rem; background:var(--accent-orange-light); color:var(--accent-orange); border:1px solid var(--accent-orange);">Delete</button>
        </td>
        <td data-label="Name">${b.customer_name}<br><small class="text-muted">${b.phone_number}</small></td>
        <td data-label="Date">${b.booking_date}</td>
        <td data-label="Time">${b.time_slot}</td>
        <td data-label="Guests">${b.guest_count}</td>
        <td data-label="Status"><span class="status-badge status-${b.status}">${b.status}</span></td>
        <td data-label="Source" style="font-size:0.8rem; color:#a4b0be;">${b.source}</td>
    </tr>
    `).join('');

    // 4. Populate Mobile Quick List
    populateMobileQuickList(filtered);
}

// Actions
async function handleConfirm(id) {
    showConfirm('Are you sure you want to confirm this booking?', async () => {
        try {
            const res = await updateBookingStatus(id, 'Confirmed');
            if (res.ok) {
                showToast('Booking Confirmed!', 'success');
                loadBookings();
            } else {
                showToast('Failed to confirm', 'error');
            }
        } catch (e) { showToast('Error confirming', 'error'); }
    });
}

async function handleDelete(id) {
    showConfirm('Are you sure you want to delete this booking?', async () => {
        try {
            const res = await deleteBooking(id);
            if (res.ok) {
                showToast('Booking Deleted', 'success');
                loadBookings();
            } else {
                showToast('Failed to delete', 'error');
            }
        } catch (e) { showToast('Error deleting', 'error'); }
    });
}

// Search & Filter Events
searchInput.addEventListener('input', renderDashboard);
dateFilter.addEventListener('change', renderDashboard);

// Modal Logic
const modal = document.getElementById('manual-modal');
const manualForm = document.getElementById('manual-form');

function openModal() {
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
}

manualForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        customer_name: manualForm.customer_name.value,
        phone_number: manualForm.phone_number.value,
        guest_count: manualForm.guest_count.value,
        booking_date: manualForm.booking_date.value,
        time_slot: manualForm.time_slot.value
    };

    try {
        const res = await createManualBooking(data);
        if (res.ok) {
            showToast('Booking Added Successfully!', 'success');
            closeModal();
            manualForm.reset();
            loadBookings();
        } else {
            const err = await res.json();
            showToast('Error: ' + err.error, 'error');
        }
    } catch (error) {
        showToast('Failed to add booking', 'error');
    }
});

// Mobile View Switching
function switchView(viewName) {
    if (window.innerWidth > 768) return; // Ignore on Desktop

    // Toggle Sections
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    // Toggle Nav Icons
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    // Find nav item by onclick content or index - simplifying by selecting based on viewName
    const navIndex = viewName === 'overview' ? 0 : 2; // 0=Overview, 2=Bookings
    document.querySelectorAll('.mobile-bottom-nav .nav-item')[navIndex === 0 ? 0 : 1].classList.add('active');
}

function populateMobileQuickList(bookings) {
    const listContainer = document.getElementById('mobile-quick-list');
    if (!listContainer) return;

    // Sort by date/time (nearest first) and take top 3 pending/confirmed
    const upcoming = bookings
        .filter(b => b.status !== 'Completed' && b.status !== 'Cancelled')
        .sort((a, b) => new Date(`${a.booking_date}T${a.time_slot}`) - new Date(`${b.booking_date}T${b.time_slot}`))
        .slice(0, 3);

    if (upcoming.length === 0) {
        listContainer.innerHTML = '<p class="text-muted text-center">No upcoming bookings.</p>';
        return;
    }

    listContainer.innerHTML = upcoming.map(b => `
        <div class="quick-booking-card">
            <div class="quick-booking-info">
                <h4>${b.customer_name}</h4>
                <p>${b.booking_date} at ${b.time_slot}</p>
                <span class="status-badge status-${b.status}" style="font-size:0.7rem; padding:0.2rem 0.6rem; margin-top:0.3rem; display:inline-block;">${b.status}</span>
            </div>
            ${b.status === 'Pending' ?
            `<button onclick="handleConfirm('${b._id}')" class="btn" style="padding:0.5rem; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:var(--primary-teal-light); color:var(--primary-teal);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>` : ''}
        </div>
    `).join('');
}
