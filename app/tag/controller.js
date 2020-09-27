const Tag = require('./model');

async function index(req, res, next) {
	try {
		let { limit = 10, skip = 0 } = req.query;
		let tags = await Tag.find().limit(parseInt(limit)).skip(parseInt(skip));
		return res.json(tags);
	} catch (err) {
		next(err);
	}
}

async function store(req, res, next) {
	try {
		let payload = req.body;
		let tag = new Tag(payload);
		await tag.save();
		return res.json(tag);
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
		let tag = await Tag.findOneAndUpdate({ _id: req.params.id }, payload, {
			new: true,
			runValidators: true
		});
		return res.json(tag);
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
		let deleted = await Tag.findOneAndDelete({ _id: req.params.id });
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
