module.exports = {
    testEnvironment: 'node',
    verbose: true,
    testMatch: ['**/backend/tests/**/*.test.js'],
    forceExit: true,
    setupFiles: ['<rootDir>/tests/setupEnv.js'],
};
