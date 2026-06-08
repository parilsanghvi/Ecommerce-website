module.exports = {
    rootDir: '..',
    testEnvironment: 'node',
    verbose: true,
    testMatch: ['<rootDir>/backend/tests/**/*.test.js'],
    forceExit: true,
    setupFilesAfterEnv: ['<rootDir>/backend/tests/setupEnv.js'],
};
