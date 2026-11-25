document.addEventListener("DOMContentLoaded", () => {
    const storagePrefix = "ironprep_checklist";
    const grid = document.getElementById("checklistGrid");
    const progressBar = document.getElementById("checklistProgress");
    const progressLabel = document.getElementById("progressLabel");
    const catalogStatus = document.getElementById("catalogStatus");
    let activeDistance = "sprint";
    let catalog = [];

    const baseItems = {
        Swim: [
            { id: "wetsuit", label: "Wetsuit", keywords: "wetsuit swim" },
            { id: "goggles", label: "Goggles", keywords: "goggles swim" },
            { id: "swim-cap", label: "Swim cap", keywords: "swim cap" },
            { id: "trisuit", label: "Tri-suit", keywords: "tri-suit trisuit" },
        ],
        Bike: [
            { id: "bike", label: "Race bike", keywords: "bike bicycle cycling" },
            { id: "helmet", label: "Aero helmet", keywords: "helmet aero" },
            { id: "spare-tube", label: "Spare tube", keywords: "tube tire tyre" },
            { id: "bike-tools", label: "Bike repair tools", keywords: "tools repair pump" },
        ],
        Run: [
            { id: "running-shoes", label: "Running shoes", keywords: "running shoes run" },
            { id: "race-belt", label: "Race belt", keywords: "race belt" },
            { id: "cap", label: "Run visor or cap", keywords: "cap visor" },
            { id: "anti-chafe", label: "Anti-chafe balm", keywords: "anti-chafe balm" },
        ],
        Nutrition: [
            { id: "energy-gels", label: "Energy gels", keywords: "gel nutrition energy" },
            { id: "electrolytes", label: "Electrolytes", keywords: "electrolyte hydration nutrition" },
            { id: "bottle", label: "Race bottles", keywords: "bottle hydration" },
        ],
    };

    const nutritionByDistance = {
        sprint: { "energy-gels": "2 gels", electrolytes: "500 ml", bottle: "1 bottle" },
        olympic: { "energy-gels": "3 gels", electrolytes: "750 ml", bottle: "2 bottles" },
        "70.3": { "energy-gels": "6-8 gels", electrolytes: "1.5 L", bottle: "2-3 bottles" },
        "140.6": { "energy-gels": "12-16 gels", electrolytes: "3 L", bottle: "3-4 bottles" },
    };

    const stateKey = () => `${storagePrefix}_${activeDistance}`;

    const getState = () => {
        try {
            const state = JSON.parse(localStorage.getItem(stateKey()) || "{}");
            return state && typeof state === "object" ? state : {};
        } catch {
            return {};
        }
    };

    const saveState = (state) => localStorage.setItem(stateKey(), JSON.stringify(state));

    const findMatch = (item, category) => {
        const terms = `${item.label} ${item.keywords || ""}`.toLowerCase();
        const categoryMatches = catalog.filter((product) => {
            const productCategory = (product.category || "").toLowerCase();
            const productText = `${product.name} ${product.description || ""}`.toLowerCase();
            const categoryFits = productCategory === category.toLowerCase() ||
                productCategory.includes(category.toLowerCase()) ||
                (category === "Bike" && (productCategory.includes("cycle") || productCategory.includes("bike")));
            const keywordFits = terms.split(/\s+/).some((term) => term.length > 2 && productText.includes(term));
            return categoryFits && keywordFits;
        });
        if (categoryMatches.length) return categoryMatches[0];

        return catalog.find((product) => {
            const productCategory = (product.category || "").toLowerCase();
            const productText = `${product.name} ${product.description || ""}`.toLowerCase();
            return terms.split(/\s+/).some((term) => term.length > 2 &&
                (productCategory.includes(term) || productText.includes(term)));
        }) || null;
    };

    const updateProgress = () => {
        const inputs = [...grid.querySelectorAll("input[type='checkbox']")];
        const packed = inputs.filter((input) => input.checked).length;
        const percent = inputs.length === 0 ? 0 : Math.round((packed / inputs.length) * 100);
        progressLabel.textContent = `${packed} of ${inputs.length} items packed`;
        progressBar.style.width = `${percent}%`;
        progressBar.textContent = `${percent}%`;
        progressBar.setAttribute("aria-valuenow", String(percent));
        document.querySelector(".progress.checklist-progress").setAttribute("aria-valuenow", String(percent));
    };

    const renderChecklist = () => {
        const state = getState();
        grid.replaceChildren();

        Object.entries(baseItems).forEach(([category, items]) => {
            const column = document.createElement("div");
            column.className = "col-md-6";
            const card = document.createElement("article");
            card.className = "contact-panel checklist-card p-4 h-100";
            const heading = document.createElement("h2");
            heading.className = "h4 mb-3";
            heading.innerHTML = `<i class="bi ${category === "Swim" ? "bi-water" : category === "Bike" ? "bi-bicycle" : category === "Run" ? "bi-person-running" : "bi-lightning-charge"} me-2"></i>${category}`;
            const list = document.createElement("div");
            list.className = "d-grid gap-3";

            items.forEach((item) => {
                const row = document.createElement("div");
                row.className = "checklist-item";
                const checkLabel = document.createElement("label");
                checkLabel.className = "form-check d-flex align-items-start gap-2";
                const checkbox = document.createElement("input");
                checkbox.className = "form-check-input";
                checkbox.type = "checkbox";
                checkbox.id = `${activeDistance}-${item.id}`;
                checkbox.checked = Boolean(state[item.id]);
                const text = document.createElement("span");
                text.className = "form-check-label";
                text.textContent = item.label;

                if (category === "Nutrition" && nutritionByDistance[activeDistance][item.id]) {
                    const quantity = document.createElement("span");
                    quantity.className = "nutrition-quantity d-block small text-accent";
                    quantity.textContent = nutritionByDistance[activeDistance][item.id];
                    text.append(quantity);
                }

                checkLabel.append(checkbox, text);
                row.append(checkLabel);

                const match = findMatch(item, category);
                if (match) {
                    const gear = document.createElement("div");
                    gear.className = "gear-match mt-2";
                    const link = document.createElement("a");
                    link.href = `/products/${match.id}`;
                    link.className = "gear-match-link";
                    link.textContent = match.name;
                    const addButton = document.createElement("button");
                    addButton.type = "button";
                    addButton.className = "btn btn-accent btn-sm";
                    addButton.textContent = "+ Cart";
                    addButton.setAttribute("aria-label", `Add ${match.name} to cart`);
                    addButton.addEventListener("click", () => {
                        window.IRONPREP.addToCart(match, 1);
                        window.IRONPREP.showToast(`${match.name} added to cart.`);
                    });
                    gear.append(link, addButton);
                    row.append(gear);
                }

                checkbox.addEventListener("change", () => {
                    const nextState = getState();
                    nextState[item.id] = checkbox.checked;
                    saveState(nextState);
                    updateProgress();
                });
                list.append(row);
            });

            card.append(heading, list);
            column.append(card);
            grid.append(column);
        });

        updateProgress();
    };

    const loadCatalog = async () => {
        try {
            const response = await fetch("/api/products", { credentials: "same-origin" });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Could not load products");
            catalog = data.products || [];
            if (catalog.length === 0) {
                catalogStatus.classList.remove("d-none");
                catalogStatus.textContent = "No catalog products are available for gear matching.";
            }
            renderChecklist();
        } catch (error) {
            catalogStatus.classList.remove("d-none");
            catalogStatus.className = "alert alert-danger";
            catalogStatus.textContent = `Could not load the live catalog: ${error.message}`;
            renderChecklist();
        }
    };

    document.getElementById("distanceTabs").addEventListener("click", (event) => {
        const button = event.target.closest("[data-distance]");
        if (!button) return;
        activeDistance = button.dataset.distance;
        document.querySelectorAll("[data-distance]").forEach((tab) => {
            const active = tab === button;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });
        renderChecklist();
    });

    document.getElementById("resetChecklist").addEventListener("click", () => {
        localStorage.removeItem(stateKey());
        renderChecklist();
        window.IRONPREP.showToast("Checklist reset.");
    });

    loadCatalog();
});
