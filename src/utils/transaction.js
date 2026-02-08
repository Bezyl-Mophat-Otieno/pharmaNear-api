const generateTransactionNumber = (prefix = 'TXN') => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

module.exports = {
  generateTransactionNumber,
};