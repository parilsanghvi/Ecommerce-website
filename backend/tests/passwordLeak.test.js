const express = require('express');
const request = require('supertest');

// Mocks must be created before importing the controller
jest.mock('../models/userModel', () => {
  const mockUserInstance = {
    _id: 'mock_user_id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    password: 'hashedpassword123', // the field we want to ensure is NOT in the response
    getJWTToken: jest.fn().mockReturnValue('mock_token_123'),
    comparePassword: jest.fn().mockResolvedValue(true),
    getResetPasswordToken: jest.fn().mockReturnValue('mock_reset_token'),
    save: jest.fn().mockResolvedValue(true),
  };

  return {
    create: jest.fn().mockResolvedValue(mockUserInstance),
    findOne: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserInstance)
    }),
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserInstance)
    })
  };
});

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn().mockResolvedValue({
        public_id: 'mock_public_id',
        secure_url: 'mock_secure_url'
      })
    }
  }
}));

// Mock catchAsyncErrors to bypass it or execute correctly
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => Promise.resolve(func(req, res, next)).catch(next));

const { registerUser, loginUser, resetPassword, updatePassword } = require('../controllers/userController');

describe('User Authentication Security', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock user for routes requiring authentication
    app.use((req, res, next) => {
      req.user = { _id: 'mock_user_id' };
      next();
    });

    app.post('/api/v1/register', registerUser);
    app.post('/api/v1/login', loginUser);
    app.put('/api/v1/password/reset/:token', resetPassword);
    app.put('/api/v1/password/update', updatePassword);

    // Express error handler
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Hash Exposure Prevention', () => {

    it('should NOT leak password hash in login response payload', async () => {
      const res = await request(app)
        .post('/api/v1/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('should NOT leak password hash in register response payload', async () => {
      const res = await request(app)
        .post('/api/v1/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('should NOT leak password hash in password reset response payload', async () => {
      // Create hash representation for token
      const crypto = require('crypto');
      const resetToken = 'dummy_token';
      const hash = crypto.createHash("sha256").update(resetToken).digest("hex");

      const User = require('../models/userModel');
      User.findOne = jest.fn().mockResolvedValue({
        _id: 'mock_user_id',
        password: 'old_hashed_password',
        getJWTToken: jest.fn().mockReturnValue('mock_token_123'),
        save: jest.fn().mockResolvedValue(true)
      });

      const res = await request(app)
        .put(`/api/v1/password/reset/${resetToken}`)
        .send({ password: 'newpassword123', confirmPassword: 'newpassword123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('should NOT leak password hash in password update response payload', async () => {
      const res = await request(app)
        .put('/api/v1/password/update')
        .send({
          oldPassword: 'oldpassword123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });
  });
});
