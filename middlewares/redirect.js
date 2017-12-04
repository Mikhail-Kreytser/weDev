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

redirect.ifNoWalletCreated = (route = '/deposit') =>
  (req, res, next) => {
    req.user.getWallet().then((wallet) =>{
      if(wallet == null)
        (req.user.accountStatus == "Approved" ? res.redirect(route) : req.user.accountStatus == "Pending" ? res.redirect(route) : next());
      else
        next();
    })
  };

redirect.ifWalletCreated = (route = '/approval-status') =>
  (req, res, next) => {
    req.user.getWallet().then((wallet) =>{
      if(wallet == null)
        next();
      else
        res.redirect(route);
    })
  };

redirect.ifBlocked = (route = '/approval-status') =>
  (req, res, next) => (req.user.accountStatus == "Approved" ? next() : req.user.accountStatus == "Pending" ? next() : res.redirect(route));

redirect.ifNotApproved = (route = '/approval-status') =>
  (req, res, next) => (req.user.accountStatus == "Approved" ? next() : res.redirect(route));

redirect.ifApproved = (route = '/profile') =>
  (req, res, next) => (req.user.accountStatus == "Approved" ? res.redirect(route) : next());

redirect.ifNotAuthorized = (route) =>
  (req, res, next) => (req.user.username !== req.params.username ? (req.user.username !== req.params.winnersName ? res.redirect(route) : next()) : next());

redirect.ifNotCustomer = (route = '/profile') =>
  (req, res, next) => (req.user.accountType == "Customer" ? next() : res.redirect(route));

redirect.ifNotDeveloper = (route = '/profile') =>
  (req, res, next) => (req.user.accountType == "Developer" ? next() : res.redirect(route));

redirect.ifNotAdmin = (route = '/profile') =>
  (req, res, next) => (req.user.accountType == "Admin" ?  next() :res.redirect(route) );

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
