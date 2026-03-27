(function initPasswordReset(global) {
    function showForgotPasswordModal() {
        const modal = global.document.getElementById('forgotPasswordModal');
        if (!modal) return;

        modal.style.display = 'flex';
        modal.classList.add('show');

        const errorEl = global.document.getElementById('forgotPasswordError');
        const successEl = global.document.getElementById('forgotPasswordSuccess');
        if (errorEl) errorEl.style.display = 'none';
        if (successEl) successEl.style.display = 'none';
    }

    function hidePasswordResetModals() {
        const forgotModal = global.document.getElementById('forgotPasswordModal');
        const otpModal = global.document.getElementById('otpVerificationModal');

        if (forgotModal) {
            forgotModal.style.display = 'none';
            forgotModal.classList.remove('show');
        }

        if (otpModal) {
            otpModal.style.display = 'none';
            otpModal.classList.remove('show');
        }
    }

    function showPasswordResetNotification(message, isError, deps) {
        const notificationEl = deps.notificationEl;
        if (!notificationEl) return;

        notificationEl.textContent = message;
        notificationEl.className = `notification ${isError ? 'error' : 'success'} show`;
        global.setTimeout(() => {
            notificationEl.classList.remove('show');
        }, 5000);
    }

    async function initiatePasswordReset(identifier, method, deps) {
        try {
            const response = await global.fetch(`${deps.API_BASE_URL}/api/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ identifier, method })
            });

            const data = await response.json();

            if (response.ok) {
                deps.setResetData({ identifier, method });

                const successEl = global.document.getElementById('forgotPasswordSuccess');
                if (successEl) {
                    successEl.textContent = data.message;
                    successEl.style.display = 'block';
                }

                global.setTimeout(() => {
                    hidePasswordResetModals();
                    showOtpVerificationModal(data);
                }, 1500);

                return { success: true, data };
            }

            const errorEl = global.document.getElementById('forgotPasswordError');
            if (errorEl) {
                errorEl.textContent = data.error;
                errorEl.style.display = 'block';
            }
            return { success: false, error: data.error };
        } catch (error) {
            const errorMsg = 'Network error. Please check your connection.';
            const errorEl = global.document.getElementById('forgotPasswordError');
            if (errorEl) {
                errorEl.textContent = errorMsg;
                errorEl.style.display = 'block';
            }
            return { success: false, error: errorMsg };
        }
    }

    function showOtpVerificationModal(data) {
        const modal = global.document.getElementById('otpVerificationModal');
        if (!modal) return;

        modal.style.display = 'flex';
        modal.classList.add('show');

        const otpError = global.document.getElementById('otpError');
        if (otpError) otpError.style.display = 'none';

        const instructions = `OTP sent to your ${data.method} (${data.maskedIdentifier}). Please enter the 6-digit code below.`;
        const instructionEl = global.document.getElementById('otpInstructions');
        if (instructionEl) instructionEl.textContent = instructions;

        const otpCode = global.document.getElementById('otpCode');
        const newPassword = global.document.getElementById('newPassword');
        const confirmNewPassword = global.document.getElementById('confirmNewPassword');
        if (otpCode) otpCode.value = '';
        if (newPassword) newPassword.value = '';
        if (confirmNewPassword) confirmNewPassword.value = '';
    }

    async function verifyOtpAndResetPassword(otp, newPassword, deps) {
        const currentResetData = deps.getResetData();
        if (!currentResetData) {
            const otpError = global.document.getElementById('otpError');
            if (otpError) {
                otpError.textContent = 'Session expired. Please restart the process.';
                otpError.style.display = 'block';
            }
            return { success: false };
        }

        try {
            const response = await global.fetch(`${deps.API_BASE_URL}/api/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    identifier: currentResetData.identifier,
                    otp,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                deps.setResetData(null);
                hidePasswordResetModals();
                showPasswordResetNotification('Password reset successfully! You can now login with your new password.', false, deps);
                return { success: true };
            }

            const otpError = global.document.getElementById('otpError');
            if (otpError) {
                otpError.textContent = data.error;
                otpError.style.display = 'block';
            }
            return { success: false, error: data.error };
        } catch (error) {
            const errorMsg = 'Network error. Please try again.';
            const otpError = global.document.getElementById('otpError');
            if (otpError) {
                otpError.textContent = errorMsg;
                otpError.style.display = 'block';
            }
            return { success: false, error: errorMsg };
        }
    }

    async function resendOtp(deps) {
        const currentResetData = deps.getResetData();
        const otpError = global.document.getElementById('otpError');

        if (!currentResetData) {
            if (otpError) {
                otpError.textContent = 'Session expired. Please restart the process.';
                otpError.style.display = 'block';
            }
            return;
        }

        const resendBtn = global.document.getElementById('resendOtpBtn');
        if (resendBtn) {
            resendBtn.disabled = true;
            resendBtn.textContent = 'Sending...';
        }

        const result = await initiatePasswordReset(currentResetData.identifier, currentResetData.method, deps);

        global.setTimeout(() => {
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.textContent = 'Resend OTP';
            }
        }, 3000);

        if (result.success) {
            if (otpError) otpError.style.display = 'none';
            const successMsg = global.document.createElement('div');
            successMsg.style.color = '#28a745';
            successMsg.style.marginTop = '10px';
            successMsg.textContent = 'OTP resent successfully!';

            const otpForm = global.document.getElementById('otpVerificationForm');
            if (otpForm) otpForm.appendChild(successMsg);

            global.setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
            }, 3000);
        }
    }

    function setupPasswordResetEventListeners(deps) {
        const forgotPasswordLink = global.document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                deps.hideAuthModals();
                showForgotPasswordModal();
            });
        }

        const closeForgotPasswordModal = global.document.getElementById('closeForgotPasswordModal');
        if (closeForgotPasswordModal) {
            closeForgotPasswordModal.addEventListener('click', hidePasswordResetModals);
        }

        const closeOtpModal = global.document.getElementById('closeOtpModal');
        if (closeOtpModal) {
            closeOtpModal.addEventListener('click', hidePasswordResetModals);
        }

        const forgotPasswordForm = global.document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const identifier = global.document.getElementById('resetIdentifier')?.value.trim() || '';
                const method = global.document.getElementById('resetMethod')?.value || 'email';

                if (!identifier) {
                    const forgotPasswordError = global.document.getElementById('forgotPasswordError');
                    if (forgotPasswordError) {
                        forgotPasswordError.textContent = 'Please enter your email or phone number';
                        forgotPasswordError.style.display = 'block';
                    }
                    return;
                }

                const forgotPasswordError = global.document.getElementById('forgotPasswordError');
                const forgotPasswordSuccess = global.document.getElementById('forgotPasswordSuccess');
                if (forgotPasswordError) forgotPasswordError.style.display = 'none';
                if (forgotPasswordSuccess) forgotPasswordSuccess.style.display = 'none';

                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';

                await initiatePasswordReset(identifier, method, deps);

                global.setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send OTP';
                }, 2000);
            });
        }

        const otpVerificationForm = global.document.getElementById('otpVerificationForm');
        if (otpVerificationForm) {
            otpVerificationForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const otp = global.document.getElementById('otpCode')?.value.trim() || '';
                const newPassword = global.document.getElementById('newPassword')?.value || '';
                const confirmPassword = global.document.getElementById('confirmNewPassword')?.value || '';
                const otpError = global.document.getElementById('otpError');

                if (!otp || otp.length !== 6) {
                    if (otpError) {
                        otpError.textContent = 'Please enter a valid 6-digit OTP';
                        otpError.style.display = 'block';
                    }
                    return;
                }

                if (newPassword.length < 6) {
                    if (otpError) {
                        otpError.textContent = 'Password must be at least 6 characters long';
                        otpError.style.display = 'block';
                    }
                    return;
                }

                if (newPassword !== confirmPassword) {
                    if (otpError) {
                        otpError.textContent = 'Passwords do not match';
                        otpError.style.display = 'block';
                    }
                    return;
                }

                if (otpError) otpError.style.display = 'none';

                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Resetting...';

                await verifyOtpAndResetPassword(otp, newPassword, deps);

                global.setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Reset Password';
                }, 2000);
            });
        }

        const resendOtpBtn = global.document.getElementById('resendOtpBtn');
        if (resendOtpBtn) {
            resendOtpBtn.addEventListener('click', () => resendOtp(deps));
        }

        const otpCodeInput = global.document.getElementById('otpCode');
        if (otpCodeInput) {
            otpCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }
    }

    global.PasswordReset = {
        hidePasswordResetModals,
        initiatePasswordReset,
        resendOtp,
        setupPasswordResetEventListeners,
        showForgotPasswordModal,
        showOtpVerificationModal,
        showPasswordResetNotification,
        verifyOtpAndResetPassword
    };
})(window);