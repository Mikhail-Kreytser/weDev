const express = require('express');
const Redirect = require('../middlewares/redirect');
const multer = require('multer');

const upload = multer({
  dest: './public/profile_img/',
});

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifSetUpComplete(), this.index);
    router.post('/', upload.single('profileImage'), this.create);
    return router;
  },
  index(req, res) {
    res.render('set-up');
  },
  create(req, res) {
    req.user.createProfile({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bio: (req.body.bio) ? req.body.bio : 'customer',
      profileImage: (req.file) ? req.file.filename : 'default',
      companyInfo: (req.body.companyInfo) ? req.body.companyInfo : 'developer',
      companyWebsite: (req.body.companyWebsite) ? req.body.companyWebsite : 'http://developer.com',
      rating: 3.5,
    }).then((user) => {
        res.redirect('/profile');
    }).catch(() => {
      res.render('set-up',{ error: true});
    });
  },
};
