document.addEventListener("DOMContentLoaded", () => {
    const authGuard = document.getElementById("authGuard");
    const dashboard = document.getElementById("profileDashboard");
    let currentUser = null;

    const requestJson = async (url, options = {}) => {
        const response = await fetch(url, {
            credentials: "same-origin",
            headers: { "Content-Type": "application/json", ...(options.headers || {}) },
            ...options,
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            const error = new Error(data.error || `Request failed with status ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return data;
    };

    const showAuthCard = () => {
        dashboard.classList.add("d-none");
        authGuard.replaceChildren();
        const panel = document.createElement("div");
        panel.className = "row justify-content-center";
        panel.innerHTML = `
            <div class="col-lg-8">
                <article class="contact-panel p-4 p-md-5">
                    <h1 class="h2">Athlete Login</h1>
                    <p class="muted">Sign in or create an account to view My Gear and order history.</p>
                    <div class="row g-4">
                        <div class="col-md-6">
                            <h2 class="h5">Log in</h2>
                            <form id="authLoginForm">
                                <div class="mb-3"><label class="form-label" for="authEmail">Email</label><input class="form-control" id="authEmail" type="email" required></div>
                                <div class="mb-3"><label class="form-label" for="authPassword">Password</label><input class="form-control" id="authPassword" type="password" required></div>
                                <div class="form-check mb-3"><input class="form-check-input" id="authRemember" type="checkbox"><label class="form-check-label" for="authRemember">Remember me</label></div>
                                <button class="btn btn-accent w-100" type="submit">Sign In</button>
                            </form>
                        </div>
                        <div class="col-md-6">
                            <h2 class="h5">Register</h2>
                            <form id="authRegisterForm">
                                <div class="mb-3"><label class="form-label" for="registerName">Name</label><input class="form-control" id="registerName" required></div>
                                <div class="mb-3"><label class="form-label" for="registerEmail">Email</label><input class="form-control" id="registerEmail" type="email" required></div>
                                <div class="mb-3"><label class="form-label" for="registerPassword">Password</label><input class="form-control" id="registerPassword" type="password" minlength="8" required></div>
                                <button class="btn btn-outline-light w-100" type="submit">Create Account</button>
                            </form>
                        </div>
                    </div>
                    <div id="authFeedback" class="form-feedback" role="status" aria-live="polite"></div>
                </article>
            </div>`;
        authGuard.append(panel);

        document.getElementById("authLoginForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            await authenticate("/api/users/login", {
                email: document.getElementById("authEmail").value,
                password: document.getElementById("authPassword").value,
                rememberMe: document.getElementById("authRemember").checked,
            });
        });
        document.getElementById("authRegisterForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            await authenticate("/api/users/register", {
                name: document.getElementById("registerName").value,
                email: document.getElementById("registerEmail").value,
                password: document.getElementById("registerPassword").value,
            });
        });
    };

    const authenticate = async (url, body) => {
        const feedback = document.getElementById("authFeedback");
        feedback.textContent = "Please wait...";
        try {
            await requestJson(url, { method: "POST", body: JSON.stringify(body) });
            window.location.reload();
        } catch (error) {
            feedback.textContent = error.message;
            feedback.classList.add("is-error");
            window.IRONPREP.showToast(error.message, true);
        }
    };

    const updateCountdown = () => {
        if (!currentUser) return;
        const key = `ironprep_race_date_${currentUser.id}`;
        const dateValue = document.getElementById("raceDate").value || localStorage.getItem(key) || "";
        if (dateValue) localStorage.setItem(key, dateValue);

        const banner = document.getElementById("raceCountdown");
        const gearText = document.getElementById("raceGearText");
        if (!dateValue) {
            banner.classList.add("d-none");
            gearText.textContent = "Add a target race date to get a race-day countdown.";
            return;
        }

        const raceDate = new Date(`${dateValue}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = Math.ceil((raceDate - today) / 86400000);
        banner.classList.remove("d-none");
        banner.textContent = days > 0
            ? `${days} days until race day`
            : days === 0
                ? "Race day is today"
                : `Race day was ${Math.abs(days)} days ago`;
        gearText.textContent = days >= 0
            ? "Recommended: nutrition, race checklist gear and discipline essentials."
            : "Review recovery gear and start planning your next race.";
    };

    const loadWishlist = async () => {
        const status = document.getElementById("wishlistStatus");
        const grid = document.getElementById("wishlistGrid");
        try {
            const data = await requestJson("/api/users/me/wishlist");
            status.textContent = data.count === 0 ? "No saved gear yet." : "";
            status.classList.toggle("d-none", data.count > 0);
            grid.replaceChildren();

            data.items.forEach((product) => {
                const column = document.createElement("div");
                column.className = "col-sm-6 col-xl-4";
                const card = document.createElement("article");
                card.className = "product-card d-flex flex-column h-100";

                const imageLink = document.createElement("a");
                imageLink.href = `/products/${product.id}`;
                const image = document.createElement("img");
                image.className = "product-image w-100";
                image.src = product.imageUrl || "/images/product-placeholder.svg";
                image.alt = product.name;
                image.addEventListener("error", () => { image.src = "/images/product-placeholder.svg"; }, { once: true });
                imageLink.append(image);

                const body = document.createElement("div");
                body.className = "p-4 d-flex flex-column flex-grow-1";
                const category = document.createElement("span");
                category.className = "badge badge-soft align-self-start mb-3";
                category.textContent = product.category || "General";
                const name = document.createElement("h3");
                const nameLink = document.createElement("a");
                nameLink.href = `/products/${product.id}`;
                nameLink.className = "text-decoration-none text-light";
                nameLink.textContent = product.name;
                name.append(nameLink);
                const price = document.createElement("p");
                price.className = "price";
                price.textContent = window.IRONPREP.formatPrice(product.price);
                const actions = document.createElement("div");
                actions.className = "d-flex gap-2 mt-auto";
                const addButton = document.createElement("button");
                addButton.type = "button";
                addButton.className = "btn btn-accent btn-sm";
                addButton.textContent = "Add to Cart";
                addButton.addEventListener("click", () => {
                    window.IRONPREP.addToCart(product, 1);
                    window.IRONPREP.showToast(`${product.name} added to cart.`);
                });
                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className = "btn btn-outline-danger btn-sm";
                removeButton.textContent = "Remove";
                removeButton.addEventListener("click", async () => {
                    try {
                        await requestJson(`/api/users/me/wishlist/${product.id}`, { method: "DELETE" });
                        column.remove();
                        window.IRONPREP.showToast("Removed from My Gear.");
                    } catch (error) {
                        window.IRONPREP.showToast(error.message, true);
                    }
                });
                actions.append(addButton, removeButton);
                body.append(category, name, price, actions);
                card.append(imageLink, body);
                column.append(card);
                grid.append(column);
            });
        } catch (error) {
            status.textContent = `Could not load My Gear: ${error.message}`;
            status.classList.add("text-danger");
        }
    };

    const loadOrders = async () => {
        const status = document.getElementById("ordersStatus");
        const accordion = document.getElementById("ordersAccordion");
        try {
            const data = await requestJson("/api/orders");
            if (data.count === 0) {
                status.textContent = "No past orders yet.";
                accordion.replaceChildren();
                return;
            }
            status.classList.add("d-none");
            accordion.replaceChildren();
            data.orders.forEach((order, index) => {
                const item = document.createElement("div");
                item.className = "accordion-item";
                const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Date unavailable";
                item.innerHTML = `
                    <h2 class="accordion-header">
                        <button class="accordion-button ${index === 0 ? "" : "collapsed"}" type="button" data-bs-toggle="collapse" data-bs-target="#order${order.id}" aria-expanded="${index === 0}" aria-controls="order${order.id}">
                            Order #${order.id} — ${date} — ${window.IRONPREP.formatPrice(order.total)}
                        </button>
                    </h2>
                    <div id="order${order.id}" class="accordion-collapse collapse ${index === 0 ? "show" : ""}" data-bs-parent="#ordersAccordion">
                        <div class="accordion-body"><div class="table-responsive"><table class="table table-dark table-striped mb-0"><thead><tr><th>Product</th><th>Quantity</th><th>Unit Price</th></tr></thead><tbody></tbody></table></div></div>
                    </div>`;
                const tbody = item.querySelector("tbody");
                order.items.forEach((orderedItem) => {
                    const row = document.createElement("tr");
                    const name = document.createElement("td");
                    name.textContent = orderedItem.name;
                    const quantity = document.createElement("td");
                    quantity.textContent = orderedItem.quantity;
                    const unitPrice = document.createElement("td");
                    unitPrice.textContent = window.IRONPREP.formatPrice(orderedItem.unitPrice);
                    row.append(name, quantity, unitPrice);
                    tbody.append(row);
                });
                accordion.append(item);
            });
        } catch (error) {
            status.textContent = `Could not load order history: ${error.message}`;
            status.classList.add("text-danger");
        }
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        const feedback = document.getElementById("profileFeedback");
        const body = {
            name: document.getElementById("profileName").value.trim(),
            email: document.getElementById("profileEmail").value.trim(),
            targetRace: document.getElementById("profileRace").value.trim(),
        };
        const newPassword = document.getElementById("newPassword").value;
        if (newPassword) {
            body.newPassword = newPassword;
            body.currentPassword = document.getElementById("currentPassword").value;
        }
        try {
            const data = await requestJson("/api/users/me", { method: "PUT", body: JSON.stringify(body) });
            currentUser = data.user;
            feedback.textContent = "Profile saved.";
            feedback.classList.add("is-success");
            document.getElementById("profileHeading").textContent = data.user.name;
            updateCountdown();
            window.IRONPREP.showToast("Profile saved.");
        } catch (error) {
            feedback.textContent = error.message;
            feedback.classList.add("is-error");
            window.IRONPREP.showToast(error.message, true);
        }
    };

    const loadDashboard = async () => {
        try {
            const data = await requestJson("/api/users/me");
            currentUser = data.user;
            authGuard.replaceChildren();
            dashboard.classList.remove("d-none");
            document.getElementById("profileHeading").textContent = currentUser.name;
            document.getElementById("profileName").value = currentUser.name || "";
            document.getElementById("profileEmail").value = currentUser.email || "";
            document.getElementById("profileRace").value = currentUser.target_race || currentUser.targetRace || "";
            const raceDate = localStorage.getItem(`ironprep_race_date_${currentUser.id}`);
            if (raceDate) document.getElementById("raceDate").value = raceDate;
            document.getElementById("profileForm").addEventListener("submit", saveProfile);
            document.getElementById("raceDate").addEventListener("change", updateCountdown);
            document.getElementById("logoutButton").addEventListener("click", async (event) => {
                const button = event.currentTarget;
                button.disabled = true;
                try {
                    await requestJson("/api/users/logout", { method: "POST" });
                    window.location.reload();
                } catch (error) {
                    button.disabled = false;
                    window.IRONPREP.showToast(error.message, true);
                }
            });
            updateCountdown();
            await Promise.all([loadWishlist(), loadOrders()]);
        } catch (error) {
            if (error.status === 401) showAuthCard();
            else {
                authGuard.innerHTML = '<div class="alert alert-danger" role="alert">Could not load your profile. Please try again.</div>';
            }
        }
    };

    loadDashboard();
});
