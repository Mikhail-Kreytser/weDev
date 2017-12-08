const models = require('../models');
const helpers = {};

helpers.register = () => {
  return (req, res, next) => {
    res.locals.cur_user = req.user;
    res.locals.customer = false;
    res.locals.developer = false;
    res.locals.admin = false;
    res.locals.owner = false;
    res.locals.notify = 0;
    res.locals.quitReq = 0;
    res.locals.numOfPendingUsers = 0;
    res.locals.numOfAttentionWorkOrders = 0;
    res.locals.unConfirmedWorkOrder = 0;
    res.locals.badReviewdWorkOrders = 0;

    if (req.user){
        if(req.user.accountStatus == "Approved"){
        	if(req.user.accountType == "Customer")
        		res.locals.customer = true;
        	if(req.user.accountType == "Developer")
        		res.locals.developer = true;
        	if(req.user.accountType == "Admin"){
        		res.locals.admin = true;
                models.User.count({
                    where: {
                    accountStatus: "Pending",
                    },
                }).then((allPendingUsers) => {
                    models.WorkOrder.count({
                    where:{
                      closed: false,
                      CustomerMadeReview: true,
                    },
                    }).then((badReviewdWorkOrder) => {
                        models.WorkOrder.count({
                            where:{
                            confirmed: false,
                            },
                        }).then((unConfirmedWorkOrder) => {
                        models.User.count({
                            where: {
                              accountStatus: "Approved",
                            },
                            include: [{
                              model: models.QuitReq,
                              where:{
                                approved: false,
                                requested: true,
                              }
                            }],
                          }).then((needsApprovedQuit)=>{ 
                            res.locals.badReviewdWorkOrders = badReviewdWorkOrder;
                            res.locals.unConfirmedWorkOrder = unConfirmedWorkOrder
                            res.locals.numOfPendingUsers = allPendingUsers;
                            res.locals.quitReq = needsApprovedQuit;
                            res.locals.numOfAttentionWorkOrders = res.locals.badReviewdWorkOrders +res.locals.unConfirmedWorkOrder;
                            res.locals.notify = res.locals.numOfAttentionWorkOrders + res.locals.numOfPendingUsers + res.locals.quitReq ;
                        });
                      });
                    });
                });
            }
            if(req.url.indexOf(req.user.username) > -1)
                res.locals.owner = true;
        }
	} 
    next();
  }
};

module.exports = helpers;

