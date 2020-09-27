const Category = require('./model');

async function index(req, res, next) {
	try {
		let { limit = 10, skip = 0 } = req.query;
		let categories = await Category.find().limit(parseInt(limit)).skip(parseInt(skip));
		return res.json(categories);
	} catch (err) {
		next(err);
	}
}

async function store(req, res, next) {
	try {
		let payload = req.body;
		let category = new Category(payload);
		await category.save();
		return res.json(category);
	} catch (err) {
		if (err && err.name === 'ValidationError') {
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors
			});
		}
		next(err);
	}
}

async function update(req, res, next) {
	try {
		let payload = req.body;
		let category = await Category.findOneAndUpdate({ _id: req.params.id }, payload, {
			new: true,
			runValidators: true
		});
		return res.json(category);
	} catch (err) {
		if (err && err.name === 'ValidationError') {
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors
			});
		}
		next(err);
	}
}

async function destroy(req, res, next) {
	try {
		let deleted = await Category.findOneAndDelete({ _id: req.params.id });
		return res.json(deleted);
	} catch (err) {
		next(err);
	}
}

module.exports = {
	index,
	store,
	update,
	destroy
};
