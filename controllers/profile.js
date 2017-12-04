const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/',     Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifNoSetUp(), this.index);
    router.get('/edit', Redirect.ifNotLoggedIn(), this.edit);
    router.put('/edit', Redirect.ifNotLoggedIn(), this.update);
    router.get('/:username',  this.show);

    return router;
  },
  index(req, res) {
    req.user.getProfile()
    .then((profile) => {
      var rating = profile.rating;
      if(profile.rating == 0)
        rating = "No reviews"

          res.render('profile', {user: req.user, profile: profile, owner: true, rating:rating});
    });
  },

  edit(req, res) {
    req.user.getProfile()
    .then((profile) =>
      (profile ? res.render('profile/edit', {user: req.user, profile }) : res.redirect('/profile'))
    );
  },

  update(req, res) {
    console.log(req.body.firstName);  
    models.Profile.update(
    {
      bio: (req.body.bio) ? req.body.bio : 'customer',
      profileImage: (req.file == undefined) ?  req.body.oldImage : req.file.filename,
      companyInfo: (req.body.companyInfo) ? req.body.companyInfo : 'developer',
      companyWebsite: (req.body.companyWebsite) ? req.body.companyWebsite : 'http://developer.com',
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
    models.User.findOne({
      where: {
        username: req.params.username,
      },
      include: [{
        model: models.Profile,
      }],
    }).then((user) =>{
      if (user.accountType == "Admin" || user.accountStatus != "Approved")
        res.redirect('/');
      else{
        var rating = user.profile.rating;
        if(rating == 0)
          rating = "No reviews";
        res.render('profile', {username: user.username, accountType: user.accountType, profile: user.profile, rating:rating});
      } 
    }).catch(() =>{
      res.redirect('/login');
    });
  },
};
