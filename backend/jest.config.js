module.exports = {
    testEnvironment: 'node',
    verbose: true,
    testMatch: ['**/backend/tests/**/*.test.js'],
    forceExit: true,
    // setupFilesAfterEnv: ['./backend/tests/setup.js'], // Optional: if we need global setup
};
