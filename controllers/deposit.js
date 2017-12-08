const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get ('/initial', Redirect.ifNotLoggedIn(), Redirect.ifBlocked(), Redirect.ifWalletCreated(), this.index);
    router.post('/initial', Redirect.ifNotLoggedIn(), Redirect.ifBlocked(), Redirect.ifWalletCreated(), this.create);

    router.get ('/add', Redirect.ifNotLoggedIn(), Redirect.ifBlocked(), Redirect.ifNoWalletCreated(), this.show);
    router.post ('/add', Redirect.ifNotLoggedIn(), Redirect.ifBlocked(), Redirect.ifNoWalletCreated(), this.update);

    return router;
  },

  index(req, res) {
    res.render('deposit/initial');
  },

  create(req, res) {
    req.user.createWallet({
      amountDeposited: req.body.amountDeposited,
      creditCardNumber: req.body.creditCardNumber,
      expirationDate: req.body.expirationDate,
      cvv: req.body.cvv,
      zipCode: req.body.zipCode,
    }).then((wallet) => {
        res.redirect('/approval-status');
    }).catch(() => {
      res.render('deposit/initial',{ error: true});
    });
  },

  show(req, res) {
    req.user.getWallet()
    .then((wallet) => {
      res.render('deposit/add',{balance: wallet.amountDeposited});
    });
  },

  update(req, res) {
    req.user.getWallet().then((wallet) => {
      models.Wallet.update({
        amountDeposited: parseFloat(wallet.amountDeposited) + (req.body.amountDeposited * 1.0),
        creditCardNumber: req.body.creditCardNumber,
        expirationDate: req.body.expirationDate,
        cvv: req.body.cvv,
        zipCode: req.body.zipCode,
        },
        {
          where: {
            userId: req.user.id,
          },
          returning: true,
        }).then(() => {
            res.redirect('/');
      });
    });
  },
};
