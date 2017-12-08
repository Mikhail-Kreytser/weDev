const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
	registerRouter() {
		const router = express.Router();

		router.get('/', this.index);

		return router;
	},

	index(req, res) {
		res.render('dashboard');
	},
};


