const products = [
    {
        id: 1,
        name: "Triathlon wetsuit",
        price: 299,
    },
    {
        id: 2,
        name: "Swimming goggles",
        price: 35,
    },
    {
        id: 3,
        name: "Road cycling helmet",
        price: 120,
    },
];

const getAll = () => products;

const getById = (id) => products.find((product) => product.id === id);

const create = ({ name, price }) => {
    const product = {
        id: products.length + 1,
        name,
        price,
    };

    products.push(product);
    return product;
};

const update = (id, changes) => {
    const product = getById(id);

    if (!product) {
        return null;
    }

    Object.assign(product, changes);
    return product;
};

const remove = (id) => {
    const index = products.findIndex((product) => product.id === id);

    if (index === -1) {
        return null;
    }

    return products.splice(index, 1)[0];
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
};
