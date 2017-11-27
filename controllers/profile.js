const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifNoSetUp(), this.index);
    router.put('/', Redirect.ifNotLoggedIn(), Redirect.ifNotAuthorized(), this.update);
    router.get('/:username',  this.show);

    return router;
  },
  index(req, res) {req.user.getProfile()
    .then((p) => {
      res.render('profile', { user: req.user, profile: p, success: req.flash('success') });
    });
  },

  update(req, res) {
    models.profile.update(
    {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bio: req.body.bio,
      profileImage: (req.file) ? req.file.filename : 'default',
    },
    {
      where: {
        userId: req.user.id,
      },
/*      include: [{
        model: models.User,
        where: {
          username: req.params.username,
        },
      }],
*/
      returning: true,
    }).then(([numRows, rows]) => {
      const post = rows[0];
      res.redirect('/profile');
    });
  },

  show(req,res){

  },
};
