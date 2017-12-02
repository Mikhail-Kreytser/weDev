const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');
const getSlug = require('speakingurl');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', this.index);
    router.get('/new-post',  Redirect.ifNotLoggedIn(), Redirect.ifNotCustomer('/posts'), this.newPost);
    router.post('/new-post',    Redirect.ifNotLoggedIn(), Redirect.ifNotCustomer('/posts'), this.createPost);
    router.get('/:username/:slug', this.showPost);
    router.get('/:username/:slug/edit', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.edit);
    router.get('/:username/:slug/reviewWinner', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.review);
    router.get('/:username/:slug/reviewWinner/:winnersName', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.pick);
    router.get('/:username/:slug/reviewWinner/:winnersName/review', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.createReview);
    router.post('/:username/:slug/reviewWinner/:winnersName/review', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.postReview);
    router.post('/:username/:slug/selectWinner/:winnersName', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.order);
    router.put('/:username/:slug',      Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.update);
    router.delete('/:username/:slug',   Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.delete);
    router.get('/:username/:slug/new-bid',  Redirect.ifNotLoggedIn(), Redirect.ifNotDeveloper('/posts'),
                                            Redirect.ifBidOver('/posts/'), this.newBid);
    router.post('/:username/:slug/new-bid', Redirect.ifNotLoggedIn(), Redirect.ifNotDeveloper('/posts'), this.createBid);


    return router;
  },
  index(req, res) {
    models.Post.findAll({
      include: [{model: models.User}]
    }).then((allPosts) => {
      res.render('posts', { allPosts });
    });
  },

  newPost(req, res) {
    res.render('posts/new-post');
  },

  newBid(req, res) {
    res.render('posts/new-bid',{poster: req.params.username,slug: req.params.slug});
  },

  createPost(req, res) {
    req.user.createPost({
      slug: getSlug(req.body.title.toLowerCase()),
      title: req.body.title.toLowerCase(),
      body: req.body.body,
      completionDeadline: req.body.completionDeadline,
      bidingDeadline: req.body.bidingDeadline,
    }).then((post) => {
      res.redirect(`/posts/${req.user.username}/${post.slug}/`);
    }).catch(() => {
      res.render('posts/new-post');
    });
  },

  order(req, res){
    models.Post.findOne({
      where:{
        id: req.body.postId,
      },
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
            id:req.body.userId,
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
            if(customer.wallet.amountDeposited < winningBid.price){
              console.log("not enough money");
            }
            else{
              models.WorkOrder.create({
                comment: req.body.comment,
                confirmed: req.body.confirmed,
                userId: req.body.userId,
                postId: post.id,
                price: winningBid.price,
              }).then((workOrder) => {
                if(workOrder.confirmed){
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
                      console.log("created workOrder, money transfered");
                      res.redirect('/posts');
                    });
                  });
                });
              }
              else{
                console.log("created workOrder, but it needs approval");
                res.redirect('/posts');
              }
            });
          }
        });
      });
    });
    });
  },

      

  createBid(req, res) {
    models.Post.findOne({
      where:{
        slug:req.body.slug,
      },
    }).then((post)=>{
      models.Bid.findOne({
        where:{
          userId: req.user.id,
          postId: post.id,
        },
      }).then((bid) => {
        if(bid){
          if(bid.price < req.body.price)
            res.render('posts/new-bid',{poster: req.body.username, slug: post.slug, higherBid: true});
          else{  
            models.Bid.update({
              price: req.body.price,
            },
            {
            where: {
              userId: req.user.id,
              postId: post.id,
            },
            returning: true,
            }).then(() => {
              res.redirect(`/posts/${req.body.username}/${req.body.slug}/`);
            });
          }
        }
        else{
          req.user.createBid({
            price: req.body.price,
            postId: post.id,
          }).then((bid) => {
            res.redirect(`/posts/${req.body.username}/${req.body.slug}/`);
          });
        }
      });
    }).catch(() => {
        res.redirect(`/posts/${req.body.username}/${req.body.slug}/new-bid`);
    });
  },

  showPost(req, res) {
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
      models.Bid.findOne({
        where:{
          postId: post.id,
        },
        attributes:[
          [models.sequelize.fn('min', models.sequelize.col('price')),'price'],
        ],
      }).then((bid) => {
        models.WorkOrder.findAll({
          where: {
            postId: post.id,
          },
        }).then((workOrder) => {
          var workOrderCreated = false;
          var reviewPending = false;
          if (workOrder.length > 0){
            workOrderCreated = true;
            reviewPending = workOrder[0].reviewPending;
            closed = workOrder[0].closed
          }

          (post ? res.render('posts/single', { post, user: post.user, currentBid: (bid.price) ? bid.price : "No Bids yet", reviewPending , workOrderCreated, closed }) : res.redirect('/posts'));
        });
      });
    });
  },

  review(req, res) {
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
      models.Bid.findAll({
        where:{
          postId: post.id,
        },
        //order: models.sequelize.fn('max', models.sequelize.col('price')),
        include: [{
        model: models.User,
        }],
      }).then((bids) => {
        (post ? res.render('posts/review', { post, user: post.user, bids: (bids) ? bids : "No Bids" }) : res.redirect('/posts'));
      });
    });
  },

  createReview(req,res) {
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
        if (workOrder.complete && workOrder.reviewPending && !workOrder.closed)
          models.User.findOne({
            where: {
              id: workOrder.userId,
            },
            include: [{
              model: models.Profile,
            }]
          }).then((userBeingReviewed) => {
            res.render('posts/review/create-review', {poster: req.params.username, slug: req.params.slug, post, workOrder, userBeingReviewed});
          });
      });
    });
  },

  postReview(req, res) {
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
        if(review.rating >= 3){
          models.Post.findOne({
            where: {
              slug: req.params.slug,
            },
          }).then((post)=>{
            models.WorkOrder.findOne({
              where: {
                postId:post.id,
                userId:developer.id,
              },
            }).then((workOrder)=>{
              console.log(workOrder);
              console.log(workOrder.price);
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
                    }).then(() => {
                      post.update({
                        closed: true,
                      }).then(() => {
                        models.SystemMessage.create({
                          userId: developer.id,
                            comment: "Congratulations, the customer has accepted the complete project \""+titleP+"\"" +
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
            });
          });
        }
      });
    });
  },

  pick(req,res){
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
      models.Bid.findOne({
        where:{
          postId: post.id,
        },
        attributes:[
          [models.sequelize.fn('min', models.sequelize.col('price')),'price'],
        ],
      }).then((cheapestBid) => {
        models.User.findOne({
          where:{
            username: req.params.winnersName,
          },
        }).then((winningUser) =>{
          models.Bid.findOne({
            where:{
              userId: winningUser.id,
              postId: post.id,
            },
          }).then((winnersBid) =>{
            var isCheapestBid = false;
            if(cheapestBid.price == winnersBid.price)
              isCheapestBid = true;
            (post ? res.render('posts/review/winner', { post, user: post.user, winningUser, winnersBid, isCheapestBid}) : res.redirect('/posts'));
          });
        });
      });
    });
  },

  edit(req, res) {
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
    }).then((post) =>
      (post ? res.render('posts/edit', { post }) : res.redirect('/posts'))
    );
  },

  update(req, res) {
    models.Post.update({
      title: req.body.title.toLowerCase(),
      slug: getSlug(req.body.title.toLowerCase()),
      body: req.body.body,
      completionDeadline: req.body.completionDeadline,
      bidingDeadline: req.body.bidingDeadline,
    },
    {
      where: {
        slug: req.params.slug,
      },
      include: [{
        model: models.User,
        where: {
          username: req.params.username,
        },
      }],
      returning: true,
    }).then(([numRows, rows]) => {
      const post = rows[0];
      res.redirect(`/posts/${req.user.username}/${post.slug}/`);
    });
  },

  delete(req, res) {
    models.Post.destroy({
      where: {
        slug: req.params.slug,
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
