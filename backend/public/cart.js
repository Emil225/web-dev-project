document.addEventListener("DOMContentLoaded", () => {
    const itemsContainer = document.getElementById("cartItems");
    const cartView = document.getElementById("cartView");
    const confirmation = document.getElementById("orderConfirmation");
    const checkoutButton = document.getElementById("checkoutButton");
    const checkoutPrompt = document.getElementById("checkoutPrompt");
    let authenticated = false;

    const renderCart = () => {
        const cart = window.IRONPREP.getCart();
        itemsContainer.replaceChildren();

        if (cart.length === 0) {
            cartView.classList.add("d-none");
            const empty = document.createElement("div");
            empty.className = "contact-panel p-5 text-center";
            empty.innerHTML = '<i class="bi bi-bag fs-1 text-accent"></i><h2 class="h3 mt-3">Your cart is empty</h2><p class="muted">Add race-day essentials before checkout.</p><a class="btn btn-accent" href="/products">Continue Shopping</a>';
            document.getElementById("cartStatus").replaceChildren(empty);
            document.getElementById("cartStatus").classList.remove("d-none");
            return;
        }

        document.getElementById("cartStatus").replaceChildren();
        cartView.classList.remove("d-none");

        cart.forEach((item) => {
            const row = document.createElement("article");
            row.className = "manage-row cart-row";

            const image = document.createElement("img");
            image.className = "manage-thumb cart-detail-image";
            image.src = item.image || "/images/product-placeholder.svg";
            image.alt = item.name;
            image.addEventListener("error", () => { image.src = "/images/product-placeholder.svg"; }, { once: true });

            const details = document.createElement("div");
            const name = document.createElement("a");
            name.href = `/products/${item.productId}`;
            name.className = "h5 text-decoration-none text-light";
            name.textContent = item.name;
            const category = document.createElement("span");
            category.className = "badge badge-soft ms-2";
            category.textContent = item.category || "General";
            details.append(name, category);

            const controls = document.createElement("div");
            controls.className = "d-flex align-items-center gap-2 mt-3";
            const minus = document.createElement("button");
            minus.type = "button";
            minus.className = "btn btn-outline-light";
            minus.textContent = "-";
            minus.setAttribute("aria-label", `Decrease ${item.name} quantity`);
            const input = document.createElement("input");
            input.className = "form-control quantity-input";
            input.type = "number";
            input.min = "1";
            input.max = "99";
            input.value = item.quantity;
            input.setAttribute("aria-label", `${item.name} quantity`);
            const plus = document.createElement("button");
            plus.type = "button";
            plus.className = "btn btn-outline-light";
            plus.textContent = "+";
            plus.setAttribute("aria-label", `Increase ${item.name} quantity`);
            minus.addEventListener("click", () => {
                window.IRONPREP.updateCartQuantity(item.productId, item.quantity - 1);
                renderCart();
            });
            plus.addEventListener("click", () => {
                window.IRONPREP.updateCartQuantity(item.productId, item.quantity + 1);
                renderCart();
            });
            input.addEventListener("change", () => {
                window.IRONPREP.updateCartQuantity(item.productId, input.value);
                renderCart();
            });

            controls.append(minus, input, plus);

            const footer = document.createElement("div");
            footer.className = "manage-footer";
            const subtotal = document.createElement("strong");
            subtotal.textContent = window.IRONPREP.formatPrice(Number(item.price) * item.quantity);
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "btn btn-outline-danger btn-sm";
            remove.innerHTML = '<i class="bi bi-trash me-1"></i>Remove';
            remove.addEventListener("click", () => {
                window.IRONPREP.removeFromCart(item.productId);
                renderCart();
                window.IRONPREP.showToast(`${item.name} removed from cart.`);
            });
            footer.append(subtotal, remove);

            row.append(image, details, footer);
            details.append(controls);
            itemsContainer.append(row);
        });

        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
        document.getElementById("summaryCount").textContent = String(count);
        document.getElementById("summaryTotal").textContent = window.IRONPREP.formatPrice(total);
    };

    const checkSession = async () => {
        try {
            const response = await fetch("/api/users/me", { credentials: "same-origin" });
            const data = await response.json();
            authenticated = response.ok && data.success;
            checkoutButton.disabled = !authenticated || window.IRONPREP.getCart().length === 0;
            checkoutPrompt.classList.toggle("d-none", authenticated);
            if (!authenticated) {
                checkoutPrompt.innerHTML = 'Please <a class="alert-link" href="/profile">log in or register</a> before placing an order.';
            }
        } catch {
            checkoutPrompt.classList.remove("d-none");
            checkoutPrompt.textContent = "Could not verify your login. Please try again.";
            checkoutButton.disabled = true;
        }
    };

    checkoutButton.addEventListener("click", async () => {
        if (!authenticated) return;
        const cart = window.IRONPREP.getCart();
        if (cart.length === 0) return;

        checkoutButton.disabled = true;
        checkoutButton.textContent = "Placing Order...";

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Could not place the order");

            window.IRONPREP.clearCart();
            renderCart();
            cartView.classList.add("d-none");
            confirmation.classList.remove("d-none");
            const order = data.order;
            confirmation.replaceChildren();
            const heading = document.createElement("h2");
            heading.className = "h2";
            heading.textContent = `Order #${order.id} confirmed`;
            const total = document.createElement("p");
            total.className = "h4 text-accent";
            total.textContent = window.IRONPREP.formatPrice(order.total);
            const list = document.createElement("ul");
            list.className = "list-group mb-4";
            order.items.forEach((item) => {
                const row = document.createElement("li");
                row.className = "list-group-item list-group-item-dark";
                row.textContent = `${item.name} × ${item.quantity}`;
                list.append(row);
            });
            const actions = document.createElement("div");
            actions.className = "d-flex flex-wrap gap-2";
            actions.innerHTML = '<a class="btn btn-accent" href="/profile">View Order History</a><a class="btn btn-outline-light" href="/products">Continue Shopping</a>';
            confirmation.append(heading, total, list, actions);
            window.IRONPREP.showToast(`Order #${order.id} confirmed.`);
        } catch (error) {
            checkoutPrompt.classList.remove("d-none");
            checkoutPrompt.className = "alert alert-danger";
            checkoutPrompt.textContent = error.message;
        } finally {
            checkoutButton.textContent = "Complete Order";
            if (window.IRONPREP.getCart().length > 0) checkSession();
        }
    });

    renderCart();
    checkSession();
});
