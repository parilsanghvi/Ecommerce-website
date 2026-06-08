module.exports = {
    rootDir: '..',
    testEnvironment: 'node',
    verbose: true,
    testMatch: ['<rootDir>/backend/tests/**/*.test.js'],
    forceExit: true,
    setupFiles: ['<rootDir>/backend/tests/setupEnv.js'],
    resetModules: true,
};
