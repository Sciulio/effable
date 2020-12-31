module.exports = {
  assertAssigned: (obj, errorMsg) => {
    if (typeof obj !== 'undefined' && obj !== null) {
      return true;
    }

    throw errorMsg;
  },
  assertNotNullishString: (text, errorMsg) => {
    if (typeof text === 'string' && !!text) {
      return true;
    }

    throw errorMsg;
  }
}