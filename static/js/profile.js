(() => {
    const phoneEdit = document.getElementById("profilePhoneEdit");
    const phoneForm = document.getElementById("profilePhoneForm");
    const phoneInput = document.getElementById("profilePhoneInput");
    const phoneDisplay = document.getElementById("profilePhoneDisplay");
    const phoneStatus = document.getElementById("profilePhoneStatus");

    phoneEdit?.addEventListener("click", () => {
        if (!phoneForm) return;
        phoneForm.hidden = !phoneForm.hidden;
        phoneEdit.setAttribute("aria-expanded", String(!phoneForm.hidden));
        if (!phoneForm.hidden) phoneInput?.focus();
    });

    phoneForm?.addEventListener("submit", async event => {
        event.preventDefault();
        const saveButton = phoneForm.querySelector("button[type='submit']");
        if (saveButton) saveButton.disabled = true;
        if (phoneStatus) phoneStatus.textContent = "Saving phone number…";

        try {
            const response = await fetch("/api/profile/phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phoneInput?.value || "" }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Could not save phone number.");

            if (phoneDisplay) phoneDisplay.textContent = data.phone;
            if (phoneStatus) phoneStatus.textContent = data.message;
            if (phoneEdit) {
                phoneEdit.textContent = "Edit";
                phoneEdit.setAttribute("aria-expanded", "false");
            }
            phoneForm.hidden = true;
        } catch (error) {
            if (phoneStatus) phoneStatus.textContent = error.message;
        } finally {
            if (saveButton) saveButton.disabled = false;
        }
    });

    const depositInput = document.getElementById("profileDepositAmount");
    const depositStatus = document.getElementById("profileDepositStatus");
    const withdrawInput = document.getElementById("profileWithdrawAmount");
    const withdrawStatus = document.getElementById("profileWithdrawStatus");

    document.querySelectorAll("[data-profile-amount]").forEach(button => {
        button.addEventListener("click", () => {
            if (depositInput) depositInput.value = button.dataset.profileAmount;
        });
    });

    document.querySelectorAll("[data-profile-adjust]").forEach(button => {
        button.addEventListener("click", () => {
            if (!depositInput) return;
            const current = Number(depositInput.value) || 0;
            depositInput.value = Math.max(10, current + Number(button.dataset.profileAdjust));
            depositInput.focus();
        });
    });

    document.querySelectorAll("[data-withdraw-adjust]").forEach(button => {
        button.addEventListener("click", () => {
            if (!withdrawInput) return;
            const current = Number(withdrawInput.value) || 0;
            withdrawInput.value = Math.max(50, current + Number(button.dataset.withdrawAdjust));
            withdrawInput.focus();
        });
    });

    document.querySelector("[data-profile-cashia]")?.addEventListener("click", () => {
        if (depositStatus) depositStatus.textContent = "Cashia is not connected. Use the M-Pesa test option to try a deposit.";
    });

    document.querySelector("[data-profile-mpesa]")?.addEventListener("click", async () => {
        const amount = Number(depositInput?.value);
        if (!Number.isFinite(amount) || amount < 10 || amount > 1_000_000) {
            if (depositStatus) depositStatus.textContent = "Enter a deposit amount between KES 10 and KES 1,000,000.";
            depositInput?.focus();
            return;
        }

        const button = document.querySelector("[data-profile-mpesa]");
        button.disabled = true;
        if (depositStatus) depositStatus.textContent = "Applying M-Pesa test deposit…";

        try {
            const response = await fetch("/api/deposits/mpesa-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Deposit failed.");

            const balance = document.getElementById("headerBalance");
            if (balance) {
                balance.textContent = Number(data.balance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
            }

            const successOverlay = document.getElementById("depositSuccessOverlay");
            const successMessage = document.getElementById("depositSuccessMessage");
            if (successMessage) {
                successMessage.textContent = `Thank you for depositing KES ${Number(data.amount).toFixed(2)}. This is a test credit; no real M-Pesa payment was made.`;
            }
            if (successOverlay) {
                successOverlay.classList.add("show");
                successOverlay.setAttribute("aria-hidden", "false");
                document.body.style.overflow = "hidden";
            }
            if (depositStatus) depositStatus.textContent = "";
        } catch (error) {
            if (depositStatus) depositStatus.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    });

    document.querySelectorAll("[data-withdraw-unavailable]").forEach(button => {
        button.addEventListener("click", () => {
            if (withdrawStatus) withdrawStatus.textContent = "Withdrawals are not connected yet.";
        });
    });

    const transactionToggle = document.getElementById("transactionsToggle");
    const transactionsEmpty = document.getElementById("transactionsEmpty");
    transactionToggle?.addEventListener("click", () => {
        const expanded = transactionToggle.getAttribute("aria-expanded") === "true";
        transactionToggle.setAttribute("aria-expanded", String(!expanded));
        if (transactionsEmpty) transactionsEmpty.hidden = expanded;
    });

    const themeToggle = document.getElementById("profileThemeToggle");
    themeToggle?.addEventListener("click", () => {
        if (typeof window.toggleTheme === "function") window.toggleTheme();
    });

    const dataSaver = document.getElementById("profileDataSaver");
    if (dataSaver) {
        dataSaver.checked = localStorage.getItem("profileDataSaver") === "on";
        dataSaver.addEventListener("change", () => {
            localStorage.setItem("profileDataSaver", dataSaver.checked ? "on" : "off");
        });
    }

    const supportStatus = document.getElementById("supportStatus");
    document.querySelectorAll("[data-support-message]").forEach(button => {
        button.addEventListener("click", () => {
            if (supportStatus) supportStatus.textContent = button.dataset.supportMessage;
        });
    });
})();
