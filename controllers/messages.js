const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');
const Op = models.Sequelize.Op;


module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', Redirect.ifNotLoggedIn(), Redirect.ifNoWalletCreated(), this.index);

    router.post('/new/msg/:username', Redirect.ifNotLoggedIn(), Redirect.ifNoWalletCreated(),  this.createMsg);
    router.get('/view/:username', Redirect.ifNotLoggedIn(), Redirect.ifNoWalletCreated(), this.show);
    router.get('/check/:connectionId/:myId', Redirect.ifNotLoggedIn(), Redirect.ifNoWalletCreated(),  this.check);

    return router;
  },

  check(req, res){
    models.Message.findAll({
      where:{
        connectionId: req.params.connectionId,
        seen:false,
      },
      include:[{
        model: models.User, as: 'sender',
        where:{
          id:{
            [Op.ne]: req.params.myId,
          }
        },
      }],
    }).then((messages)=>{
      if(messages.length > 0)
        res.send("new msg");
      else
        res.send("")
    });

  },

  index(req, res) {
    if(req.user.accountType == "Admin"){
      models.Connection.findAll({
        where:{
          adminId: req.user.id,
        },
      }).then((connectionsAdmin)=>{
        res.render('message/allConnections', {connectionsAdmin});
      });
    }
    else if(req.user.accountType == "Developer"){
      models.Connection.findAll({
        where:{
          developerId: req.user.id,
        },
      }).then((connectionsDeveloper)=>{
        res.render('message/allConnections', {connectionsDeveloper});
      });
    }
    else{
      models.Connection.findAll({
        where:{
          customerId: req.user.id,
        },
      }).then((connectionsCustomer)=>{
        res.render('message/allConnections', {connectionsCustomer});
      });
    }
  },

  show(req,res){
    models.User.findOne({
      where:{
        username: req.params.username,
      },
    }).then((user)=>{
      if(user){
        if (user.accountType == "Customer"){
          if(req.user.accountType == "Admin"){
            models.Connection.findOne({
              where:{
                adminId: req.user.id,
                customerId: user.id,
              },
            }).then((connection)=>{
              models.Message.findAll({
                where:{
                  connectionId: connection.id,
                },
                include:[{
                  model: models.User, as: 'sender',
                }],
                order: ['createdAt'],
              }).then((messages)=>{
                for(var i  = 0; i < messages.length; i++){
                  models.Message.update({
                    seen: true,
                  },
                  {
                    where: {
                      id:messages[i].id,
                      senderId:{
                        [Op.ne]: req.user.id,
                      }
                    },
                    returning: true,
                  }).then(()=>{
                  });
                }
                res.render('message/oneConnection', {messages,connectionId:connection.id, otherUser: user.username});
              });
            });
          }
          else if(req.user.accountType == "Developer"){
            models.Connection.findOne({
              where:{
                developerId: req.user.id,
                customerId: user.id,
              },
            }).then((connection)=>{
              models.Message.findAll({
                where:{
                  connectionId: connection.id,
                },
                include:[{
                  model: models.User, as: 'sender',
                }],
                order: ['createdAt'],
              }).then((messages)=>{
                for(var i  = 0; i < messages.length; i++){
                  models.Message.update({
                    seen: true,
                  },
                  {
                    where: {
                      id:messages[i].id,
                      senderId:{
                        [Op.ne]: req.user.id,
                      }
                    },
                    returning: true,
                  }).then(()=>{
                  });
                }
                res.render('message/oneConnection', {messages,connectionId:connection.id, otherUser: user.username});
              });
            });
          }
        }
        else if (user.accountType == "Developer"){
          if(req.user.accountType == "Admin"){
            models.Connection.findOne({
              where:{
                adminId: req.user.id,
                developerId: user.id,
              },
            }).then((connection)=>{
              models.Message.findAll({
                where:{
                  connectionId: connection.id,
                },
                include:[{
                  model: models.User, as: 'sender',
                }],
                order: ['createdAt'],
              }).then((messages)=>{
                for(var i  = 0; i < messages.length; i++){
                  models.Message.update({
                    seen: true,
                  },
                  {
                    where: {
                      id:messages[i].id,
                      senderId:{
                        [Op.ne]: req.user.id,
                      }
                    },
                    returning: true,
                  }).then(()=>{
                  });
                }
                res.render('message/oneConnection', {messages,connectionId:connection.id, otherUser: user.username});
              });
            });
          }
          else if(req.user.accountType == "Customer"){
            models.Connection.findOne({
              where:{
                customerId: req.user.id,
                developerId: user.id,
              },
            }).then((connection)=>{
              models.Message.findAll({
                where:{
                  connectionId: connection.id,
                },
                include:[{
                  model: models.User, as: 'sender',
                }],
                order: ['createdAt'],
              }).then((messages)=>{
                for(var i  = 0; i < messages.length; i++){
                  models.Message.update({
                    seen: true,
                  },
                  {
                    where: {
                      id:messages[i].id,
                      senderId:{
                        [Op.ne]: req.user.id,
                      }
                    },
                    returning: true,
                  }).then(()=>{
                  });
                }
                res.render('message/oneConnection', {messages,connectionId:connection.id, otherUser: user.username});
              });
            });
          }
        }
        else if (user.accountType == "Admin"){
          if(req.user.accountType == "Developer"){
            models.Connection.findOne({
              where:{
                adminId: user.id,
                developerId: req.user.id,
              },
            }).then((connection)=>{
              models.Message.findAll({
                where:{
                  connectionId: connection.id,
                },
                include:[{
                  model: models.User, as: 'sender',
                }],
                order: ['createdAt'],
              }).then((messages)=>{
                for(var i  = 0; i < messages.length; i++){
                  models.Message.update({
                    seen: true,
                  },
                  {
                    where: {
                      id:messages[i].id,
                      senderId:{
                        [Op.ne]: req.user.id,
                      }
                    },
                    returning: true,
                  }).then(()=>{
                  });
                }
                res.render('message/oneConnection', {messages,connectionId:connection.id, otherUser: user.username});
              });
            });
          }
          else if(req.user.accountType == "Customer"){
            models.Connection.findOne({
              where:{
                customerId: req.user.id,
                adminId: user.id,
              },
            }).then((connection)=>{
              models.Message.findAll({
                where:{
                  connectionId: connection.id,
                },
                include:[{
                  model: models.User, as: 'sender',
                }],
                order: ['createdAt'],
              }).then((messages)=>{
                for(var i  = 0; i < messages.length; i++){
                  models.Message.update({
                    seen: true,
                  },
                  {
                    where: {
                      id:messages[i].id,
                      senderId:{
                        [Op.ne]: req.user.id,
                      }
                    },
                    returning: true,
                  }).then(()=>{
                  });
                }
                res.render('message/oneConnection', {messages,connectionId:connection.id, otherUser: user.username});
              });
            });
          }
        }
      }

    }).catch({
    })
  },

  createMsg(req,res){
    models.Message.create({
      body: req.body.body,
      connectionId: req.body.connectionId,
      senderId:req.user.id,
      seen: false,
    }).then((message)=>{
      models.Connection.findOne({
        where:{
          id:req.body.connectionId,
        },
      }).then((connection)=>{
        var otherUser;
        if(req.user.accountType=="Admin"){
          if(connection.customerUsername == null)
            otherUser = connection.developerUsername;
          else
            otherUser = connection.customerUsername;
        }
        else if(req.user.accountType=="Developer"){
          if(connection.adminUsername == null)
            otherUser = connection.customerUsername;
          else
            otherUser = connection.adminUsername;
        }
        else if(req.user.accountType=="Customer"){
          if(connection.adminUsername == null)
            otherUser = connection.developerUsername;
          else
            otherUser = connection.adminUsername;
        }
        res.redirect('/messages/view/'+otherUser);
      });
    })
  },
};
