const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');

let mongoServer;

jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn().mockResolvedValue({
                public_id: 'test_public_id',
                secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            }),
            destroy: jest.fn(),
        },
    },
}));

// Mock sendEmail to prevent actual emails
jest.mock('resend', () => {
    return {
        Resend: jest.fn().mockImplementation(() => {
            return {
                emails: {
                    send: jest.fn().mockResolvedValue({ id: 'test_id' }),
                },
            };
        }),
    };
});

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
});

describe('Authentication Integration Tests', () => {

    // ==================== REGISTRATION ====================
    describe('POST /api/v1/register', () => {
        it('should register a new user with valid data', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
            };

            const res = await request(app)
                .post('/api/v1/register')
                .send(userData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.user).toHaveProperty('email', userData.email);
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should fail registration without avatar', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/v1/register')
                .send(userData);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Please upload avatar');
        });

        it('should fail registration with short password', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'short',
                avatar: 'data:image/png;base64,test'
            };

            const res = await request(app)
                .post('/api/v1/register')
                .send(userData);

            expect(res.status).toBe(400);
        });

        it('should fail registration with invalid email', async () => {
            const userData = {
                name: 'Test User',
                email: 'invalidemail',
                password: 'password123',
                avatar: 'data:image/png;base64,test'
            };

            const res = await request(app)
                .post('/api/v1/register')
                .send(userData);

            expect(res.status).toBe(400);
        });

        it('should fail registration with duplicate email', async () => {
            await User.create({
                name: 'Existing User',
                email: 'duplicate@example.com',
                password: 'password123',
                avatar: { public_id: 'id', url: 'url' }
            });

            const userData = {
                name: 'New User',
                email: 'duplicate@example.com',
                password: 'password123',
                avatar: 'data:image/png;base64,test'
            };

            const res = await request(app)
                .post('/api/v1/register')
                .send(userData);

            expect(res.status).toBe(400);
        });
    });

    // ==================== LOGIN ====================
    describe('POST /api/v1/login', () => {
        beforeEach(async () => {
            await User.create({
                name: 'Login User',
                email: 'login@example.com',
                password: 'password123',
                avatar: { public_id: 'test_id', url: 'test_url' }
            });
        });

        it('should login with correct credentials', async () => {
            const res = await request(app)
                .post('/api/v1/login')
                .send({ email: 'login@example.com', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.body.user.email).toBe('login@example.com');
        });

        it('should fail with incorrect password', async () => {
            const res = await request(app)
                .post('/api/v1/login')
                .send({ email: 'login@example.com', password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('invalid password');
        });

        it('should fail with non-existent email', async () => {
            const res = await request(app)
                .post('/api/v1/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('invalid email');
        });

        it('should fail without email or password', async () => {
            const res = await request(app)
                .post('/api/v1/login')
                .send({ email: 'login@example.com' });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Please enter password');
        });
    });

    // ==================== LOGOUT ====================
    describe('GET /api/v1/logout', () => {
        it('should logout user and clear cookie', async () => {
            const res = await request(app).get('/api/v1/logout');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('user logged out');
            expect(res.headers['set-cookie']).toBeDefined();
        });
    });

    // ==================== FORGOT PASSWORD ====================


    // ==================== USER PROFILE ====================
    describe('GET /api/v1/me (User Profile)', () => {
        let userCookie;

        beforeEach(async () => {
            await User.create({
                name: 'Profile User',
                email: 'profile@example.com',
                password: 'password123',
                avatar: { public_id: 'id', url: 'url' }
            });

            const loginRes = await request(app)
                .post('/api/v1/login')
                .send({ email: 'profile@example.com', password: 'password123' });
            userCookie = loginRes.headers['set-cookie'];
        });

        it('should get authenticated user details', async () => {
            const res = await request(app)
                .get('/api/v1/me')
                .set('Cookie', userCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe('profile@example.com');
        });

        it('should fail without authentication', async () => {
            const res = await request(app).get('/api/v1/me');

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Please login to access this page');
        });
    });

    // ==================== UPDATE PASSWORD ====================
    describe('PUT /api/v1/password/update', () => {
        let userCookie;

        beforeEach(async () => {
            await User.create({
                name: 'Update User',
                email: 'update@example.com',
                password: 'password123',
                avatar: { public_id: 'id', url: 'url' }
            });

            const loginRes = await request(app)
                .post('/api/v1/login')
                .send({ email: 'update@example.com', password: 'password123' });
            userCookie = loginRes.headers['set-cookie'];
        });

        it('should update password with correct old password', async () => {
            const res = await request(app)
                .put('/api/v1/password/update')
                .set('Cookie', userCookie)
                .send({
                    oldPassword: 'password123',
                    newPassword: 'newpassword123',
                    confirmPassword: 'newpassword123'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should fail with incorrect old password', async () => {
            const res = await request(app)
                .put('/api/v1/password/update')
                .set('Cookie', userCookie)
                .send({
                    oldPassword: 'wrongpassword',
                    newPassword: 'newpassword123',
                    confirmPassword: 'newpassword123'
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toContain('old password is incorrect');
        });

        it('should fail when passwords do not match', async () => {
            const res = await request(app)
                .put('/api/v1/password/update')
                .set('Cookie', userCookie)
                .send({
                    oldPassword: 'password123',
                    newPassword: 'newpassword123',
                    confirmPassword: 'differentpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.message).toContain('password doesnot match');
        });
    });

    // ==================== UPDATE PROFILE ====================
    describe('PUT /api/v1/me/update', () => {
        let userCookie;

        beforeEach(async () => {
            await User.create({
                name: 'Profile User',
                email: 'profile@example.com',
                password: 'password123',
                avatar: { public_id: 'id', url: 'url' }
            });

            const loginRes = await request(app)
                .post('/api/v1/login')
                .send({ email: 'profile@example.com', password: 'password123' });
            userCookie = loginRes.headers['set-cookie'];
        });

        it('should update user profile', async () => {
            const res = await request(app)
                .put('/api/v1/me/update')
                .set('Cookie', userCookie)
                .send({
                    name: 'Updated Name',
                    email: 'updated@example.com',
                    avatar: ''
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
