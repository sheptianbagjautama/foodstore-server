const mongoose = require('mongoose');
const Order = require('./model');
const OrderItem = require('../order-item/model');
const CartItem = require('../cart-item/model');
const DeliveryAddress = require('../delivery-address/model');
const { policyFor } = require('../policy');
const { subject } = require('@casl/ability');

async function store(req, res, next) {
	let policy = policyFor(req.user);

	if (!policy.can('create', 'Order')) {
		return res.json({
			error: 1,
			message: 'You are not allowed to perform this action'
		});
	}

	try {
		let { delivery_fee, delivery_address } = req.body;

		let items = await CartItem.find({ user: req.user._id }).populate('product');
		if (!items.length) {
			return res.json({
				error: 1,
				message: 'Can not create order because you have no items in cart'
			});
		}

		let address = await DeliveryAddress.findOne({ _id: delivery_address });
		/**
         * Membuat order tapi tidak di save terlebih dahulu, karena kita menggunakan mongoose.Types.ObjectId()
         * untuk genrate id yang akan disimpan ke table order items
         */
		let order = new Order({
			_id: new mongoose.Types.ObjectId(),
			status: 'waiting_payment',
			delivery_fee,
			delivery_address: {
				provinsi: address.provinsi,
				kabupaten: address.kabupaten,
				kecamatan: address.kecamatan,
				kelurahan: address.kelurahan,
				detail: address.detail
			},
			user: req.user._id
		});

		// Membuat Order Items
		let orderItems = await OrderItem.insertMany(
			items.map((item) => ({
				...item,
				name: item.product.name,
				qty: parseInt(item.qty),
				price: parseInt(item.product.price),
				order: order._id,
				product: item.product._id
			}))
		);

		orderItems.forEach((item) => order.order_items.push(item));

		await order.save();

		// hapus cart items
		await CartItem.deleteMany({ user: req.user._id });
		return res.json(order);
	} catch (err) {
		if (err && err.name == 'ValidationError') {
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors
			});
		}

		next(err);
	}
}

module.exports = {
	store
};
