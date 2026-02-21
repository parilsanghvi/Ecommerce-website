const { performance } = require('perf_hooks');

// Simulation of the current logic in backend/controllers/orderController.js
function currentApproach(orderItems, products) {
    let calculatedItemsPrice = 0;
    for (const item of orderItems) {
        const product = products.find(p => p._id.toString() === item.product);
        if (!product) {
            throw new Error(`Product not found: ${item.product}`);
        }
        calculatedItemsPrice += product.price * item.quantity;
    }
    return calculatedItemsPrice;
}

// Simulation of the optimized logic
function optimizedApproach(orderItems, products) {
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let calculatedItemsPrice = 0;
    for (const item of orderItems) {
        const product = productMap.get(item.product);
        if (!product) {
            throw new Error(`Product not found: ${item.product}`);
        }
        calculatedItemsPrice += product.price * item.quantity;
    }
    return calculatedItemsPrice;
}

// Data Setup
const NUM_ITEMS = 1000;
const products = [];
const orderItems = [];

for (let i = 0; i < NUM_ITEMS; i++) {
    const id = `id_${i}`;
    products.push({
        _id: { toString: () => id },
        price: 100
    });
    orderItems.push({
        product: id,
        quantity: 1
    });
}

console.log(`Running benchmark with ${NUM_ITEMS} items...`);

// Warm up
for (let i = 0; i < 10; i++) {
    currentApproach(orderItems, products);
    optimizedApproach(orderItems, products);
}

const startCurrent = performance.now();
for (let i = 0; i < 100; i++) {
    currentApproach(orderItems, products);
}
const endCurrent = performance.now();
const timeCurrent = endCurrent - startCurrent;

const startOptimized = performance.now();
for (let i = 0; i < 100; i++) {
    optimizedApproach(orderItems, products);
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

console.log(`Current Approach Total Time (100 iterations): ${timeCurrent.toFixed(4)} ms`);
console.log(`Optimized Approach Total Time (100 iterations): ${timeOptimized.toFixed(4)} ms`);
console.log(`Speedup: ${(timeCurrent / timeOptimized).toFixed(2)}x`);
console.log(`Average time per call (Current): ${(timeCurrent / 100).toFixed(4)} ms`);
console.log(`Average time per call (Optimized): ${(timeOptimized / 100).toFixed(4)} ms`);
