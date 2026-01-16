function createModalDOM() {
    if (document.getElementById('custom-modal')) return;

    const modalHTML = `
        <div id="custom-modal" class="custom-modal-backdrop">
            <div class="custom-modal-card">
                <div id="custom-modal-message" class="custom-modal-message"></div>
                <div class="custom-modal-actions">
                    <button id="custom-modal-cancel" class="btn btn-cancel">Cancel</button>
                    <button id="custom-modal-confirm" class="btn btn-confirm">Confirm</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showConfirm(message, onConfirm) {
    createModalDOM();

    const modal = document.getElementById('custom-modal');
    const messageEl = document.getElementById('custom-modal-message');
    const confirmBtn = document.getElementById('custom-modal-confirm');
    const cancelBtn = document.getElementById('custom-modal-cancel');

    // Set content
    messageEl.textContent = message;

    // Show modal
    // Small timeout to allow transition to work if just inserted
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    // Handlers
    const cleanup = () => {
        modal.classList.remove('active');
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
    };

    confirmBtn.onclick = () => {
        cleanup();
        if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = () => {
        cleanup();
    };
}
