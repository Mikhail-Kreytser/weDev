const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');
const getSlug = require('speakingurl');
const Op = models.Sequelize.Op;


module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', this.index);
    router.post('/search', this.indexSearch);
    router.get('/search', this.getSearch);
    router.get('/new-post',  Redirect.ifNotLoggedIn(), Redirect.ifNotCustomer('/posts'), Redirect.ifNoSetUp(), this.newPost);
    router.post('/new-post',    Redirect.ifNotLoggedIn(), Redirect.ifNotCustomer('/posts'), Redirect.ifNoSetUp() , this.createPost);
    router.get('/:username/:slug', this.showPost);
    router.get('/:username/:slug/edit', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.edit);
    router.get('/:username/:slug/reviewWinner', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.review);
    router.get('/:username/:slug/reviewWinner/:winnersName/:error', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.pick);


    router.get('/:username/:slug/createReviewWinner/:winnersName', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.createReviewOnDev);
    router.get('/review/:username/:slug/createReviewCustomer/:winnersName/review', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.createReviewOnCus);
    router.put('/:username/:slug/completeProject/:winnersName/',      Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.completeProject);
    router.post('/review/:username/:slug/createReviewCustomer/:winnersName/review', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.postReviewOnCus);
    router.post('/:username/:slug/createReviewWinner/:winnersName/review', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.postReviewOnDev);



    router.post('/:username/:slug/selectWinner/:winnersName', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.order);
    router.put('/:username/:slug',      Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.update);
    router.delete('/:username/:slug',   Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.delete);
    router.get('/:username/:slug/new-bid',  Redirect.ifNotLoggedIn(), Redirect.ifNotDeveloper('/posts'),
                                            Redirect.ifBidOver('/posts/'), this.newBid);
    router.post('/:username/:slug/new-bid', Redirect.ifNotLoggedIn(), Redirect.ifNotDeveloper('/posts'), this.createBid);


    return router;
  },



  getSearch(req,res){
    res.redirect('/posts');
  },
  completeProject(req,res){
    models.WorkOrder.findOne({
      where:{
        userId: req.user.id,
      },
    }).then((workOrder) => {
      models.WorkOrder.update({
        gitHub: req.body.gitHub,
        complete: req.body.complete,
        CustomerReviewPending: req.body.complete,
      },
      {
        where:{
          id:workOrder.id,
        },
        returning:true,
      }).then(()=>{
        res.redirect('/posts');
      });
    });
  },
  index(req, res) {
    var date = new Date();
    console.log(date);
    models.Post.findAll({
      where:{
        bidingDeadline: {
          [Op.gte]: date,
        },
      },
      include: [{
        model: models.User
      }],
    }).then((livePosts) => {
      models.Post.findAll({
        where:{
          bidingDeadline: {
            [Op.lte]: date,
            },
          closed: false,
        },
        include: [{
          model: models.User
        }],
      }).then((workingPosts) => {
        models.Post.findAll({
          where:{
            closed: true,
          },
          include: [{
            model: models.User
          }],
        }).then((donePosts) => {

          res.render('posts', { livePosts, workingPosts, donePosts });
        });
      });
    });
  },

  indexSearch(req, res) {
    var date = new Date();
    console.log(date);
    models.Post.findAll({
      where:{
        bidingDeadline: {
          [Op.gte]: date,
        },
      },
      include: [{
        model: models.User
      }],
    }).then((livePosts) => {
      models.Post.findAll({
        where:{
          bidingDeadline: {
            [Op.lte]: date,
            },
          closed: false,
        },
        include: [{
          model: models.User
        }],
      }).then((workingPosts) => {
        models.Post.findAll({
          where:{
            closed: true,
          },
          include: [{
            model: models.User
          }],
        }).then((donePosts) => {
          res.render('posts', { livePosts, workingPosts, donePosts, search: req.body.search});
        });
      });
    });
  },


  newPost(req, res) {
    res.render('posts/new-post');
  },

  newBid(req, res) {
    req.user.getWallet({}).then((wallet) => {
      res.render('posts/new-bid',{totalMoney : wallet.amountDeposited, poster: req.params.username, slug: req.params.slug});
    });
  },

  createPost(req, res) {
    req.user.createPost({
      slug: getSlug(req.body.title.toLowerCase()),
      title: req.body.title.toLowerCase(),
      body: req.body.body,
      //HERE
      completionDeadline: req.body.completionDeadline,
      bidingDeadline: req.body.bidingDeadline,
      //HERE
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
              res.redirect('/posts/'+req.user.username+'/'+post.slug+'/reviewWinner/'+developer.username+'/NoMoney');
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
                      if(req.user.accountType == "Customer"){
                        models.Connection.create({
                          customerUsername: req.user.username,
                          customerId: req.user.id,
                          developerUsername: developer.username,
                          developerId: developer.id,
                        }).then(()=>{
                        });
                      }          
                      res.redirect('/posts');
                    });
                  });
                });
              }
              else{
                models.SystemMessage.create({
                  userId: customer.id,
                    comment: "The Admin has been notified he will review the work order request for project \""+post.title+"\". ",
                    seen: false,  
                }).then((systemMessage) => {
                  res.redirect('/posts');
                });
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
        models.Wallet.findOne({
          where:{
            userId: req.user.id,
          },
        }).then((wallet)=>{
          if(req.body.price > wallet.amountDeposited){
            res.render('deposit/add', { amountNeededBid: req.body.price })
          }
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
          include: [{
            model: models.User,
          }],
        }).then((workOrder) => {
          var workOrderCreated = false;
          var CustomerReviewPending = false;
          var DeveloperMadeReview = false;
          var CustomerMadeReview = false;
          var winningDev = false;
          var complete = false;
          var closed = false;
          var expired = false;
          var winnersName ="";
          if (workOrder.length > 0){
            workOrderCreated = true;
            CustomerReviewPending = workOrder[0].CustomerReviewPending;
            closed = workOrder[0].closed;
            complete = workOrder[0].complete;
            DeveloperMadeReview = workOrder[0].DeveloperMadeReview;
            CustomerMadeReview = workOrder[0].CustomerMadeReview;
            if(req.user){
              if(workOrder[0].userId == req.user.id)
                winningDev = true;
              winnersName = workOrder[0].user.username;
            }
          }
            var date = new Date();
            if( date > post.bidingDeadline)
              expired = true;
          (post ? res.render('posts/single', { post,winnersName , user: post.user, currentBid: (bid.price) ? bid.price : "No Bids yet",CustomerMadeReview,expired,winningDev,DeveloperMadeReview, CustomerReviewPending,complete, workOrderCreated, closed }) : res.redirect('/posts'));
        });
      }).catch({
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
        include: [{
        model: models.User,
        }],
      }).then((bids) => {
        (post ? res.render('posts/review', { post, user: post.user, bids: (bids) ? bids : "No Bids" }) : res.redirect('/posts'));
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
            var noCash;
            if (req.params.error =="NoMoney")
              noCash= "Not Enough Money";
            (post ? res.render('posts/review/winner', { post, user: post.user, winningUser, winnersBid, isCheapestBid, noCash}) : res.redirect('/posts'));
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
    }).then((post) => {
      var completionDeadline = post.completionDeadline.toISOString().substring(0, 16);
      var bidingDeadline = post.bidingDeadline.toISOString().substring(0, 16);
      (post ? res.render('posts/edit', { post, completionDeadline, bidingDeadline }) : res.redirect('/posts'))
    });
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
