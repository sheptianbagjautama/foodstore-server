const mongoose = require('mongoose');
const { dbHost, dbName, dbPort, dbPass, dbUser, linkDB } = require('../app/config');
mongoose.connect(`${linkDB}`, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false
});

console.log(linkDB);

const db = mongoose.connection;

module.exports = db;
