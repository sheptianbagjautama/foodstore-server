const User = require('../user/model');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');

async function login(req, res, next) {
	passport.authenticate('local', async function(err, user) {
		console.log(config.secretKey);
		if (err) return next(err);

		if (!user) return res.json({ error: 1, message: 'email or password incorrect' });

		// (1) buat JSON Web Token
		let signed = jwt.sign(user, config.secretKey); // <--- ganti secret key dengan keymu sendiri, bebas yang sulit ditebak
		// (2) simpan token tersebut ke user terkait
		await User.findOneAndUpdate({ _id: user._id }, { $push: { token: signed } }, { new: true });

		// (3) response ke _client_
		return res.json({
			message: 'logged in successfully',
			user: user,
			token: signed
		});
	})(req, res, next);
}

async function register(req, res, next) {
	try {
		const payload = req.body;
		let user = new User(payload);
		await user.save();
		return res.json(user);
	} catch (error) {
		if (error && error.name === 'ValidationError') {
			return res.json({
				error: 1,
				message: error.message,
				fields: error.errors
			});
		}

		next(error);
	}
}

async function localStrategy(email, password, done) {
	try {
		let user = await User.findOne({ email }).select('-__v -createdAt -updatedAt -cart_items -token');

		if (!user) return done();

		if (bcrypt.compareSync(password, user.password)) {
			({ password, ...userWithoutPassword } = user.toJSON());

			return done(null, userWithoutPassword);
		}
	} catch (err) {
		done(err, null);
	}

	done();
}
module.exports = {
	login,
	register,
	localStrategy
};
