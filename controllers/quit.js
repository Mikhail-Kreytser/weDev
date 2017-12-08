const express = require('express');
const Redirect = require('../middlewares/redirect');
const models = require('../models');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), this.index);
    router.get('/delete/:who', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifNotAdmin(), this.delete);
    router.get('/get/:who', Redirect.ifNotLoggedIn(), Redirect.ifNotApproved(), Redirect.ifNotAdmin(), this.get);
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
  },


  get(req, res) {
    models.User.findOne({
      where: {
        id: req.params.who,
      },
    }).then((user) => {
      if(user) {
        res.render('tools/users/single', { user: user, delete: true });
      } else {
        res.redirect('/tools');
      }
    }).catch(() => {
      res.redirect('/profile/show');
    });
  },

  delete(req, res){
    models.User.findOne({
      where: {
        id: req.params.who,
      },
    }).then((theUser) => {
      theUser.destroy({
        include: [{
          model: models.Profile,
        }],
      }).then(() => {
        res.redirect('/tools');
      });
    });
  },
};
