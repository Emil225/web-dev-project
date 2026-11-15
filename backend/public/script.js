const CART_LIMIT = 99;

const cartCounter = document.getElementById("cart-count");
const cartStatus = document.getElementById("cart-status");
const forms = document.querySelectorAll("form");

const priceFormatter = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

let cartItemCount = 0;

const ironmanLocations = [
    { name: "Kona", latitude: 19.64, longitude: -155.99 },
    { name: "Frankfurt", latitude: 50.11, longitude: 8.68 },
    { name: "Lanzarote", latitude: 29.04, longitude: -13.58 },
];

async function fetchIronmanWeather() {
    const widget = document.getElementById("weather-widget");

    if (!widget) {
        return;
    }

    try {
        const weatherResults = await Promise.all(
            ironmanLocations.map(async (location) => {
                const url = new URL("https://api.open-meteo.com/v1/forecast");
                url.search = new URLSearchParams({
                    latitude: String(location.latitude),
                    longitude: String(location.longitude),
                    current_weather: "true",
                });

                try {
                    const response = await fetch(url);

                    if (!response.ok) {
                        throw new Error(`Weather request for ${location.name} failed with status ${response.status}.`);
                    }

                    const data = await response.json();
                    const temperature = data.current_weather?.temperature;

                    if (typeof temperature !== "number" || !Number.isFinite(temperature)) {
                        throw new Error(`Weather response for ${location.name} did not include a valid temperature.`);
                    }

                    return { name: location.name, temperature };
                } catch (error) {
                    console.error(`Unable to load weather for ${location.name}:`, error);
                    return null;
                }
            }),
        );

        const availableWeather = weatherResults.filter(Boolean);

        if (availableWeather.length === 0) {
            return;
        }

        const heading = document.createElement("h2");
        heading.className = "weather-heading";
        heading.textContent = "Race-day weather";

        const cards = availableWeather.map(({ name, temperature }) => {
            const card = document.createElement("article");
            card.className = "weather-card";

            const locationName = document.createElement("h3");
            locationName.className = "weather-location";
            locationName.textContent = name;

            const currentTemperature = document.createElement("p");
            currentTemperature.className = "weather-temperature";
            currentTemperature.textContent = `${temperature}°C`;
            currentTemperature.setAttribute("aria-label", `${temperature} degrees Celsius`);

            card.append(locationName, currentTemperature);
            return card;
        });

        widget.replaceChildren(heading, ...cards);
    } catch (error) {
        console.error("Unable to load Ironman location weather:", error);
    }
}

const updateCartCount = (nextCount) => {
    cartItemCount = Math.min(nextCount, CART_LIMIT);

    if (cartCounter) {
        cartCounter.textContent = String(cartItemCount);
        cartCounter.setAttribute("aria-label", `${cartItemCount} items in cart`);
    }
};

const handleAddToCart = (button) => {
    const productCard = button.closest(".product-card");
    const productTitle = productCard?.querySelector("h2, h3")?.textContent?.trim() || "Product";

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

// Builds one product card. textContent is used so product text from the database can never run as HTML.
const createProductCard = (product) => {
    const column = document.createElement("div");
    column.className = "col-sm-6 col-xl-4";

    const card = document.createElement("article");
    card.className = "product-card d-flex flex-column h-100";

    if (product.imageUrl) {
        const image = document.createElement("img");
        image.className = "product-image w-100";
        image.src = product.imageUrl;
        image.alt = product.name;
        image.loading = "lazy";
        card.append(image);
    }

    const body = document.createElement("div");
    body.className = "p-4 d-flex flex-column flex-grow-1";

    const category = document.createElement("span");
    category.className = "badge badge-soft align-self-start mb-3";
    category.textContent = product.category;

    const name = document.createElement("h2");
    name.className = "h3";
    name.textContent = product.name;

    const description = document.createElement("p");
    description.className = "muted small flex-grow-1";
    description.textContent = product.description;

    const footer = document.createElement("div");
    footer.className = "d-flex justify-content-between align-items-center mt-3";

    const price = document.createElement("span");
    price.className = "price";
    price.textContent = priceFormatter.format(product.price);

    const button = document.createElement("button");
    button.className = "btn btn-accent btn-sm add-to-cart";
    button.type = "button";
    button.textContent = "Add to cart";

    footer.append(price, button);
    body.append(category, name, description, footer);
    card.append(body);
    column.append(card);
    return column;
};

// READ: shows the products from the database on the shop page (GET /api/products)
const loadProductGrid = async () => {
    const grid = document.getElementById("productGrid");
    const status = document.getElementById("productGridStatus");

    if (!grid) {
        return;
    }

    try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || `Status ${response.status}`);
        }

        grid.replaceChildren(...data.products.map(createProductCard));
        status.textContent = data.products.length === 0 ? "No products in the shop yet." : "";
        status.classList.toggle("d-none", data.products.length > 0);
    } catch (error) {
        console.error("Unable to load products:", error);
        status.textContent = `Could not load products: ${error.message}`;
        status.classList.add("text-danger");
    }
};

// One listener for the whole page, so it also works for cards created after the page loaded
document.addEventListener("click", (event) => {
    const button = event.target.closest(".add-to-cart");

    if (button) {
        handleAddToCart(button);
    }
});

forms.forEach((form) => {
    form.addEventListener("submit", handleFormSubmit);
});

window.addEventListener("DOMContentLoaded", fetchIronmanWeather);
window.addEventListener("DOMContentLoaded", loadProductGrid);