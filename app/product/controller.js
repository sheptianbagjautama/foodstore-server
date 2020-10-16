const fs = require('fs');
const path = require('path');
const Product = require('./model');
const Category = require('../category/model');
const Tag = require('../tag/model');
const config = require('../config');
const { policyFor } = require('../policy');

async function index(req, res, next) {
	try {
		console.log('ini adalah data produk');
		console.log(Product.find({}));
		let { limit = 10, skip = 0, q = '', category = '', tags = [] } = req.query;
		let criteria = {};
		if (q.length) {
			criteria = {
				...criteria,
				name: { $regex: `${q}`, $options: 'i' }
			};
		}

		if (category.length) {
			category = await Category.findOne({ name: { $regex: `${category}`, $options: 'i' } });
			if (category) {
				criteria = { ...criteria, category: category._id };
			}
		}

		if (tags.length) {
			tags = await Tag.find({ name: { $in: tags } });
			criteria = { ...criteria, tags: { $in: tags.map((tag) => tag._id) } };
		}
		let count = await Product.find(criteria).countDocuments();

		let products = await Product.find(criteria)
			.limit(parseInt(limit))
			.skip(parseInt(skip))
			.populate('category')
			.populate('tags');
		return res.json({ data: products, count });
	} catch (err) {
		next(err);
	}
}

async function store(req, res, next) {
	try {
		let policy = policyFor(req.user);
		if (!policy.can('create', 'Product')) {
			return res.json({
				error: 1,
				message: 'Anda tidak memiliki akses untuk membuat produk'
			});
		}

		let payload = req.body;

		if (payload.category) {
			// ita menggunakan $regex dengan $options bernilai i untuk incasesensitive atau tidak sensitif case, artinya misal "minuman" atau "Minuman" dianggap sama saja.
			let category = await Category.findOne({ name: { $regex: payload.category, $options: 'i' } });
			if (category) {
				payload = { ...payload, category: category._id };
			} else {
				delete payload.category;
			}
		}

		if (payload.tags && payload.tags.length) {
			// $in ini maksudnya semua request array dari tags akan di cari satu persatu ke db
			let tags = await Tag.find({ name: { $in: payload.tags } });
			if (tags.length) {
				payload = { ...payload, tags: tags.map((tag) => tag._id) };
			}
		}

		if (req.file) {
			let tmp_path = req.file.path;
			let originalExt = req.file.originalname.split('.')[req.file.originalname.split('.').length - 1];
			let filename = req.file.filename + '.' + originalExt;
			let target_path = path.resolve(config.rootPath, `public/upload/${filename}`);

			// baca file yang masih di lokasi sementara
			const src = fs.createReadStream(tmp_path);
			// pindahkan file ke lokasi permanen
			const dest = fs.createWriteStream(target_path);
			src.pipe(dest);

			console.log('cek request');
			console.log(payload);

			src.on('end', async () => {
				let product = new Product({ ...payload, image_url: filename });
				await product.save();
				return res.json(product);
			});

			src.on('error', async () => {
				next(err);
			});
		} else {
			let product = new Product(payload);
			await product.save();

			console.log('cek request');
			console.log(payload);
			return res.json(product);
		}
	} catch (err) {
		// Validasi field dari model
		if (err && err.name === 'ValidationError') {
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors
			});
		}
		// tangkap jika terjadi kesalahan kemudian gunakan method `next` agar Express memproses error tersebut
		next(err);
	}
}
async function update(req, res, next) {
	try {
		let policy = policyFor(req.user);
		if (!policy.can('update', 'Product')) {
			return res.json({
				error: 1,
				message: 'Anda tidak memiliki akses untuk mengupdate produk'
			});
		}

		console.log('ini adalah update');
		let payload = req.body;

		if (payload.category) {
			// ita menggunakan $regex dengan $options bernilai i untuk incasesensitive atau tidak sensitif case, artinya misal "minuman" atau "Minuman" dianggap sama saja.
			let category = await Category.findOne({ name: { $regex: payload.category, $options: 'i' } });
			if (category) {
				payload = { ...payload, category: category._id };
			} else {
				delete payload.category;
			}
		}

		console.log('cek payload tags');
		console.log(payload.tags);

		if (payload.tags && payload.tags.length) {
			// $in ini maksudnya semua request array dari tags akan di cari satu persatu ke db
			let tags = await Tag.find({ name: { $in: payload.tags } });
			console.log('ini adalah pencarian tags ke db');
			console.log(tags);
			if (tags.length) {
				payload = { ...payload, tags: tags.map((tag) => tag._id) };
				console.log('ini adalah konversi payload dengan tags');
				console.log(payload);
			}
		}

		if (req.file) {
			let tmp_path = req.file.path;
			let originalExt = req.file.originalname.split('.')[req.file.originalname.split('.').length - 1];
			let filename = req.file.filename + '.' + originalExt;
			let target_path = path.resolve(config.rootPath, `public/upload/${filename}`);

			// baca file yang masih di lokasi sementara
			const src = fs.createReadStream(tmp_path);
			// pindahkan file ke lokasi permanen
			const dest = fs.createWriteStream(target_path);
			src.pipe(dest);

			src.on('end', async () => {
				let product = await Product.findOne({ _id: req.params.id });
				let currentImage = `${config.rootPath}/public/upload/${process.image_url}`;
				if (fs.existsSync(currentImage)) {
					fs.unlinkSync(currentImage);
				}

				product = await Product.findOneAndUpdate(
					{ _id: req.params.id },
					{ ...payload, image_url: filename },
					{ new: true, runValidators: true }
					// Parameter ketiga merupakan options {new: true, runValidators: true}, new adalah instruksi kepada MongoDB agar mengembalikan data produk terbaru -- yang sudah diupdate -- sedangkan runValidators meminta agar Mongoose menjalankan validation juga pada operasi ini karena defaultnya validation tidak dijalankan pada operasi findOneAndUpdate.
				);
				return res.json(product);
			});

			src.on('error', async () => {
				next(err);
			});
		} else {
			let product = await Product.findOneAndUpdate({ _id: req.params.id }, payload, {
				new: true,
				runValidators: true
			});
			return res.json(product);
		}
	} catch (err) {
		// Validasi field dari model
		if (err && err.name === 'ValidationError') {
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors
			});
		}
		// tangkap jika terjadi kesalahan kemudian gunakan method `next` agar Express memproses error tersebut
		next(err);
	}
}

async function destroy(req, res, next) {
	try {
		let policy = policyFor(req.user);
		if (!policy.can('delete', 'Product')) {
			return res.json({
				error: 1,
				message: 'Anda tidak memiliki akses untuk menghapus produk'
			});
		}

		let product = await Product.findOneAndDelete({ _id: req.params.id });
		let currentImage = `${config.rootPath}/public/upload/${product.image_url}`;
		if (fs.existsSync(currentImage)) {
			fs.unlinkSync(currentImage);
		}
		return res.json(product);
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
