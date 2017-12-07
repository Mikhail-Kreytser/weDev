const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/email/:email', this.indexEmail);
    router.get('/username/:username', this.indexUsername);
    router.get('/get/systemMessage', this.getSystemMessage);
    router.get('/seen/systemMessage/:id', this.seenSystemMessage);
    return router; 
  },
  indexEmail(req, res) {
    models.User.findAndCountAll({
      where:{
        email : req.params.email,
      },
    }).then((username) => {
      if(username.count == 0)
        res.send('free');
      else
        res.send('taken');

    });
  },
  
  indexUsername(req, res) {
    models.User.findAndCountAll({
      where:{
        username : req.params.username,
      },
    }).then((username) => {
      if(username.count == 0)
        res.send('free');
      else
        res.send('taken');
    });
  },

  getSystemMessage(req, res) {
    models.SystemMessage.findAndCountAll({
      where:{
        userId : req.user.id,
        seen: false,
      },
    }).then((systemMessage) => {
      if(systemMessage.count == 0)
        res.send(null);
      else
        res.send(systemMessage.rows);
    });
  },
  seenSystemMessage(req,res){
    models.SystemMessage.update({
      seen: true,
    },
    {
      where: {
        id:req.params.id,
      },
      include:[{
        model: models.User,
      }],
      returning: true,
    }).then(()=>{
      res.sendStatus(200);
    }).catch(()=>{
      res.sendStatus(404);
    });
  },
};
