// Manage Products page.
// Every action here sends a request to the REST API, which reads or changes
// the products table in PostgreSQL:
//   READ   -> GET    /api/products
//   CREATE -> POST   /api/products
//   UPDATE -> PUT    /api/products/:id
//   DELETE -> DELETE /api/products/:id

const API_URL = "/api/products";
const SEARCH_DELAY_MS = 300;
const HIGHLIGHT_DURATION_MS = 2500;

const priceFormatter = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const form = document.getElementById("productForm");
const formTitle = document.getElementById("formTitle");
const formHint = document.getElementById("formHint");
const formFeedback = document.getElementById("formFeedback");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const idInput = document.getElementById("productId");
const nameInput = document.getElementById("productName");
const categoryInput = document.getElementById("productCategory");
const priceInput = document.getElementById("productPrice");
const imageInput = document.getElementById("productImage");
const descriptionInput = document.getElementById("productDescription");
const categoryOptions = document.getElementById("categoryOptions");

const searchInput = document.getElementById("manageSearch");
const productList = document.getElementById("productList");
const productCount = document.getElementById("productCount");
const listStatus = document.getElementById("listStatus");
const rowTemplate = document.getElementById("productRowTemplate");

const deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
const deleteProductName = document.getElementById("deleteProductName");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");

const actionToastElement = document.getElementById("actionToast");
const actionToast = new bootstrap.Toast(actionToastElement);
const actionToastMessage = document.getElementById("actionToastMessage");

let productToDelete = null;
let searchTimer = null;
let latestListRequest = 0;

// Sends a request to the API and returns the JSON answer.
// Throws an Error with the server's message (e.g. "A valid positive price is required") if it fails.
const requestApi = async (url, options = {}) => {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        // The server didn't answer with JSON
    }

    if (!response.ok || !data?.success) {
        throw new Error(data?.error || `The server answered with status ${response.status}`);
    }

    return data;
};

const showFormFeedback = (message, isError = false) => {
    formFeedback.textContent = message;
    formFeedback.classList.toggle("is-error", isError);
    formFeedback.classList.toggle("is-success", !isError && message !== "");
};

const showToast = (message, isError = false) => {
    actionToastMessage.textContent = message;
    actionToastElement.classList.toggle("is-error", isError);
    actionToast.show();
};

const showListStatus = (message, isError = false) => {
    listStatus.textContent = message;
    listStatus.classList.toggle("d-none", message === "");
    listStatus.classList.toggle("text-danger", isError);
};

// Fills one copy of the row template with a product's data.
// textContent is used everywhere, so text typed into the form can never run as HTML.
const createProductRow = (product) => {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    const image = row.querySelector("img.manage-thumb");
    const emptyImage = row.querySelector(".manage-thumb-empty");

    row.dataset.productId = product.id;
    row.querySelector(".manage-id").textContent = `ID ${product.id}`;
    row.querySelector(".manage-category").textContent = product.category;
    row.querySelector(".manage-name").textContent = product.name;
    row.querySelector(".manage-description").textContent = product.description || "No description";
    row.querySelector(".manage-price").textContent = priceFormatter.format(product.price);

    const showEmptyImage = () => {
        image.classList.add("d-none");
        emptyImage.classList.remove("d-none");
    };

    if (product.imageUrl) {
        image.addEventListener("error", showEmptyImage); // broken link -> show the empty box instead
        image.src = product.imageUrl;
        image.alt = product.name;
    } else {
        showEmptyImage();
    }

    row.querySelector(".edit-button").addEventListener("click", () => startEditing(product));
    row.querySelector(".delete-button").addEventListener("click", () => askToDelete(product));

    return row;
};

const renderProducts = (products, highlightId) => {
    productList.replaceChildren(...products.map(createProductRow));
    productCount.textContent = products.length;

    if (products.length === 0) {
        const search = searchInput.value.trim();
        showListStatus(search ? `No products match "${search}".` : "No products yet. Add one with the form.");
        return;
    }

    showListStatus("");

    // Briefly outline the product that was just added or changed
    const changedRow = productList.querySelector(`[data-product-id="${highlightId}"]`);

    if (changedRow) {
        changedRow.classList.add("is-highlighted");
        changedRow.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => changedRow.classList.remove("is-highlighted"), HIGHLIGHT_DURATION_MS);
    }
};

