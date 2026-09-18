const { PlaidApi } = require('plaid');
console.log(Object.keys(PlaidApi.prototype).filter(k => k.toLowerCase().includes('refresh')));
