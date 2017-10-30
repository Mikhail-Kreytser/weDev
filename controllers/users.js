const express = require('express');
const models = require('../models');
const passport = require('../middlewares/authentication');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotAdmin(), this.index);
    router.get('/:the_username',Redirect.ifNotAdmin(), this.show);

    return router;
  },
  index(req, res) {
    models.User.findAll({
    }).then((allUsers) => {
      res.render('users', { allUsers });
    });
  },
  show(req, res) {
    models.User.findOne({
      where: {
        username: req.the_username,
      },
    }).then((user) => {
      if(user) {
        res.render('users/single', { user: user, allPosts: user.posts });
      } else {
        console.log(user)
        res.redirect('/users');
      }
    }).catch(() => {
      res.redirect('/profile');
    });
  },
};