// READ: loads the products from the database (filtered by the search box)
const loadProducts = async (highlightId) => {
    const requestNumber = ++latestListRequest;
    const search = searchInput.value.trim();
    const url = search ? `${API_URL}?search=${encodeURIComponent(search)}` : API_URL;

    try {
        const data = await requestApi(url);

        // Ignore old answers if the user kept typing and a newer search was sent
        if (requestNumber === latestListRequest) {
            renderProducts(data.products, highlightId);
        }
    } catch (error) {
        if (requestNumber === latestListRequest) {
            productList.replaceChildren();
            productCount.textContent = "0";
            showListStatus(`Could not load products: ${error.message}`, true);
        }
    }
};

// Suggestions for the category field, also read from the database
const loadCategories = async () => {
    try {
        const data = await requestApi(`${API_URL}/categories`);
        categoryOptions.replaceChildren(...data.categories.map((category) => new Option(category)));
    } catch {
        // Suggestions are optional, so the page still works without them
    }
};

const readForm = () => ({
    name: nameInput.value.trim(),
    category: categoryInput.value.trim() || "General",
    price: Number(priceInput.value),
    imageUrl: imageInput.value.trim() || null,
    description: descriptionInput.value.trim(),
});

const resetForm = () => {
    form.reset();
    idInput.value = "";
    form.classList.remove("is-editing");
    formTitle.textContent = "Add a product";
    formHint.textContent = "Fill in the details and press Add product.";
    submitButton.textContent = "Add product";
    cancelEditButton.classList.add("d-none");
};

// UPDATE (step 1): put the product's current data into the form
const startEditing = (product) => {
    idInput.value = product.id;
    nameInput.value = product.name;
    categoryInput.value = product.category;
    priceInput.value = product.price.toFixed(2);
    imageInput.value = product.imageUrl || "";
    descriptionInput.value = product.description;

    form.classList.add("is-editing");
    formTitle.textContent = `Edit product (ID ${product.id})`;
    formHint.textContent = "Change any field and press Save changes.";
    submitButton.textContent = "Save changes";
    cancelEditButton.classList.remove("d-none");
    showFormFeedback("");

    form.scrollIntoView({ behavior: "smooth", block: "start" });
    nameInput.focus({ preventScroll: true });
};

// CREATE or UPDATE (step 2): send the form to the API
const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const editingId = idInput.value;
    const productData = readForm();

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";
    showFormFeedback("");

    try {
        const data = editingId
            ? await requestApi(`${API_URL}/${editingId}`, { method: "PUT", body: JSON.stringify(productData) })
            : await requestApi(API_URL, { method: "POST", body: JSON.stringify(productData) });

        resetForm();
        showToast(`"${data.product.name}" was ${editingId ? "updated" : "added"} in the database (ID ${data.product.id}).`);
        await Promise.all([loadProducts(data.product.id), loadCategories()]);
    } catch (error) {
        submitButton.textContent = editingId ? "Save changes" : "Add product";
        showFormFeedback(error.message, true);
    } finally {
        submitButton.disabled = false;
    }
};

// DELETE (step 1): ask first
const askToDelete = (product) => {
    productToDelete = product;
    deleteProductName.textContent = product.name;
    deleteModal.show();
};

// DELETE (step 2): remove it from the database
const confirmDelete = async () => {
    const product = productToDelete;

    if (!product) {
        return;
    }

    confirmDeleteButton.disabled = true;

    try {
        await requestApi(`${API_URL}/${product.id}`, { method: "DELETE" });

        if (idInput.value === String(product.id)) {
            resetForm();
        }

        showToast(`"${product.name}" was deleted from the database.`);
        await Promise.all([loadProducts(), loadCategories()]);
    } catch (error) {
        showToast(`Could not delete "${product.name}": ${error.message}`, true);
    } finally {
        deleteModal.hide();
        confirmDeleteButton.disabled = false;
        productToDelete = null;
    }
};

form.addEventListener("submit", handleSubmit);

cancelEditButton.addEventListener("click", () => {
    resetForm();
    showFormFeedback("");
});

confirmDeleteButton.addEventListener("click", confirmDelete);

searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadProducts(), SEARCH_DELAY_MS);
});

loadProducts();
loadCategories();
