module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('wallet', {
    amountDeposited: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
/*    creditCardNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
        isCreditCard: true,
      },
    },
    cvv: {
      type: DataTypes.INTEGER,
      validate:{
        max: 9999,
        min: 100,
      },
    },
    expirationDate: {
      type: DataTypes.DATEONLY,
      allowNull:false,
      validate: {
        isDate: true,
        notEmpty: true,
      },
    },
    zipCode: {
      type: DataTypes.INTEGER,
      validate:{
        max: 99999,
        min: 10000,
      },
    },*/
  });

  Wallet.associate = (models) => {
    models.Wallet.belongsTo(models.User);
  };

  return Wallet;
};
