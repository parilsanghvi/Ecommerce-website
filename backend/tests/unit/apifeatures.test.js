const Apifeatures = require('../../utils/apifeatures');

describe('Apifeatures Class', () => {
    let mockQuery;

    beforeEach(() => {
        // Mocking the Mongoose Query object methods
        mockQuery = {
            find: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
        };
    });

    describe('search()', () => {
        it('should perform text search when keyword is present', () => {
            const queryStr = { keyword: 'apple' };
            const features = new Apifeatures(mockQuery, queryStr);

            features.search();

            expect(mockQuery.find).toHaveBeenCalledWith({
                $text: {
                    $search: 'apple',
                    $caseSensitive: false,
                    $diacriticSensitive: false
                }
            });
        });

        it('should not modify query with text search when keyword is missing', () => {
            const queryStr = {};
            const features = new Apifeatures(mockQuery, queryStr);

            features.search();

            // When no keyword, it calls find({})
            // The implementation is:
            // const keyword = ... ? { ... } : {}
            // this.query = this.query.find({ ...keyword })
            expect(mockQuery.find).toHaveBeenCalledWith({});
        });
    });

    describe('filter()', () => {
        it('should perform exact match for known categories (optimized)', () => {
            const queryStr = { category: 'laptop' }; // lowercase input
            const features = new Apifeatures(mockQuery, queryStr);

            features.filter();

            // Expect exact match with standardized casing 'Laptop'
            expect(mockQuery.find).toHaveBeenCalledWith(expect.objectContaining({
                category: 'Laptop'
            }));
        });

        it('should fallback to case-insensitive regex for unknown categories', () => {
            const queryStr = { category: 'something-else' };
            const features = new Apifeatures(mockQuery, queryStr);

            features.filter();

            expect(mockQuery.find).toHaveBeenCalledWith(expect.objectContaining({
                category: {
                    $regex: 'something\\-else',
                    $options: 'i'
                }
            }));
        });

        it('should remove excluded fields (keyword, page, limit) from filter query', () => {
            const queryStr = {
                keyword: 'test',
                page: '1',
                limit: '10',
                price: { gt: '100' }
            };
            const features = new Apifeatures(mockQuery, queryStr);

            features.filter();

            const findCall = mockQuery.find.mock.calls[0][0];

            expect(findCall).not.toHaveProperty('keyword');
            expect(findCall).not.toHaveProperty('page');
            expect(findCall).not.toHaveProperty('limit');
            expect(findCall).toHaveProperty('price');
        });

        it('should convert relational operators (gt, gte, lt, lte) to MongoDB operators', () => {
            const queryStr = {
                price: {
                    gt: '100',
                    lte: '1000'
                },
                ratings: {
                    gte: '4'
                }
            };
            const features = new Apifeatures(mockQuery, queryStr);

            features.filter();

            expect(mockQuery.find).toHaveBeenCalledWith(expect.objectContaining({
                price: {
                    $gt: 100,
                    $lte: 1000
                },
                ratings: {
                    $gte: 4
                }
            }));
        });

        it('should convert numeric strings to numbers in the query object', () => {
            const queryStr = {
                price: { gt: '1200.50' }
            };
            const features = new Apifeatures(mockQuery, queryStr);

            features.filter();

            expect(mockQuery.find).toHaveBeenCalledWith({
                price: { $gt: 1200.50 }
            });
        });

        it('should handle non-numeric strings gracefully (not convert them to NaN)', () => {
            // The code checks !isNaN(queryObj[key][op])
            const queryStr = {
                someField: { eq: 'someString' }
            };
            // However, the code only iterates if typeof queryObj[key] === 'object'
            // And assumes operations.

            // If we pass a string that is not a number, it should remain a string.
            const features = new Apifeatures(mockQuery, queryStr);

            features.filter();

            expect(mockQuery.find).toHaveBeenCalledWith({
                someField: { eq: 'someString' }
            });
        });
    });

    describe('pagiNation()', () => {
        it('should skip 0 results for the first page', () => {
            const resultPerPage = 10;
            const queryStr = { page: '1' };
            const features = new Apifeatures(mockQuery, queryStr);

            features.pagiNation(resultPerPage);

            expect(mockQuery.limit).toHaveBeenCalledWith(10);
            expect(mockQuery.skip).toHaveBeenCalledWith(0);
        });

        it('should calculate skip correctly for subsequent pages', () => {
            const resultPerPage = 5;
            const queryStr = { page: '3' };
            const features = new Apifeatures(mockQuery, queryStr);

            // skip = 5 * (3 - 1) = 10
            features.pagiNation(resultPerPage);

            expect(mockQuery.limit).toHaveBeenCalledWith(5);
            expect(mockQuery.skip).toHaveBeenCalledWith(10);
        });

        it('should default to page 1 if page is missing or invalid', () => {
            const resultPerPage = 20;
            const queryStr = {}; // page missing
            const features = new Apifeatures(mockQuery, queryStr);

            features.pagiNation(resultPerPage);

            expect(mockQuery.limit).toHaveBeenCalledWith(20);
            expect(mockQuery.skip).toHaveBeenCalledWith(0);
        });
    });
});
