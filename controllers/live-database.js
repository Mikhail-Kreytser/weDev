const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');
const Op = models.Sequelize.Op;


module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get ('/', this.index);

    return router;
  },

  index(req, res) {
  	models.Post.findAll({
  		where:{
  			bidingDeadline: {
  			    [Op.lte]: new Date(),
  			},
  		},
  		include :[{
  			model: models.Bid,
  		}]
  	}).then((posts) => {
  		var totalPosts = posts.length;
  		for( i =0; i < totalPosts; i++){
  			if(posts[i].bids.length < 1){
  				var slugP = posts[i].slug;
  				var titleP = posts[i].title;
  				var userIdP = posts[i].userId

  				models.User.findOne({
			        where:{
			          id:posts[i].userId,
			        },
			        include:[{
			          model: models.Wallet,
			        }], 
			    }).then((customer) => {
			    	models.User.findOne({
			        	where:{
			          		accountType: "Admin",
			        	},
			        	include:[{
			          		model: models.Wallet,
			        	}],
			    	}).then((admin) => {
			    		models.Wallet.update({
		                    amountDeposited: (customer.wallet.amountDeposited - 10),
		                },
		                {
		                	where: {
		                    	userId: customer.id,
		                    },
		                    returning: true,
		                }).then(() => {
		                    models.Wallet.update({
		                      	amountDeposited: (admin.wallet.amountDeposited + 10),
		                    },
		                    {
		                    	where: {
		                      		userId: admin.id,
		                    	},
		                    	returning: true,
		                  	}).then(() => {
							    models.Post.destroy({
							      where: {
							        slug: slugP,
							      },
							      include: [{
							        model: models.User,
							        where: {
							          id: userIdP,
							        },
							      }],
							    }).then(() => {
							    	models.SystemMessage.create({
							    		userId: customer.id,
								      	comment: "There were no bid on the post: " + titleP +". The bidding deadline has expired. You have been charged $10.",
								      	seen: false, 
								    }).then((systemMessage) => {

								    });
							    });
							});
                  		});
              		});
			    });
  			}
  		}
    });
    models.Post.findAll({
  		where:{
  			bidingDeadline: {
  			    [Op.lte]: new Date(),
  			},
  			completionDeadline: {
  			    [Op.lte]: new Date(),
  			},
  			closed: false,
  		},
  		include :[{
  			model: models.WorkOrder,
  			where:{
  				complete: false,
  			},
  		}],
  	}).then((posts) => {
  		var totalPosts = posts.length;
  		for( i =0; i < totalPosts; i++){
            var userIdWO 	= posts[i].workOrder.userId;
            var priceWO 	= posts[i].workOrder.price;
            var idWO 		= posts[i].workOrder.id;
  			var slugP = posts[i].slug;
  			var titleP = posts[i].title;
  			var userIdP = posts[i].userId;

  			models.User.findOne({
			    where:{
			        id:posts[i].userId,
			    },
			    include:[{
			        model: models.Wallet,
			    }],
			}).then((customer) => {
				models.User.findOne({
				    where:{
				        id:userIdWO,
				    },
				    include:[{
				        model: models.Wallet,
				    }],
				}).then((developer) => {
					var penalty = 50;
					var half = priceWO/2;
					half += penalty;
	                models.Wallet.update({
	                    amountDeposited: (customer.wallet.amountDeposited + half),
	                },
	                {
	                	where: {
	                    	userId: customer.id,
	                    },
	                    returning: true,
	                }).then(() => {
	                    models.Wallet.update({
	                    	amountDeposited: (developer.wallet.amountDeposited - half),
	                    },
	                    {
	                    	where: {
	                      		userId: developer.id,
	                    	},
	                    	returning: true,
	                  	}).then(() => {
	                  		models.Post.update({
							    closed: true,
							},
							{
							    where: {
								    slug: slugP,
							    },
							    include: [{
							        model: models.User,
							        where: {
							    	    id: userIdP,
							        },
							    }],
							    returning: true,
							}).then(() => {
								models.WorkOrder.update({
					                closed: true,
					            },
					            {
					            	where: {
					            		id: idWO,
					            	},
					            	returning: true,
								}).then(() =>{
									models.SystemMessage.create({
								    	userId: customer.id,
									  	comment: "We are sorry to say that the developer: " +developer.username+" did not complete the project on time. " +
									  			 "You have been refunded the initial payment as well as credited $" + penalty +" for your inconvenience.",
									   	seen: false, 
									}).then((systemMessage) => {
									  	models.SystemMessage.create({
									   		userId: developer.id,
									      	comment: "We are sorry to see that you did not complete project \""+titleP+"\" on time. " +
									  			 	 "You have been charged the initial payment as well as a penalty of $" + penalty,
									   		seen: false,  
									    }).then((systemMessage) => {
									    	models.Review.create({
										        comment: "Project "+titleP+" was not completed",
										        rating: 1,
										        ownerId: customer.id,
										    	recipientId: developer.id,
										    }).then((review)=> {

									    	});
										});
									});
								});
	                  		});
	                  	});
	                });
			    });
		    });
  		}
  	});

	models.Post.findAll({
  		where:{
  			bidingDeadline: {
  			    [Op.lte]: new Date(),
  			},
  			closed: false,
  		},
  		include :[{
  			model: models.WorkOrder,
  			where:{
  				complete: true,
  				reviewPending: false,
  			},
  		}],
  	}).then((posts) => {
  		var totalPosts = posts.length;
  		for( i =0; i < totalPosts; i++){
            var priceWO 	= posts[i].workOrder.price;
            var idWO 		= posts[i].workOrder.id;
  			var titleP 		= posts[i].title;

  			models.User.findOne({
			    where:{
			        id:posts[i].userId,
			    },
			    include:[{
			        model: models.Wallet,
			    }],
			}).then((customer) => {
				models.User.findOne({
		        	where:{
		          		accountType: "Admin",
		        	},
		        	include:[{
		          		model: models.Wallet,
		        	}],
		    	}).then((admin) => {
					var half = priceWO/2;
		    		models.Wallet.update({
	                    amountDeposited: (customer.wallet.amountDeposited - half),
	                },
	                {
	                	where: {
	                    	userId: customer.id,
	                    },
	                    returning: true,
	                }).then(() => {
	                    models.Wallet.update({
	                      	amountDeposited: (admin.wallet.amountDeposited + half),
	                    },
	                    {
	                    	where: {
	                      		userId: admin.id,
	                    	},
	                    	returning: true,
	                  	}).then(() => {
							models.WorkOrder.update({
								reviewPending: true,
				                closed: false,
				            },
				            {
				            	where: {
				            		id: idWO,
				            	},
				            	returning: true,
							}).then(() =>{
								models.SystemMessage.create({
							    	userId: customer.id,
								  	comment: "The developer has finished the project: "+ titleP +". Please review his work and rate it.",
								   	seen: false, 
								}).then((systemMessage) => {
								  	console.log("add rating");
								});
							});
	                  	});
	                });
			    });
		    });
  		}
  	});
  	res.render('live-database');
  },
};
