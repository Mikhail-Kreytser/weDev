const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');
const multer = require('multer');

const upload = multer({
  dest: './public/profile_img/',
});


module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/show',     Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifNoSetUp(), this.index);
    router.get('/edit', Redirect.ifNotLoggedIn(), this.edit);
    router.post('/edit', upload.single('profileImage'), Redirect.ifNotLoggedIn(), this.update);
    router.get('/show/:username',  this.show);

    return router;
  },
  index(req, res) {
    req.user.getProfile()
    .then((profile) => {
      var rating = profile.rating;
      if(profile.rating == 0)
        rating = "No reviews"
      var isCustomer = false;
      var isDeveloper = false;
        if (req.user.accountType == "Developer")
          var isDeveloper = true;
        else
          var isCustomer = true;
          res.render('profile', {user: req.user,isDeveloper,isCustomer, profile: profile, owner: true, rating:rating});
    });
  },

  edit(req, res) {
    req.user.getProfile()
    .then((profile) =>{
      var isCustomer = false;
      var isDeveloper = false;
        if (req.user.accountType == "Developer")
          var isDeveloper = true;
        else
          var isCustomer = true;
      profile ? res.render('profile/edit', {user: req.user,isDeveloper,isCustomer, profile }) : res.redirect('/profile/show');
    });
  },

  update(req, res) {

     console.log(req.body.firstName);
     console.log(req.body.lastName);
      console.log(req.body.bio);
      console.log((req.body.companyWebsite) ? req.body.companyWebsite : thisUser.profile.companyWebsite);
      console.log(req.body.companyInfo);
      console.log(req.body.rating);
      console.log("Pending");
    models.User.findOne({
      where:{
        id: req.user.id,
      },
      include:[{
        model:models.Profile,
      }],
    }).then((thisUser) =>{
      models.Profile.update({
        bio: (req.body.bio) ? req.body.bio : thisUser.profile.bio,
        profileImage: (req.file) ? req.file.filename : thisUser.profile.profileImage,
        companyInfo: (req.body.companyInfo) ? req.body.companyInfo : thisUser.profile.companyInfo,
        companyWebsite: (req.body.companyWebsite) ? req.body.companyWebsite : thisUser.profile.companyWebsite,
      },
      {
        where: {
          userId: thisUser.id,
        },
        returning: true,
      }).then(([numRows, rows]) => {
        const post = rows[0];
        res.redirect('/profile/show');
      });
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
        var isCustomer = false;
        var isDeveloper = false;
        if (user.accountType == "Developer")
          var isDeveloper = true;
        else
          var isCustomer = true;

        res.render('profile', {username: user.username,isCustomer,isDeveloper, accountType: user.accountType, profile: user.profile, rating:rating});
      } 
    }).catch(() =>{
      res.redirect('/login');
    });
  },
};
