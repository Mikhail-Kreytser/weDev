const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get ('/',    Redirect.ifNotLoggedIn(), Redirect.ifBlocked(), Redirect.ifWalletCreated(), this.index);
    router.post('/',    Redirect.ifNotLoggedIn(), Redirect.ifBlocked(), Redirect.ifWalletCreated(), this.create);
    router.get ('/add', Redirect.ifNotLoggedIn(), Redirect.ifBlocked(), Redirect.ifNoWalletCreated(), this.show);
    router.put ('/add', Redirect.ifNotLoggedIn(), Redirect.ifBlocked(), Redirect.ifNoWalletCreated(), 
                                                                        Redirect.ifNotAuthorized(), this.update);

    return router;
  },

  index(req, res) {
    res.render('deposit/initial');
  },

  create(req, res) {
    req.user.createWallet({
      amountDeposited: req.body.amountDeposited,
    }).then((wallet) => {
        res.redirect('/approval-status');
    }).catch(() => {
      res.render('deposit',{ error: true});
    });
  },

  show(req, res) {
    req.user.getWallet()
    .then((wallet) => {
      res.render('deposit/add',{balance: wallet.amountDeposited});
    });
  },

  update(req, res) {
//    req.user.getWallet()
 //   .then((wallet) => {

                        console.log("HERE");
   /*   console.log(req.body.amountDeposited);
      models.wallet.update({
        amountDeposited: req.body.amountDeposited,//wallet.amountDeposited + 
        },
        {
          where: {
            userId: req.user.id,
          },
          returning: true,
        }).then(([numRows, rows]) => {
            const post = rows[0];
            res.redirect('/');
      });*/
 //   });
 
 res.redirect('/profile')
  },
};
