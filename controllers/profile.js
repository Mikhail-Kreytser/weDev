const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotLoggedIn(), Redirect.ifNotCustomer('/profile/d/'),Redirect.ifNotDeveloper('/profile/c/'),this.index);
    router.get('/c/', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifNoSetUp(),
                      Redirect.ifNotCustomer('/profile/d/'), this.indexCustomer);
    router.get('/d/', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifNoSetUp(),
                      Redirect.ifNotDeveloper(), this.indexDeveloper);

    return router;
  },

  index(req,res){

  },

  indexCustomer(req, res) {
    models.Post.findAll({
      where:{
        userId:req.user.id,
      },
      include: [{
        model: models.Bid,
        where:{
          attributes:[
          [models.sequelize.fn('min', models.sequelize.col('price')),'price'],
        ]
        },
        /*

        order: [ [ 'price', 'DESC' ]],
        limit: 1,
        
        
        */
      }]
    }).then((allPosts) => {
       req.user.getProfile()
       .then((profile) =>{
        console.log(allPosts);
      res.render('profile/customer', { user: req.user, profile: profile, allPosts: allPosts,  success: req.flash('success') });
    });
     });
  },

    indexDeveloper(req, res) {
    models.Post.findAll({
      group: ['post.id'],
      /*
      include: [{
        model: models.Bid,
        where: {
          userId: req.user.id,
        },
        attributes:[
          [models.sequelize.fn('min', models.sequelize.col('price')),'price'],
        ]
      }],*/
    }).then((allPosts) => {
       req.user.getProfile()
       .then((profile) =>{
        console.log(allPosts);
      res.render('profile/developer', { user: req.user, profile: profile, allPosts: allPosts,  success: req.flash('success') });
    });
     });
  },

};

/*module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/c/', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifNoSetUp(), 
                      Redirect.ifNotCustomer('/profile/d/'), this.indexCustomer);
    router.get('/d/', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifNoSetUp(),
                      Redirect.ifNotDeveloper('profile/c/'), this.indexDeveloper);
  },

  indexCustomer(req, res) {
    models.Post.findAll({
      where:{
        userId:req.user.id,
      },
            include: [{
        model: models.Bid,
        where:{
          attributes:[
          [models.sequelize.fn('min', models.sequelize.col('price')),'price'],
          ],
        },
        }]

    }).then((allPosts) => {
      res.render('profile', { user: req.user, profile: req.user.getProfile(), success: req.flash('success') });
    });
  },

  indexDeveloper(req, res){
    res.render('profile');
  },
};*/