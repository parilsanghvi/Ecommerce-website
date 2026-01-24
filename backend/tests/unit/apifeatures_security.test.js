const Apifeatures = require('../../utlis/apifeatures');

describe('Apifeatures Security (Regex Injection)', () => {
    let mockQuery;

    beforeEach(() => {
        mockQuery = {
            find: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
        };
    });

    it('should escape regex characters in search keyword (Security Fix)', () => {
        const querystr = { keyword: '(' };
        const apiFeatures = new Apifeatures(mockQuery, querystr);

        apiFeatures.search();

        expect(mockQuery.find).toHaveBeenCalled();
        const findArgs = mockQuery.find.mock.calls[0][0];

        // This confirms the fix: the regex is escaped
        expect(findArgs).toHaveProperty('name');
        expect(findArgs.name).toHaveProperty('$regex');
        expect(findArgs.name.$regex).toBe('\\(');
    });

    it('should escape regex characters in category filter (Security Fix)', () => {
        const querystr = { category: '(' };
        const apiFeatures = new Apifeatures(mockQuery, querystr);

        apiFeatures.filter();

        expect(mockQuery.find).toHaveBeenCalled();
        const findArgs = mockQuery.find.mock.calls[0][0];

        // This confirms the fix: the regex is escaped
        expect(findArgs).toHaveProperty('category');
        expect(findArgs.category).toHaveProperty('$regex');
        expect(findArgs.category.$regex).toBe('\\(');
    });
});
