const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotLoggedInNoSetUp(), this.index);

    return router;
  },
  index(req, res) {/*
  	models.Profile.findOne({
      where: {
        id: req.user.profileId,
      }      
    }).then((user)) =>{/*
    models.User.findOne({
       where: {
         username: req.params.username,
       }
    })*/
      res.render('profile', { user: req.user, success: req.flash('success') });
  	//};
  },
};