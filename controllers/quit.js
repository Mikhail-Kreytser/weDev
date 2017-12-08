const express = require('express');
const Redirect = require('../middlewares/redirect');
const models = require('../models');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), this.index);
    router.get('/request',Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), this.postReq);
    return router; 
  },
  index(req, res) {
    res.render('quit');
  },
  postReq(req, res) {
    models.QuitReq.create({
      userId:req.user.id,
      approved: false,
      requested: true,
    }).then(() =>{
      models.SystemMessage.create({
        userId: req.user.id,
          comment: "Quit request submitted, Please wait for approval.",
          seen: false, 
      }).then((systemMessage) => {
        res.redirect('/');
      });
    }); 
    /*
    models.Users.destroy({
      where: {
        id: req.user.id,
      },
      include: [{
        model: models.Profile,
      }],
    }).then(() => {
      res.redirect('/posts');
    });*/
  },
};
