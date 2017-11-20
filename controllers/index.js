const express = require('express');
const fs = require('fs');
const path = require('path');
const models = require('../models');

const router = express.Router();
const basename = path.basename(module.filename);

fs
  .readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach(file => {
    const fileName = file.substr(0, file.length - 3);
    router.use(`/${fileName}`, require(`./${fileName}`).registerRouter());
  });

router.get('/', (req, res) => {
 /* models.User.findAll({
  	limit: 3,
  	where:{
  		accountType: "Developer",
  	},
  	include: [{
  		model: models.Profile,
    }],
    }).then((allUsers) => {
      res.render('homepage', { allUsers });
    });
    */
  res.render('login');
})
module.exports = router;
