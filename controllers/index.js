const models = require('../models');
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const basename = path.basename(module.filename);
const Op = models.Sequelize.Op;

fs
  .readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach(file => {
    const fileName = file.substr(0, file.length - 3);
    router.use(`/${fileName}`, require(`./${fileName}`).registerRouter());
  });

router.get('/', (req, res) => {
    models.User.findAll({
      limit: 3,
  	  where:{
  		  accountType: "Developer",
        accountStatus: {
          [Op.or]:{
            [Op.eq]:"Pending",
            [Op.or]:{
              [Op.eq]:"Approved"
            },
          },  
        },
  	  },
  	  include: [{
  		  model: models.Profile,
        where:{
          rating:{
            [Op.ne]:null
          },
        },
      }],
      order: [
        [models.Profile, 'rating', 'DESC' ],
      ], 
    }).then((topDevelopers) => {
      models.User.findAll({
      limit: 3,
      where:{
        accountType: "Customer",
        accountStatus: {
          [Op.or]:{
            [Op.eq]:"Pending",
            [Op.or]:{
              [Op.eq]:"Approved"
            },
          },  
        },
      },
      include: [{
        model: models.Profile,
        where:{
          rating:{
            [Op.ne]:null
          },
        },
      }],
      order: [
        [models.Profile, 'rating', 'DESC' ],
      ], 
    }).then((topCustomers) => {
      models.User.findAndCountAll({
        where:{
          accountStatus: {
            [Op.or]:{
              [Op.eq]:"Pending",
              [Op.or]:{
                [Op.eq]:"Approved"
              },
            },  
          },
        },
      }).then((totalUsers) => {
        models.User.findAndCountAll({
          where:{
            accountType: "Customer",
          },
          include: [{
            model: models.Profile,
            where:{
              rating:{
                [Op.gte]: 4.5,
              },
            },
          }],
        }).then((renownedCustomers) =>{
          models.User.findAndCountAll({
          where:{
            accountType: "Developer",
          },
          include: [{
            model: models.Profile,
            where:{
              rating:{
                [Op.gte]: 4.5,
              },
            },
          }],
        }).then((professionalDevelopers) =>{
            res.render('homepage', {topDevelopers, topCustomers, totalUsers:totalUsers.count, renownedCustomers:renownedCustomers.count, professionalDevelopers:professionalDevelopers.count}); 
          });
        });  
      });
    });
  });
});

module.exports = router;


   