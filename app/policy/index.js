const { AbilityBuilder, Ability } = require('@casl/ability');

const policies = {
	guest(user, { can }) {
		can('read', 'Product');
	},

	user(user, { can }) {
		// membaca daftar order
		can('view', 'Order');

		// membuat order
		can('create', 'Order');

		// membaca order miliknya
		can('read', 'Order', { user_id: user._id });

		// mengupdate data dirinya sendiri ('user')
		can('update', 'User', { _id: user._id });

		// membaca Cart miliknya
		can('read', 'Cart', { user_id: user._id });

		//mengupdate Cart miliknya
		can('update', 'Cart', { user_id: user._id });

		// melihat daftar Delivery Address
		can('view', 'DeliveryAddress');

		// membuat Delivery Address
		can('create', 'DeliveryAddress', { user_id: user._id });

		// membaca Delivery Address miliknya
		can('read', 'DeliveryAddress', { user_id: user._id });

		//mengupdate Delivery Address miliknya
		can('update', 'DeliveryAddress', { user_id: user._id });

		// menghapus Delivery Address miliknya
		can('delete', 'DeliveryAddress', { user_id: user._id });

		// membaca Invoice miliknya
		can('read', 'Invoice', { user_id: user._id });
	},

	admin(user, { can }) {
		can('manage', 'all');
	}
};

function policyFor(user) {
	let builder = new AbilityBuilder();

	if (user && typeof policies[user.role] === 'function') {
		policies[user.role](user, builder);
	} else {
		policies['guest'](user, builder);
	}

	return new Ability(builder.rules);
}

module.exports = {
	policyFor
};
