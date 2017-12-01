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
		                    creditCardNumber: customer.wallet.creditCardNumber,
		                    cvv: customer.wallet.cvv,
		                    expirationDate: customer.wallet.expirationDate,
		                    zipCode: customer.wallet.zipCode,
		                },
		                {
		                	where: {
		                    	userId: customer.id,
		                    },
		                    returning: true,
		                }).then(() => {
		                    models.Wallet.update({
		                      	amountDeposited: (admin.wallet.amountDeposited + 10),
		                      	creditCardNumber: admin.wallet.creditCardNumber,
		                      	cvv: admin.wallet.cvv,
		                      	expirationDate: admin.wallet.expirationDate,
		                      	zipCode: admin.wallet.zipCode,
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
  			var reviewPendingWO = posts[i].workOrder.reviewPending;
            var confirmedWO = posts[i].workOrder.confirmed;
  			var commentWO 	= posts[i].workOrder.comment;
            var userIdWO 	= posts[i].workOrder.userId;
            var postIdWO 	= posts[i].workOrder.postid;
            var priceWO 	= posts[i].workOrder.price;
            var idWO 		= posts[i].workOrder.id;
  			var slugP = posts[i].slug;
  			var titleP = posts[i].title;
  			var userIdP = posts[i].userId;
  			var bodyP = posts[i].body;
  			var completionDeadlineP = posts[i].completionDeadline;
  			var bidingDeadlineP = posts[i].bidingDeadline;

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
	                    creditCardNumber: customer.wallet.creditCardNumber,
	                    cvv: customer.wallet.cvv,
	                    expirationDate: customer.wallet.expirationDate,
	                    zipCode: customer.wallet.zipCode,
	                },
	                {
	                	where: {
	                    	userId: customer.id,
	                    },
	                    returning: true,
	                }).then(() => {
	                	console.log("added money to cus");
	                    models.Wallet.update({
	                    	amountDeposited: (developer.wallet.amountDeposited - half),
	                      	creditCardNumber: developer.wallet.creditCardNumber,
	                      	cvv: developer.wallet.cvv,
	                      	expirationDate: developer.wallet.expirationDate,
	                      	zipCode: developer.wallet.zipCode,
	                    },
	                    {
	                    	where: {
	                      		userId: developer.id,
	                    	},
	                    	returning: true,
	                  	}).then(() => {
	                	console.log("took away money to dev");
	                  		models.Post.update({
							    title: titleP,
							    slug: slugP,
							    body: bodyP,
							    completionDeadline: completionDeadlineP,
							    bidingDeadline: bidingDeadlineP,
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
									reviewPending: reviewPendingWo,
					                confirmed: confirmedWO,
									comment: commentWO,
					                userId: userIdWO,
					                postId: postIdWO,
					                price: priceWO,
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
									    	console.log("add rating");
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
  			var reviewPending = posts[i].workOrder.reviewPending;
            var confirmedWO   = posts[i].workOrder.confirmed;
  			var commentWO 	  = posts[i].workOrder.comment;
            var userIdWO 	  = posts[i].workOrder.userId;
            var postIdWO 	  = posts[i].workOrder.postid;
            var priceWO 	  = posts[i].workOrder.price;
            var idWO 		  = posts[i].workOrder.id;
  			var completionDeadlineP = posts[i].completionDeadline;
  			var bidingDeadlineP 	= posts[i].bidingDeadline;
  			var userIdP 			= posts[i].userId;
  			var closedP				= posts[i].closed;
  			var titleP 				= posts[i].title;
  			var slugP 				= posts[i].slug;
  			var bodyP 				= posts[i].body;

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
	                    creditCardNumber: customer.wallet.creditCardNumber,
	                    cvv: customer.wallet.cvv,
	                    expirationDate: customer.wallet.expirationDate,
	                    zipCode: customer.wallet.zipCode,
	                },
	                {
	                	where: {
	                    	userId: customer.id,
	                    },
	                    returning: true,
	                }).then(() => {
	                    models.Wallet.update({
	                      	amountDeposited: (admin.wallet.amountDeposited + half),
	                      	creditCardNumber: admin.wallet.creditCardNumber,
	                      	cvv: admin.wallet.cvv,
	                      	expirationDate: admin.wallet.expirationDate,
	                      	zipCode: admin.wallet.zipCode,
	                    },
	                    {
	                    	where: {
	                      		userId: admin.id,
	                    	},
	                    	returning: true,
	                  	}).then(() => {
	                  		models.Post.update({
							    completionDeadline: completionDeadlineP,
							    bidingDeadline: bidingDeadlineP,
							    closed: closedP,
							    title: titleP,
							    slug: slugP,
							    body: bodyP,
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
					                confirmed: confirmedWO,
									reviewPending: true,
									comment: commentWO,
					                userId: userIdWO,
					                postId: postIdWO,
					                price: priceWO,
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
		    });
  		}
  	});
  	res.render('live-database');
  },
};
