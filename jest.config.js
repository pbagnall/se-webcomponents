export default {
    transform: {},
    testTimeout: 35000,
    maxWorkers: 1,
    projects: [
        {
            displayName: "unit tests",
            moduleFileExtensions: ['js'],
            transformIgnorePatterns: ['<rootDir>/node_modules/'],
        }
    ]
};