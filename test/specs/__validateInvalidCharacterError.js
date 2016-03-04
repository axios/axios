module.exports = function validateInvalidCharacterError(error) {
  expect(error instanceof Error).toEqual(true);
  expect(/character/i.test(error.message)).toEqual(true);
};
