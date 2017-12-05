const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/email/:email', this.indexEmail);
    router.get('/username/:username', this.indexUsername);
    return router; 
  },
  indexEmail(req, res) {
    models.User.findAndCountAll({
      where:{
        email : req.params.email,
      },
    }).then((username) => {
      if(username.count == 0)
        res.send('free');
      else
        res.send('taken');

    });
  },
  
  indexUsername(req, res) {
    models.User.findAndCountAll({
      where:{
        username : req.params.username,
      },
    }).then((username) => {
      if(username.count == 0)
        res.send('free');
      else
        res.send('taken');

    });
  },
};
