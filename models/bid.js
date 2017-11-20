module.exports = (sequelize, DataTypes) => {
  const Bid = sequelize.define('bid', {
    price: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  });

  Bid.associate = (models) => {
    models.Bid.belongsTo(models.Post);
    models.Bid.belongsTo(models.User);
  };
     
  return Bid;

};