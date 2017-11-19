const models = require('../models');
const redirect = {};

redirect.ifLoggedIn = (route) =>
  (req, res, next) => (req.user ? res.redirect(route) : next());

redirect.ifNotLoggedIn = (route = '/login') =>
  (req, res, next) => (req.user ? next() : res.redirect(route));

redirect.ifNoSetUp = (route = '/set-up') => 
  (req, res, next) => {
    req.user.getProfile().then((profile) =>{
      if(profile == null)
        res.redirect(route);
      else
        next();
    })
  };

redirect.ifSetUpComplete = (route = '/profile') =>
    (req, res, next) => {
    req.user.getProfile().then((profile) =>{
      if(profile == null)
        next();
      else
        res.redirect(route);
    })
  };

redirect.ifNotApproved = (route = '/approval-status') =>
  (req, res, next) => (req.user.accountStatus == "Approved" ? next() : res.redirect(route));

redirect.ifApproved = (route = '/profile') =>
  (req, res, next) => (req.user.accountStatus == "Approved" ? res.redirect(route) : next());

redirect.ifNotAuthorized = (route) =>
  (req, res, next) => (req.user.username !== req.params.username ? res.redirect(route) : next());

redirect.ifNotCustomer = (route = '/profile') =>
  (req, res, next) => (req.user.accountType == "Customer" ? next() : res.redirect(route));

redirect.ifNotDeveloper = (route = '/profile') =>
  (req, res, next) => (req.user.accountType == "Developer" ? next() : res.redirect(route));

redirect.ifNotAdmin = (route = '/profile') =>
  (req, res, next) => (req.user.admin ?  next() :res.redirect(route) );

redirect.ifBidOver = ( route = '/posts') =>
  (req, res, next) => (
    models.Post.findOne({
      where:{
        slug:req.params.slug,
      },
    }).then((post)=>{
      ((new Date(post.bidingDeadline).getTime() < new Date().getTime()) ? res.redirect(route) : next());
    })
  );
module.exports = redirect;
