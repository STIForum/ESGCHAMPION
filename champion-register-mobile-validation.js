document.addEventListener('DOMContentLoaded', () => {
    const mobileInput = document.getElementById('mobile_number');
    const mobileError = document.getElementById('mobile_number_error');
    // Adjust this ID to your real form id
    const form = document.querySelector('form'); 

    if (!mobileInput) return;

    // 1) Live sanitisation – strip any non‑digits as user types
    mobileInput.addEventListener('input', () => {
        const original = mobileInput.value;
        const cleaned = original.replace(/\D/g, ''); // keep digits only

        if (original !== cleaned) {
            mobileInput.value = cleaned;
        }

        mobileInput.classList.remove('error');
        if (mobileError) mobileError.textContent = '';
    });

    // 2) Validate on submit
    if (form) {
        form.addEventListener('submit', (e) => {
            const value = (mobileInput.value || '').trim();
            const phoneRegex = /^[0-9]{7,15}$/; // adjust length if needed

            if (!phoneRegex.test(value)) {
                e.preventDefault();
                mobileInput.classList.add('error');
                if (mobileError) {
                    mobileError.textContent = 'Please enter a valid mobile number (digits only).';
                }
                mobileInput.focus();
            }
        });
    }
});