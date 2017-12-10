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
    router.put('/workOrder/:workOrder/confirm', Redirect.ifNotLoggedIn(), Redirect.ifNotAdmin(), this.confirmWorkOrder);
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
                    confirmed: true,
                  },
                  include: [{
                    model: models.Post,
                  }],
                }).then((ProjectNotCompleteWorkOrder) => {
                  models.WorkOrder.findAll({
                    where:{
                      confirmed: false,
                    },
                    include: [{
                      model: models.Post,
                    }],
                  }).then((workOrderNeedsApproval) =>{
                    models.User.findAll({
                      where: {
                        accountStatus: "Approved",
                      },
                      include: [{
                        model: models.QuitReq,
                        where:{
                          approved: true,
                          requested: true,
                        }
                      }],
                    }).then((approvedQuit) => {
                      models.User.findAll({
                        where: {
                          accountStatus: "Approved",
                        },
                        include: [{
                          model: models.QuitReq,
                          where:{
                            approved: false,
                            requested: true,
                          }
                        }],
                      }).then((needsApprovedQuit)=>{ 
                        res.render('tools', {needsApprovedQuit, approvedQuit,ProjectNotCompleteWorkOrder,ProjectCompleteWorkOrder,workOrderNeedsApproval, allApprovedUsers, allPendingUsers, allBlockedUsers,badReviewdWorkOrder, closedWorkOrder });
              
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
      res.redirect('/profile/show');
    });
  },

  showWorkOrder(req, res) {
    var needsApproval = false;
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
                if(!workOrder.confirmed)
                  needsApproval = true;
                res.render('tools/workOrder', {half: half, workOrder, disabled, post, customer, developer, review,needsApproval });
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
  confirmWorkOrder(req,res){
    if(req.body.approved == 'true'){
      models.WorkOrder.update({
        confirmed: true,
      },
      {
        where:{
          id: req.body.workOrderId,
        },
        returning: true,
      }).then((workOrder)=>{
        models.Post.findOne({
          where:{
            userId:req.body.cusId,
          },
          include:[{
            model: models.WorkOrder,
            where:{
              id: req.body.workOrderId,
            },
          }],
        }).then((post) => {
          models.User.findOne({
            where:{
              id:post.userId,
            },
            include:[{
              model: models.Wallet,
            }],
          }).then((customer) => {
            models.User.findOne({
              where:{
                id:req.body.devId,
              },
              include:[{
                model: models.Wallet,
              }],
            }).then((developer) => {
              models.Bid.findOne({
                where:{
                  postId: post.id,
                  userId: developer.id,
                },
              }).then((winningBid) => {
                var half = winningBid.price/2 ;
                models.Wallet.update({
                    amountDeposited: (customer.wallet.amountDeposited - half),
                    creditCardNumber: customer.wallet.creditCardNumber,
                    cvv: customer.wallet.cvv,
                    expirationDate: customer.wallet.expirationDate,
                    zipCode: customer.wallet.zipCode,
                  },
                  {
                  where: {
                    userId: customer.id,
                  },
                  returning: true,
                }).then(([numRows, rows]) => {
                  models.Wallet.update({
                    amountDeposited: (developer.wallet.amountDeposited + half),
                    creditCardNumber: developer.wallet.creditCardNumber,
                    cvv: developer.wallet.cvv,
                    expirationDate: developer.wallet.expirationDate,
                    zipCode: developer.wallet.zipCode,
                  },
                  {
                  where: {
                    userId: developer.id,
                  },
                  returning: true,
                }).then(([numRows, rows]) => {
                  models.SystemMessage.create({
                    userId: developer.id,
                      comment: "Congratulations! You have been chosen to develop: " + post.title,
                      seen: false, 
                  }).then((systemMessage) => {
                    models.SystemMessage.create({
                      userId: customer.id,
                        comment: "Congratulations! The workOrder for " + post.title + " was approved.",
                        seen: false, 
                    }).then((systemMessage) => {
                      models.Connection.create({
                        customerUsername: customer.username,
                        customerId: customer.id,
                        developerUsername: developer.username,
                        developerId: developer.id,
                      }).then(()=>{
                        res.redirect('/tools');
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
    }else{
      models.Post.findOne({
        where:{
          userId:req.body.cusId,
        },
        include:[{
          model: models.WorkOrder,
          where:{
            id: req.body.workOrderId,
          },
        }],
      }).then((post) => {
        models.WorkOrder.destroy({
          where: {
            id: req.body.workOrderId,
          },
        }).then(()=>{
          models.SystemMessage.create({
            userId: req.body.cusId,
              comment: "Sorry, The workOrder for " + post.title + " was not approved due to: "+req.body.reason,
              seen: false, 
          }).then((systemMessage) => {
            res.redirect('/tools');
          });
        });
      });
    }
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
    var changed = false;
    var oldType;
    models.User.findOne({
      where:{
        username: req.params.username,
      },
    }).then((user)=>{
      if (user.accountType !== req.body.accountType)
        changed = true;
      oldType = user.accountType;
      models.User.update({
        accountType: req.body.accountType,
        accountStatus: req.body.accountStatus[1],
      },
      {
        where: {
          username: req.params.username,
        },
        returning: true,
      }).then(() => {
        if(changed){
          if(oldType == "Customer" && req.body.accountType !== "Admin"){
            models.Connection.findAll({
              where:{
                customerUsername: user.username,
                customerId:user.id,
              }
            }).then((connections)=>{
              for(var i = 0; i < connections.length;i++){
                models.Connection.update({
                  customerUsername: "",
                  customerId: "",
                  developerUsername: user.username,
                  developerId: user.id,
                },
                {
                  where:{
                    customerUsername: user.username,
                    customerId:user.id,
                  },
                  returning: true,
                }).then(()=>{
                });
              }
            });
          }
          else if(req.body.accountType == "Admin"){
            models.Connection.findAll({
              where:{
                customerUsername: user.username,
                customerId:user.id,
              }
            }).then((connections)=>{
              for(var i = 0; i < connections.length;i++){
                models.Connection.update({
                  customerUsername: "",
                  customerId: "",
                  adminUsername: user.username,
                  adminId: user.id,
                },
                {
                  where:{
                    customerUsername: user.username,
                    customerId:user.id,
                  },
                  returning: true,
                }).then(()=>{
                });
              }
            });
          }
          if(oldType == "Developer" && req.body.accountType !== "Admin"){
            models.Connection.findAll({
              where:{
                developerUsername: user.username,
                developerId:user.id,
              }
            }).then((connections)=>{
              for(var i = 0; i < connections.length;i++){
                models.Connection.update({
                  developerUsername: "",
                  developerId: "",
                  customerUsername: user.username,
                  customerId: user.id,
                },
                {
                  where:{
                    developerUsername: user.username,
                    developerId:user.id,
                  },
                  returning: true,
                }).then(()=>{
                });
              }
            });
          }
          else if(req.body.accountType == "Admin"){
            models.Connection.findAll({
              where:{
                developerUsername: user.username,
                developerId:user.id,
              }
            }).then((connections)=>{
              for(var i = 0; i < connections.length;i++){
                models.Connection.update({
                  developerUsername: "",
                  developerId: "",
                  adminUsername: user.username,
                  adminId: user.id,
                },
                {
                  where:{
                    developerUsername: user.username,
                    developerId:user.id,
                  },
                  returning: true,
                }).then(()=>{
                });
              }
            });
          }
        }
        res.redirect(`/tools/#users`);
      });
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