const redirect = {};

redirect.ifLoggedIn = (route) =>
  (req, res, next) => (req.user ? res.redirect(route) : next());

redirect.ifNotLoggedInNoSetUp = (route = '/login') =>
  (req, res, next) => (req.user ? (req.user.profileId ? next() : res.redirect('/set-up')) : res.redirect(route));

redirect.ifSetUpComplete = (route = '/profile') =>
  (req, res, next) => (req.user.profileId ? res.redirect(route) : next() );

redirect.ifNotLoggedIn = (route = '/login') =>
  (req, res, next) => (req.user ? next() : res.redirect(route));

redirect.ifNotAuthorized = (route) =>
  (req, res, next) => (req.user.username !== req.params.username ? res.redirect(route) : next());

redirect.ifNotAdmin = (route = '/profile') =>
  (req, res, next) => (req.user ? (req.user.accountType !== "Admin" ? res.redirect(route) : next()) : res.redirect(route));

module.exports = redirect;
