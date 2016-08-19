var Promise = require('bluebird');
var mysql = require('mysql');
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

module.exports = mysql.createPool(/* TODO */);
