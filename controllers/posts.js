const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');
const getSlug = require('speakingurl');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/',     Redirect.ifNotLoggedIn(), this.index);
    router.get('/new',  Redirect.ifNotLoggedIn(), Redirect.ifNotCustomer('/posts'), this.new);
    router.post('/',    Redirect.ifNotLoggedIn(), Redirect.ifNotCustomer('/posts'), this.create);
    router.get('/:username/:slug', this.show);
    router.get('/:username/:slug/edit', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.edit);
    router.put('/:username/:slug',      Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.update);
    router.delete('/:username/:slug',   Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.delete);

    return router;
  },
  index(req, res) {
    models.Post.findAll({
      include: [{model: models.User}]
    }).then((allPosts) => {
      res.render('posts', { allPosts });
    });
  },
  new(req, res) {
    res.render('posts/new');
  },
  create(req, res) {
    req.user.createPost({
      slug: getSlug(req.body.title.toLowerCase()),
      title: req.body.title.toLowerCase(),
      body: req.body.body,
      completionDeadline: req.body.completionDeadline,
      bidingDeadline: req.body.bidingDeadline,
    }).then((post) => {
      res.redirect(`/posts/${req.user.username}/${post.slug}`);
    }).catch(() => {
      res.render('posts/new');
    });
  },
  show(req, res) {
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
      (post ? res.render('posts/single', { post, user: post.user }) : res.redirect('/posts'))
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
