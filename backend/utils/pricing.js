const TAX_RATE = 0.18;
const SHIPPING_THRESHOLD = 1000;
const SHIPPING_FEE = 200;

/**
 * Calculates tax, shipping and total price based on items price.
 * @param {number} itemsPrice - The total price of items in the cart.
 * @returns {Object} - An object containing taxPrice, shippingPrice, and totalPrice.
 */
const calculateOrderPrices = (itemsPrice) => {
    const price = Number(itemsPrice);

    // Calculate tax
    const taxPrice = price * TAX_RATE;

    // Calculate shipping
    const shippingPrice = price > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    // Calculate total
    const totalPrice = price + taxPrice + shippingPrice;

    return {
        taxPrice,
        shippingPrice,
        totalPrice
    };
};

module.exports = {
    TAX_RATE,
    SHIPPING_THRESHOLD,
    SHIPPING_FEE,
    calculateOrderPrices
};
