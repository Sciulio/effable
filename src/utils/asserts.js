module.exports = {
  assertNotNullishString = (text, errorMsg) => {
    if (typeof text === 'string' && !!text) {
      return true;
    }

    throw errorMsg;
  }
}