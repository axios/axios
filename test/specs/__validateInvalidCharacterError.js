module.exports = function validateInvalidCharacterError(error) {
  expect(/character/i.test(error.message)).toEqual(true);
};
