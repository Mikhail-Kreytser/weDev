const express = require('express');
const models = require('../models');
const passport = require('../middlewares/authentication');
const Redirect = require('../middlewares/redirect');
const Op = models.Sequelize.Op;

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotLoggedIn(), Redirect.ifNotAdmin(), this.index);
    router.get('/user/:username', Redirect.ifNotLoggedIn(), Redirect.ifNotAdmin(), this.showUser);
    router.get('/workOrder/:workOrder', Redirect.ifNotLoggedIn(), Redirect.ifNotAdmin(), this.showWorkOrder);
    router.put('/workOrder/:workOrder', Redirect.ifNotLoggedIn(), Redirect.ifNotAdmin(), this.updateWorkOrder);
    router.put('/user/:username', Redirect.ifNotLoggedIn(), Redirect.ifNotAdmin(), this.updateUser);

    return router;
  },

  index(req, res) {
    models.User.findAll({
      where: {
        accountStatus: "Approved",
      },
    }).then((allApprovedUsers) => {
      models.User.findAll({
        where: {
          accountStatus: "Pending",
        },
        include: [{
          model: models.Wallet,
        }],
      }).then((allPendingUsers) => {
        models.User.findAll({
          where: {
            accountStatus: {
              [Op.and]:{
                [Op.ne]:"Pending",
                [Op.and]:{
                  [Op.ne]:"Approved"
                },
              },  
            },
          },
        }).then((allBlockedUsers) => {
          models.WorkOrder.findAll({
            where:{
              closed: false,
              CustomerMadeReview: true,
            },
            include: [{
              model: models.Post,
            }],
          }).then((badReviewdWorkOrder) => {
            models.WorkOrder.findAll({
              where:{
                closed: true,
              },
              include: [{
                model: models.Post,
              }],
            }).then((closedWorkOrder) => {
              models.WorkOrder.findAll({
                where:{
                  closed: false,
                  CustomerMadeReview: false,
                  complete: true,
                },
                include: [{
                  model: models.Post,
                }],
              }).then((ProjectCompleteWorkOrder) => {
                models.WorkOrder.findAll({
                  where:{
                    closed: false,
                    CustomerMadeReview: false,
                    complete: false,
                  },
                  include: [{
                    model: models.Post,
                  }],
                }).then((ProjectNotCompleteWorkOrder) => {

                  res.render('tools', {ProjectNotCompleteWorkOrder,ProjectCompleteWorkOrder, allApprovedUsers, allPendingUsers, allBlockedUsers,badReviewdWorkOrder, closedWorkOrder });
                });
              });
            });
          });
        });
      });
    });
  },

  showUser(req, res) {
    models.User.findOne({
      where: {
        username: req.params.username,
      },
    }).then((user) => {
      if(user) {
        res.render('tools/users/single', { user: user });
      } else {
        res.redirect('/tools');
      }
    }).catch(() => {
      res.redirect('/profile');
    });
  },

  showWorkOrder(req, res) {
    models.WorkOrder.findOne({
      where: {
        id: req.params.workOrder,
      },
    }).then((workOrder) => {
      if(workOrder) {
        workOrder.getPost({}).then((post)=>{
          post.getUser({
            include: [{
              model: models.Profile,
            }],
          }).then((customer) =>{
            workOrder.getUser({
              include: [{
                model: models.Profile,
              }],
            }).then((developer)=>{
              models.Review.findOne({
                where:{
                  ownerId: customer.id,
                  recipientId: developer.id,
                },
              }).then((review) => {
                var half = Math.floor((workOrder.price/2)* 100) / 100;
                var disabled = "disabled";
                if ( workOrder.closed !== true && workOrder.CustomerMadeReview == true && workOrder.CustomerReviewPending == true)
                  disabled = "";

                res.render('tools/workOrder', {half: half, workOrder, disabled, post, customer, developer, review });
              });
            });
          });
        });
      } else {
        res.redirect('/tools');
      }
    }).catch(() => {
      res.redirect('/tools');
    });
  },

  updateWorkOrder(req, res) {

    models.WorkOrder.findOne({
      where: {
        id: req.params.workOrder,
      },
    }).then((workOrder)=>{
      workOrder.getPost({}).then((post)=>{
        var postT=post.title;
        post.getUser({
          include: [{
            model: models.Wallet,
          }],
        }).then((customer)=>{
          workOrder.getUser({
            include: [{
              model: models.Wallet,
            }],
          }).then((developer) => {
            var refund = workOrder.price/2 - req.body.payment;
            var remaining = req.body.payment;
            var fee = workOrder.price * 0.05;
            if(refund >0 ){
              models.Wallet.update({
                amountDeposited: (customer.wallet.amountDeposited + refund),
              },
              {
                where: {
                    userId: customer.id,
                  },
                returning: true,
              }).then(() => {
                models.SystemMessage.create({
                  userId: customer.id,
                  comment: "We have reviewed the project: \""+postT+"\". " +
                           "You have been credited " + refund,
                  seen: false,  
                }).then((systemMessage) => {
                });
              });
            }
            models.Wallet.update({
              amountDeposited: (developer.wallet.amountDeposited + (remaining - fee)),
            },
            {
              where: {
                  userId: developer.id,
                },
              returning: true,
            }).then(() => {
              models.User.findOne({
                where:{
                  username: "Admin",
                },
                include:[{
                  model: models.Wallet,
                }],  
              }).then((admin) => {
                models.Wallet.update({
                  amountDeposited: (admin.wallet.amountDeposited - (remaining - fee)),
                },
                {
                  where: {
                    userId: admin.id,
                  },
                  returning: true,
                }).then(() => {
                  workOrder.update({
                    closed: true,
                  }).then(()=>{
                    post.update({
                      closed: true,
                    }).then(() => {
                      models.SystemMessage.create({
                        userId: developer.id,
                        comment: "Because of the customer's concerns, we reevaluated the project's price,\""+postT+"\". " +
                                 "You have been credited the remaining balance. A 5% was fee was charged for using weDev.",
                        seen: false,  
                      }).then((systemMessage) => {
                        res.redirect(`/tools/#workOrders`)
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  },

  updateUser(req, res) {
    models.User.update({
      accountType: req.body.accountType,
      accountStatus: req.body.accountStatus,
    },
    {
      where: {
        username: req.params.username,
      },
      /*include: [{
        model: models.User,
        where: {
          username: req.params.username,
        },
      }],*/
      returning: true,
    }).then(([numRows, rows]) => {
      const post = rows[0];
      res.redirect(`/tools/#users`);///${req.user.username}/`);
    });
  },

  // EXPEREMENTAL 

  delete(req, res) {
    models.User.destroy({
      where: {
        username: req.params.username,
      },
      include: [{
        model: models.User,
        where: {
          username: req.params.username,
        },
      }],
    }).then(() => {
      res.redirect('/posts');
    });
  },
};