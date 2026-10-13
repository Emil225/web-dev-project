const CART_LIMIT = 99;

const cartCounter = document.getElementById("cart-count");
const cartStatus = document.getElementById("cart-status");
const addToCartButtons = document.querySelectorAll(".add-to-cart");
const forms = document.querySelectorAll("form");

let cartItemCount = 0;

const updateCartCount = (nextCount) => {
    cartItemCount = Math.min(nextCount, CART_LIMIT);

    if (cartCounter) {
        cartCounter.textContent = String(cartItemCount);
        cartCounter.setAttribute("aria-label", `${cartItemCount} items in cart`);
    }
};

const handleAddToCart = (button) => {
    const productCard = button.closest(".product-card");
    const productTitle = productCard?.querySelector("h3")?.textContent?.trim() || "Product";

    updateCartCount(cartItemCount + 1);

    if (cartStatus) {
        cartStatus.textContent = `${productTitle} added to cart.`;
    }
};

const setFormFeedback = (form, message, type) => {
    const feedback = form.querySelector(".form-feedback");

    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.classList.remove("is-error", "is-success");
    feedback.classList.add(type === "error" ? "is-error" : "is-success");
};

const handleFormSubmit = (event) => {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form.checkValidity()) {
        form.reportValidity();
        setFormFeedback(form, "Please complete the required fields before submitting.", "error");
        return;
    }

    const formId = form.id;

    if (formId === "contactForm") {
        setFormFeedback(form, "Thanks! Your message has been sent.", "success");
    } else if (formId === "loginForm") {
        setFormFeedback(form, "Sign-in form is ready to connect to your auth flow.", "success");
    } else if (formId === "searchForm") {
        setFormFeedback(form, "Search is ready to be connected to a product filter.", "success");
    } else {
        setFormFeedback(form, "Form submitted successfully.", "success");
    }

    form.reset();
};

addToCartButtons.forEach((button) => {
    button.addEventListener("click", () => handleAddToCart(button));
});

forms.forEach((form) => {
    form.addEventListener("submit", handleFormSubmit);
});