const mongoose = require('mongoose');
const Product = require('../models/productModel');

describe('Security: Product Validation', () => {
    it('should REJECT product creation with description exceeding maxLength', async () => {
        const longDescription = 'A'.repeat(4001);
        const product = new Product({
            name: 'Test Product',
            description: longDescription,
            price: 100,
            category: 'Electronics',
            stock: 5,
            user: new mongoose.Types.ObjectId()
        });

        let error;
        try {
            await product.validate();
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.errors.description).toBeDefined();
        expect(error.errors.description.message).toBe('Description cannot exceed 4000 characters');
    });

    it('should ACCEPT product creation with valid description length', async () => {
        const validDescription = 'A'.repeat(4000);
        const product = new Product({
            name: 'Test Product',
            description: validDescription,
            price: 100,
            category: 'Electronics',
            stock: 5,
            user: new mongoose.Types.ObjectId()
        });

        let error;
        try {
            await product.validate();
        } catch (err) {
            error = err;
        }

        expect(error).toBeUndefined();
    });
});
