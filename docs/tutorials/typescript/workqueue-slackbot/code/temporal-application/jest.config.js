// module.exports = {
//   preset: "ts-jest",
//   testEnvironment: "node",
//   testPathIgnorePatterns: ["/node_modules/", "/dist/"],
//   globals: {
//     "ts-jest": {
//       tsconfig: "tsconfig.json",
//     },
//   },
// };

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
};
