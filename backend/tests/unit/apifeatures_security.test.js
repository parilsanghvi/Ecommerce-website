const Apifeatures = require('../../utils/apifeatures');

describe('Apifeatures Security (Regex Injection)', () => {
    let mockQuery;

    beforeEach(() => {
        mockQuery = {
            find: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
        };
    });

    it('should use text search for keyword', () => {
        const querystr = { keyword: '(' };
        const apiFeatures = new Apifeatures(mockQuery, querystr);

        apiFeatures.search();

        expect(mockQuery.find).toHaveBeenCalled();
        const findArgs = mockQuery.find.mock.calls[0][0];

        // Should use $text search
        expect(findArgs).toHaveProperty('$text');
        expect(findArgs.$text).toHaveProperty('$search', '(');
    });

    it('should escape regex characters in category filter', () => {
        const querystr = { category: '(' };
        const apiFeatures = new Apifeatures(mockQuery, querystr);

        apiFeatures.filter();

        expect(mockQuery.find).toHaveBeenCalled();
        const findArgs = mockQuery.find.mock.calls[0][0];

        // This confirms the regex is escaped
        expect(findArgs).toHaveProperty('category');
        expect(findArgs.category).toHaveProperty('$regex');
        expect(findArgs.category.$regex).toBe('\\(');
    });
});
