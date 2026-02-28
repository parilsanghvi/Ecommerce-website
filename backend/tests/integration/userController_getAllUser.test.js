const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock catchAsyncErrors
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

const userController = require('../../controllers/userController');
const User = require('../../models/userModel');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('getAllUser Integration Test (Pagination)', () => {
  jest.setTimeout(60000);

  it('should return paginated users and counts correctly', async () => {
    // Insert 15 users
    const usersToInsert = [];
    for (let i = 0; i < 15; i++) {
        usersToInsert.push({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            password: 'password123',
            avatar: {
                public_id: 'test_id',
                url: 'test_url'
            },
            role: 'user'
        });
    }
    await User.insertMany(usersToInsert);

    // Request Page 1
    const req1 = {
      query: {
        page: '1'
      }
    };

    const res1 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next1 = jest.fn();

    await userController.getAllUser(req1, res1, next1);

    expect(res1.status).toHaveBeenCalledWith(200);
    const data1 = res1.json.mock.calls[0][0];

    expect(data1.success).toBe(true);
    expect(data1.totalUsers).toBe(15);
    expect(data1.resultPerPage).toBe(10);
    expect(data1.users.length).toBe(10); // Page 1 should have 10 users

    // Request Page 2
    const req2 = {
      query: {
        page: '2'
      }
    };

    const res2 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next2 = jest.fn();

    await userController.getAllUser(req2, res2, next2);

    expect(res2.status).toHaveBeenCalledWith(200);
    const data2 = res2.json.mock.calls[0][0];

    expect(data2.success).toBe(true);
    expect(data2.totalUsers).toBe(15);
    expect(data2.resultPerPage).toBe(10);
    expect(data2.users.length).toBe(5); // Page 2 should have 5 users
  });
});
