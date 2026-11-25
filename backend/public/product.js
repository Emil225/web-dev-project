document.addEventListener("DOMContentLoaded", () => {
    const status = document.getElementById("productStatus");
    const content = document.getElementById("productContent");
    const quantity = document.getElementById("productQuantity");
    let product = null;

    const getProductId = () => {
        const pathMatch = window.location.pathname.match(/\/products\/(\d+)/);
        if (pathMatch) return pathMatch[1];
        return new URLSearchParams(window.location.search).get("id");
    };

    const setFeedback = (message, isError = false) => {
        const feedback = document.getElementById("productFeedback");
        feedback.textContent = message;
        feedback.classList.toggle("is-error", isError);
        feedback.classList.toggle("is-success", !isError);
    };

    const clampQuantity = () => {
        const next = Math.max(1, Math.min(99, Number(quantity.value) || 1));
        quantity.value = String(next);
        return next;
    };

    const loadProduct = async () => {
        const productId = getProductId();
        if (!productId) {
            status.className = "alert alert-danger";
            status.textContent = "No product ID was provided.";
            return;
        }

        try {
            const response = await fetch(`/api/products/${encodeURIComponent(productId)}`, { credentials: "same-origin" });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Product not found");

            product = data.product;
            const breadcrumb = document.getElementById("productBreadcrumb");
            breadcrumb.replaceChildren();
            [["Home", "/"], ["Shop", "/products"], [product.category || "Gear", `/products?category=${encodeURIComponent(product.category || "")}`], [product.name, null]]
                .forEach(([label, href], index) => {
                    const item = document.createElement("li");
                    item.className = `breadcrumb-item${href ? "" : " active"}`;
                    if (href) {
                        const link = document.createElement("a");
                        link.href = href;
                        link.textContent = label;
                        item.append(link);
                    } else {
                        item.setAttribute("aria-current", "page");
                        item.textContent = label;
                    }
                    breadcrumb.append(item);
                });

            document.title = `${product.name} | IRON-PREP`;
            document.getElementById("productName").textContent = product.name;
            document.getElementById("productCategory").textContent = product.category || "General";
            document.getElementById("productPrice").textContent = window.IRONPREP.formatPrice(product.price);
            document.getElementById("productDescription").textContent = product.description || "No description available.";

            const image = document.getElementById("productImage");
            image.alt = product.name;
            image.src = product.imageUrl || "/images/product-placeholder.svg";
            image.addEventListener("error", () => {
                image.removeAttribute("src");
                image.src = "/images/product-placeholder.svg";
            }, { once: true });

            status.classList.add("d-none");
            content.classList.remove("d-none");
        } catch (error) {
            status.className = "alert alert-danger";
            status.textContent = error.message === "Product not found"
                ? "This product could not be found."
                : `Could not load this product: ${error.message}`;
        }
    };

    document.getElementById("quantityMinus").addEventListener("click", () => {
        quantity.value = String(Math.max(1, clampQuantity() - 1));
    });
    document.getElementById("quantityPlus").addEventListener("click", () => {
        quantity.value = String(Math.min(99, clampQuantity() + 1));
    });
    quantity.addEventListener("change", clampQuantity);

    document.getElementById("addToCartButton").addEventListener("click", () => {
        if (!product) return;
        window.IRONPREP.addToCart(product, clampQuantity());
        window.IRONPREP.showToast(`${product.name} added to cart.`);
        setFeedback("Added to your cart.");
    });

    document.getElementById("saveWishlistButton").addEventListener("click", async () => {
        if (!product) return;
        try {
            const response = await fetch("/api/users/me/wishlist", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id }),
            });
            const data = await response.json();
            if (response.status === 401) {
                setFeedback("Please log in first to save gear to My Gear.", true);
                window.IRONPREP.showToast("Please log in first", true);
                return;
            }
            if (!response.ok || !data.success) throw new Error(data.error || "Could not save this product");
            setFeedback("Saved to My Gear.");
            window.IRONPREP.showToast("Saved to My Gear.");
        } catch (error) {
            setFeedback(error.message, true);
            window.IRONPREP.showToast(error.message, true);
        }
    });

    loadProduct();
});
