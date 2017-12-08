const models = require('../models');
const express = require('express');
const Redirect = require('../middlewares/redirect');
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

router.get('/', Redirect.ifNoSetUp(), (req, res) => {
  if(req.user){
    models.SystemMessage.findAndCountAll({
      where:{
        userId: req.user.id,
        comment: {
          [Op.like]: 'This is your first warning.%',
        },
      },
    }).then((firstWarning) =>{
      var warningDate = new Date();
      warningDate.setFullYear(1997);
      if(firstWarning.count >= 1 && firstWarning.rows[0].comment.indexOf("poor performance") !== -1)
        var warningDate = firstWarning.rows[0].createdAt;
      models.Review.findAndCountAll({
        where:{
          recipientId: req.user.id,
          rating: {
            [Op.lte]: 2,
          },
          createdAt: {
            [Op.gte]: warningDate,
          },
        },
      }).then((recipientOfBadReviews) => {
        if(recipientOfBadReviews.count >= 5 && firstWarning.count >= 1){
          models.SystemMessage.create({
            userId: req.user.id,
            comment: "This is your second warning. This is regarding poor performance. You already recived another warning message. " +
                     "Your account is being terminated. You can message the administrator to reevaluate the account. Otherwise, you can " +
                     "register again after one year.",
            seen: false, 
          }).then((systemMessage) => {
            var date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            models.User.update({
              accountStatus: "Account terminated: Too many warning messages. You can register again after, " + date,
            },
            {
              where: {
                id: req.user.id,
              },
              returning: true,
            })
          });
        }
        else if(recipientOfBadReviews.count >= 5 && firstWarning.count < 1){
          models.SystemMessage.create({
            userId: req.user.id,
            comment: "This is your first warning. This is regarding poor performance. If you recive another warning message, " +
                     "Your account will be terminated. You can message the administrator to reevaluate the account.",
            seen: false, 
          }).then((systemMessage) => {
          });
        }
      });
      warningDate = new Date();
      warningDate.setFullYear(1997);
      if(firstWarning.count >= 1 && firstWarning.rows[0].comment.indexOf("irresponsible evaluations") !== -1)
        var warningDate = firstWarning.rows[0].createdAt;
      models.Review.findAndCountAll({
        where:{
          ownerId: req.user.id,
          rating: {
            [Op.lt]: 2,
          },
          createdAt: {
            [Op.gte]: warningDate,
          },
        },
      }).then((givingBadReviews) =>{
        models.Review.findAndCountAll({
          where:{
          ownerId: req.user.id,
          rating: {
            [Op.gt]: 4,
          },
          createdAt: {
            [Op.gte]: warningDate,
          },
        },
        }).then((givingGoodReviews) =>{
          if((givingBadReviews.count >= 8 || givingGoodReviews.count >= 8) && firstWarning.count >= 1){
            models.SystemMessage.create({
              userId: req.user.id,
              comment: "This is your second warning. This is regarding irresponsible evaluations. You already recived another warning message. " +
                       "Your account is being terminated. You can message the administrator to reevaluate the account. Otherwise, you can " +
                       "register again after one year.",
              seen: false, 
            }).then((systemMessage) => {
              var date = new Date();
              date.setFullYear(date.getFullYear() + 1);
              models.User.update({
                accountStatus: "Account terminated: Too many warning messages. You can register again after, " + date,
              },
              {
                where: {
                  id: req.user.id,
                },
                returning: true,
              })
            });
          }
          else if((givingBadReviews.count >= 8 || givingGoodReviews.count >= 8)  && firstWarning.count < 1){
            models.SystemMessage.create({
              userId: req.user.id,
              comment: "This is your first warning. This is regarding irresponsible evaluations. If you recive another warning message, " +
                       "Your account will be terminated. You can message the administrator to reevaluate the account.",
              seen: false, 
            }).then((systemMessage) => {
            });
          }
        });
      });
    });
  }

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
          models.WorkOrder.findAndCountAll({
          }).then(numOfProjects =>{
            res.render('homepage', {numOfProjects: numOfProjects.count, topDevelopers, topCustomers, totalUsers:totalUsers.count, renownedCustomers:renownedCustomers.count, professionalDevelopers:professionalDevelopers.count}); 
            });
          });
        });  
      });
    });
  });
  
});

module.exports = router;
