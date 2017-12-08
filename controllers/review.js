const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');
const getSlug = require('speakingurl');
const Op = models.Sequelize.Op;


module.exports = {
  registerRouter() {
    const router = express.Router();


    router.get('/:username/:slug/createReviewWinner/:winnersName', Redirect.ifNotLoggedIn(),this.createReviewOnDev);
    router.get('/:username/:slug/createReviewCustomer/:winnersName', Redirect.ifNotLoggedIn(),  this.createReviewOnCus);

    router.post('/:username/:slug/createReviewCustomer/:winnersName', Redirect.ifNotLoggedIn() , this.postReviewOnCus);
    router.post('/:username/:slug/createReviewWinner/:winnersName', Redirect.ifNotLoggedIn(),this.postReviewOnDev);




    return router;
  },
    postReviewOnCus(req, res) {
    models.User.findOne({
      where:{
        username: req.params.username,
      },
    }).then((customer) => {
      models.Review.create({
        comment: req.body.comment,
        rating: req.body.rating,
        ownerId: req.user.id,
        recipientId: customer.id,
      }).then((review)=> {
        models.Post.findOne({
          where: {
            slug: req.params.slug,
          },
        }).then((post)=>{
          models.WorkOrder.findOne({
            where: {
              postId:post.id,
              userId:req.user.id,
            },
          }).then((workOrder)=>{
            workOrder.update({
              DeveloperMadeReview: true,
            }).then(() => {
              res.redirect('/');
            });
          });
        });
      });
    });
  },


  postReviewOnDev(req, res) {
    models.User.findOne({
      where:{
        username: req.params.winnersName,
      },
      include:[{
        model: models.Wallet,
      }],  
    }).then((developer) => {
      models.Review.create({
        comment: req.body.comment,
        rating: req.body.rating,
        ownerId: req.user.id,
        recipientId: developer.id,
      }).then((review)=> {
        models.Post.findOne({
          where: {
            slug: req.params.slug,
          },
        }).then((post)=>{
          var titleP = post.title; 
          models.WorkOrder.findOne({
            where: {
              postId:post.id,
              userId:developer.id,
            },
          }).then((workOrder)=>{
            if(review.rating >= 3){
              var half = workOrder.price/2;
              var fee = workOrder.price * 0.05;
              models.Wallet.update({ 
                amountDeposited: (developer.wallet.amountDeposited + (half - fee)),
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
                    amountDeposited: (admin.wallet.amountDeposited - (half - fee)),
                  },
                  {
                    where: {
                      userId: admin.id,
                    },
                    returning: true,
                  }).then(() => {
                    workOrder.update({
                      closed: true,
                      CustomerMadeReview: true,
                    }).then(() => {
                      post.update({
                        closed: true,
                      }).then(() => {
                        models.SystemMessage.create({
                          userId: developer.id,
                            comment: "Congratulations, the customer has accepted the complete project \""+titleP+"\". " +
                                     "You have been credited the remaining balance. A 5% was fee was charged for using weDev.",
                            seen: false,  
                        }).then((systemMessage) => {
                          res.redirect('/');
                        });
                      });
                    });
                  });
                });
              });
            }
            else{
              workOrder.update({
                CustomerMadeReview: true,
              }).then(() => {
                models.SystemMessage.create({
                  userId: req.user.id,
                    comment: "The Admin has been notified regarding the low rating on the project \""+titleP+"\". " +
                             "Please be patient and wait for a response, Thank You.",
                    seen: false,  
                }).then((systemMessage) => {
                  res.redirect('/');
                });
              });
            }
          });
        });
      });
    });
  },    

    createReviewOnDev(req,res) {
    models.Post.findOne({
      where: {
        slug: req.params.slug,
      },
      include: [{
        model: models.User,
        where: {
          username: req.params.username,
        },
      }],
    }).then((post) => {
      models.WorkOrder.findOne({
        where:{
          postId: post.id,
        },
      }).then((workOrder) => {
        if (workOrder.complete && workOrder.CustomerReviewPending && !workOrder.closed)
          models.User.findOne({
            where: {
              id: workOrder.userId,
            },
            include: [{
              model: models.Profile,
            }]
          }).then((userBeingReviewed) => {
            res.render('posts/review/create-review', {poster: req.params.username, winnersName: req.params.winnersName, slug: req.params.slug, post, workOrder, userBeingReviewed});
          });
      });
    });
  },

  createReviewOnCus(req,res) {
    models.Post.findOne({
      where: {
        slug: req.params.slug,
      },
      include: [{
        model: models.User,
        where: {
          username: req.params.username,
        },
      }],
    }).then((post) => {
      models.WorkOrder.findOne({
        where:{
          postId: post.id,
        },
      }).then((workOrder) => {
        if (workOrder.complete && !workOrder.DeveloperMadeReview)
          models.User.findOne({
            where: {
              id: post.userId,
            },
            include: [{
              model: models.Profile,
            }]
          }).then((userBeingReviewed) => {
            res.render('posts/review/create-review', {poster: req.params.username, winnersName: req.params.winnersName, slug: req.params.slug, post, workOrder, userBeingReviewed});
          });
        else
           res.redirect('/posts');
      });
    });
  },

};