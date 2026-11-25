(() => {
    const CART_KEY = "ironprep_cart";
    const priceFormatter = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    });

    const getCart = () => {
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
            return Array.isArray(cart) ? cart : [];
        } catch {
            return [];
        }
    };

    const saveCart = (cart) => {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartBadge();
    };

    const addToCart = (product, quantity = 1) => {
        const productId = Number(product.id ?? product.productId);
        const addQuantity = Math.max(1, Math.min(99, Number(quantity) || 1));
        if (!productId) return null;

        const cart = getCart();
        const existing = cart.find((item) => Number(item.productId) === productId);

        if (existing) {
            existing.quantity = Math.min(99, existing.quantity + addQuantity);
        } else {
            cart.push({
                productId,
                name: product.name,
                price: Number(product.price),
                image: product.imageUrl || product.image || "",
                category: product.category || "General",
                quantity: addQuantity,
            });
        }

        saveCart(cart);
        return cart;
    };

    const updateCartQuantity = (productId, quantity) => {
        const id = Number(productId);
        const nextQuantity = Math.max(1, Math.min(99, Number(quantity) || 1));
        const cart = getCart();
        const item = cart.find((entry) => Number(entry.productId) === id);
        if (item) item.quantity = nextQuantity;
        saveCart(cart);
    };

    const removeFromCart = (productId) => {
        const id = Number(productId);
        saveCart(getCart().filter((item) => Number(item.productId) !== id));
    };

    const clearCart = () => saveCart([]);

    const getCartCount = () => getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    const updateCartBadge = () => {
        document.querySelectorAll("#cart-count").forEach((badge) => {
            const count = getCartCount();
            badge.textContent = String(count);
            badge.setAttribute("aria-label", `${count} items in cart`);
        });
    };

    const showToast = (message, isError = false) => {
        let container = document.getElementById("sharedToastContainer");

        if (!container) {
            container = document.createElement("div");
            container.id = "sharedToastContainer";
            container.className = "toast-container position-fixed bottom-0 end-0 p-3";
            document.body.append(container);
        }

        const toastElement = document.createElement("div");
        toastElement.className = `toast shared-toast${isError ? " is-error" : ""}`;
        toastElement.setAttribute("role", "status");
        toastElement.setAttribute("aria-live", "polite");
        toastElement.setAttribute("aria-atomic", "true");
        toastElement.innerHTML = '<div class="d-flex"><div class="toast-body"></div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>';
        toastElement.querySelector(".toast-body").textContent = message;
        container.append(toastElement);

        if (window.bootstrap?.Toast) {
            const toast = new bootstrap.Toast(toastElement, { delay: 3500 });
            toast.show();
            toastElement.addEventListener("hidden.bs.toast", () => toastElement.remove());
        }
    };

    const updateNavbar = () => {
        const navbarContainer = document.querySelector(".navbar .container");
        if (!navbarContainer) return;

        let brand = navbarContainer.querySelector(".navbar-brand");
        if (!brand) {
            brand = document.createElement("a");
            brand.className = "navbar-brand";
            brand.href = "/";
            brand.innerHTML = "IRON<span>-PREP</span>";
            navbarContainer.prepend(brand);
        }

        let toggler = navbarContainer.querySelector(".navbar-toggler");
        if (!toggler) {
            toggler = document.createElement("button");
            toggler.className = "navbar-toggler";
            toggler.type = "button";
            toggler.innerHTML = '<span class="navbar-toggler-icon"></span>';
        }
        toggler.setAttribute("data-bs-toggle", "collapse");
        toggler.setAttribute("data-bs-target", "#mainNavigation");
        toggler.setAttribute("aria-controls", "mainNavigation");
        toggler.setAttribute("aria-expanded", "false");
        toggler.setAttribute("aria-label", "Open navigation");
        navbarContainer.append(toggler);

        let collapse = navbarContainer.querySelector("#mainNavigation");
        if (!collapse) {
            collapse = document.createElement("div");
            collapse.id = "mainNavigation";
            collapse.className = "collapse navbar-collapse";
            navbarContainer.append(collapse);
        }

        [...navbarContainer.children].forEach((child) => {
            if (child !== brand && child !== toggler && child !== collapse) {
                child.remove();
            }
        });

        collapse.replaceChildren();

        const navList = document.createElement("ul");
        navList.className = "navbar-nav mx-auto gap-lg-3 my-3 my-lg-0";
        [
            ["Shop", "/products"],
            ["Race Checklist", "/checklist"],
            ["Manage Products", "/products/manage"],
        ].forEach(([label, href]) => {
            const item = document.createElement("li");
            item.className = "nav-item";
            const link = document.createElement("a");
            link.className = "nav-link";
            link.href = href;
            link.textContent = label;
            item.append(link);
            navList.append(item);
        });
        collapse.append(navList);

        const actions = document.createElement("div");
        actions.className = "navbar-actions d-flex align-items-center gap-3";

        const cartLink = document.createElement("a");
        cartLink.className = "nav-link mobile-nav-action position-relative";
        cartLink.href = "/cart";
        cartLink.setAttribute("aria-label", "Shopping cart");
        cartLink.innerHTML = '<i class="bi bi-bag me-2" aria-hidden="true"></i><span>Cart</span><span id="cart-count" class="badge rounded-pill text-bg-light ms-2">0</span>';
        actions.append(cartLink);

        const profileLink = document.createElement("a");
        profileLink.id = "profileNavLink";
        profileLink.className = "nav-link mobile-nav-action";
        profileLink.href = "/profile";
        profileLink.innerHTML = '<i class="bi bi-person fs-5" aria-hidden="true"></i>';
        actions.append(profileLink);
        collapse.append(actions);

        updateCartBadge();
        checkSession(profileLink);
    };

    const checkSession = async (profileLink) => {
        try {
            const response = await fetch("/api/users/me", { credentials: "same-origin" });
            const data = await response.json();
            if (response.ok && data.success) {
                const name = data.user.name || "My Profile";
                profileLink.textContent = name;
                profileLink.setAttribute("aria-label", `Open profile for ${name}`);
            } else {
                profileLink.textContent = "Login";
            }
        } catch {
            profileLink.textContent = "Login";
        }
    };

    window.IRONPREP = {
        getCart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        getCartCount,
        updateCartBadge,
        showToast,
        formatPrice: (price) => priceFormatter.format(Number(price)),
    };

    window.addEventListener("DOMContentLoaded", () => {
        updateNavbar();
        updateCartBadge();
    });
})();
