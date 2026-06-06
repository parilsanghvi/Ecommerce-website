console.log('Setup Env File Loaded');
process.env.STRIPE_SECRET_KEY = 'test_stripe_key';
process.env.STRIPE_API_KEY = 'test_stripe_public_key';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRE = '5d';
process.env.COOKIE_EXPIRE = 5;
process.env.CLOUDINARY_NAME = 'test_cloud';
process.env.CLOUDINARY_API_KEY = 'test_key';
process.env.CLOUDINARY_API_SECRET = 'test_secret';
process.env.SMPT_SERVICE = 'gmail';
process.env.SMPT_MAIL = 'test@gmail.com';
process.env.SMPT_PASSWORD = 'password';
process.env.RESEND_API_KEY = 're_test_api_key_123';

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn().mockImplementation((opts, cb) => {
                const result = {
                    public_id: 'test_public_id',
                    secure_url: 'https://res.cloudinary.com/test_cloud/image/upload/v1/products/test_public_id'
                };
                if (cb) {
                    cb(null, result);
                }
                return {
                    end: (buffer) => {
                        if (cb) {
                            cb(null, result);
                        }
                    }
                };
            }),
            upload: jest.fn().mockResolvedValue({
                public_id: 'test_public_id',
                secure_url: 'https://res.cloudinary.com/test_cloud/image/upload/v1/products/test_public_id'
            }),
            destroy: jest.fn().mockResolvedValue({ result: 'ok' })
        }
    }
}));
