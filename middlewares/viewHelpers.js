const models = require('../models');
const helpers = {};

helpers.register = () => {
  return (req, res, next) => {
    res.locals.cur_user = req.user;
    res.locals.customer = false;
    res.locals.developer = false;
    res.locals.admin = false;
    res.locals.owner = false;
    res.locals.numOfPendingUsers = 0;
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
                        res.locals.numOfPendingUsers = allPendingUsers;
                });
            }
            if(req.url.indexOf(req.user.username) > -1)
                    res.locals.owner = true;
        };
	};
    next();
  }
};

module.exports = helpers;

