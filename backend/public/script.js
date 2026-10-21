const CART_LIMIT = 99;

const cartCounter = document.getElementById("cart-count");
const cartStatus = document.getElementById("cart-status");
const addToCartButtons = document.querySelectorAll(".add-to-cart");
const forms = document.querySelectorAll("form");

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

addToCartButtons.forEach((button) => {
    button.addEventListener("click", () => handleAddToCart(button));
});

forms.forEach((form) => {
    form.addEventListener("submit", handleFormSubmit);
});

window.addEventListener("DOMContentLoaded", fetchIronmanWeather);