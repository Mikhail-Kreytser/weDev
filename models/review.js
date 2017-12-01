module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('review', {
    comment: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    rating: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        max: 5,
        min: 0,
      },
    },
  });

  Review.associate = (models) => {
    models.Review.belongsTo(models.User,{as: 'owner'});
    models.Review.belongsTo(models.User,{as: 'recipient'});
  };
     
  return Review;

};