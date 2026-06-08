/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.test.json',
      diagnostics: {
        ignoreCodes: ['TS2551', 'TS2339', 'TS2345', 'TS18048', 'TS18047', 'TS2724', 'TS2769']
      }
    }]
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/services/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
