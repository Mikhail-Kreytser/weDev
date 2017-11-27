const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');
const getSlug = require('speakingurl');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/',     Redirect.ifNotLoggedIn(), this.index);
    router.get('/new-post',  Redirect.ifNotLoggedIn(), Redirect.ifNotCustomer('/posts'), this.newPost);
    router.post('/new-post',    Redirect.ifNotLoggedIn(), Redirect.ifNotCustomer('/posts'), this.createPost);
    router.get('/:username/:slug', this.showPost);
    router.get('/:username/:slug/edit', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.edit);
    router.put('/:username/:slug',      Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.update);
    router.delete('/:username/:slug',   Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.delete);
    router.get('/:username/:slug/new-bid',  Redirect.ifNotLoggedIn(), Redirect.ifNotDeveloper('/posts'),
                                            Redirect.ifBidOver('/posts/'), this.newBid);
    router.post('/new-bid', Redirect.ifNotLoggedIn(), Redirect.ifNotDeveloper('/posts'), this.createBid);


    return router;
  },
  index(req, res) {
    models.Post.findAll({
      include: [{model: models.User}]
    }).then((allPosts) => {

      console.log(allPosts);
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
      res.redirect(`/posts/${req.user.username}/${post.slug}`);
    }).catch(() => {
      res.render('posts/new-post');
    });
  },

  createBid(req, res) {
    models.Post.findOne({
      where:{
        slug:req.body.slug,
      },
    }).then((post)=>{
      req.user.createBid({
        price: req.body.price,
        postId: post.id,
      }).then((bid) => {
        res.redirect(`/posts/${req.body.username}/${req.body.slug}`);
      });
    }).catch(() => {
        res.render(`/posts/${req.body.username}/${req.body.slug}/new-bid`);
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
      console.log(req.params.slug);
      models.Bid.findOne({
        where:{
          postId: post.id,
        },
        attributes:[
          [models.sequelize.fn('min', models.sequelize.col('price')),'price'],
        ],
      }).then((bid) => {
        (post ? res.render('posts/single', { post, user: post.user, currentBid: (bid.price) ? bid.price : "No Bids yet" }) : res.redirect('/posts'))
      })
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
      res.redirect(`/posts/${req.user.username}/${post.slug}`);
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
