const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifNoSetUp(), this.index);

    return router;
  },
  index(req, res) {req.user.getProfile()
    .then((p) => {
      res.render('profile', { user: req.user, profile: p, success: req.flash('success') });
    });
  },
};