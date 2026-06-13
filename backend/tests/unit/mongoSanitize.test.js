const mongoSanitize = require('../../middleware/mongoSanitize');

describe('Middleware: mongoSanitize', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = {};
        mockRes = {};
        mockNext = jest.fn();
    });

    it('should not modify a clean object', () => {
        mockReq.body = { name: 'John', age: 30 };
        mongoSanitize(mockReq, mockRes, mockNext);

        expect(mockReq.body).toEqual({ name: 'John', age: 30 });
        expect(mockNext).toHaveBeenCalled();
    });

    it('should remove keys starting with $ from req.body', () => {
        mockReq.body = { $where: 'sleep(1000)', name: 'John' };
        mongoSanitize(mockReq, mockRes, mockNext);

        expect(mockReq.body).toEqual({ name: 'John' });
        expect(mockNext).toHaveBeenCalled();
    });

    it('should remove keys starting with $ from req.query', () => {
        mockReq.query = { $ne: null, role: 'admin' };
        mongoSanitize(mockReq, mockRes, mockNext);

        expect(mockReq.query).toEqual({ role: 'admin' });
        expect(mockNext).toHaveBeenCalled();
    });

    it('should remove keys starting with $ from req.params', () => {
        mockReq.params = { id: '123', $regex: '.*' };
        mongoSanitize(mockReq, mockRes, mockNext);

        expect(mockReq.params).toEqual({ id: '123' });
        expect(mockNext).toHaveBeenCalled();
    });

    it('should recursively sanitize nested objects', () => {
        mockReq.body = {
            user: {
                $gt: ''
            },
            profile: {
                details: {
                    $set: { role: 'admin' },
                    age: 25
                }
            }
        };
        mongoSanitize(mockReq, mockRes, mockNext);

        expect(mockReq.body).toEqual({
            user: {},
            profile: {
                details: {
                    age: 25
                }
            }
        });
        expect(mockNext).toHaveBeenCalled();
    });

    it('should not throw if req.body, req.query, or req.params are undefined', () => {
        // mockReq is an empty object
        mongoSanitize(mockReq, mockRes, mockNext);

        expect(mockReq.body).toBeUndefined();
        expect(mockReq.query).toBeUndefined();
        expect(mockReq.params).toBeUndefined();
        expect(mockNext).toHaveBeenCalled();
    });

    it('should handle arrays with objects', () => {
        mockReq.body = [
            { $gt: 5, validKey: true },
            { anotherKey: 'value' }
        ];
        mongoSanitize(mockReq, mockRes, mockNext);

        expect(mockReq.body).toEqual([
            { validKey: true },
            { anotherKey: 'value' }
        ]);
        expect(mockNext).toHaveBeenCalled();
    });
});
