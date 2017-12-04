const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/email/:email', this.index);
    return router; 
  },
  index(req, res) {
    models.User.findAndCountAll({
      where:{
        email : req.params.email,
      },
    }).then((username) => {
      console.log(req.params.email);
      if(username.count == 0)
        res.send('free');
      else
        res.send('taken');

    });
  },
};
