const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotLoggedIn(), Redirect.ifNoWalletCreated(), Redirect.ifApproved(), this.index);

    return router;
  },
  index(req, res) {
    res.render('approval-status', { user: req.user, success: req.flash('success') });
  },
};