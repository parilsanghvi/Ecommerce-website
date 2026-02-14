const Apifeatures = require('../../utlis/apifeatures');

describe('Apifeatures Stock Filter', () => {
    it('should convert stock[gt]=0 to { stock: { $gt: 0 } }', () => {
        const query = {
            find: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis()
        };
        const queryStr = {
            stock: { gt: '0' }
        };

        const apiFeatures = new Apifeatures(query, queryStr);
        apiFeatures.filter();

        // The filter method calls query.find() with the processed query object
        // query.find is called twice: once in search() (if called) and once in filter()
        // Wait, search() calls find() too? No, only if keyword is present.

        expect(query.find).toHaveBeenCalledWith(expect.objectContaining({
            stock: { $gt: 0 }
        }));
    });

    it('should handle other filters alongside stock', () => {
         const query = {
            find: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis()
        };
        const queryStr = {
            stock: { gt: '0' },
            category: 'Laptop',
            price: { lte: '1000' }
        };

        const apiFeatures = new Apifeatures(query, queryStr);
        apiFeatures.filter();

        expect(query.find).toHaveBeenCalledWith(expect.objectContaining({
            stock: { $gt: 0 },
            // category is processed with regex in filter()
            category: expect.objectContaining({ $regex: 'Laptop', $options: 'i' }),
            price: { $lte: 1000 }
        }));
    });
});
