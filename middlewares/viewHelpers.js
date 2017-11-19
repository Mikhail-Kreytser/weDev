const helpers = {};

helpers.register = () => {
  return (req, res, next) => {
    res.locals.cur_user = req.user;
    res.locals.customer = false;
    res.locals.developer = false;
    res.locals.admin = false;
    if (req.user){
    	if(req.user.accountType == "Customer")
    		res.locals.customer = true;
    	if(req.user.accountType == "Developer")
    		res.locals.developer = true;
    	if(req.user.accountType == "Admin")
    		res.locals.admin = true;
	}
    next();
  }
};

module.exports = helpers;
