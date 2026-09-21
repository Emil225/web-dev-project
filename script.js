// Keep track of how many items are in the cart
let cartCount = 0;

// Find the cart counter
const cartCounter = document.getElementById("cart-count");

// Find all "Add to Cart" buttons
const buttons = document.querySelectorAll(".add-to-cart");

// Add an event listener to each button
buttons.forEach(function(button) {

    button.addEventListener("click", function() {

        cartCount++;

        // Update the number displayed in the navbar
        cartCounter.textContent = cartCount;

        alert("Product added to cart!");
    });

});