module.exports = (sequelize, DataTypes) => {
  const Connection = sequelize.define('connection', {
    customerUsername: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    developerUsername: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adminUsername: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  Connection.associate = (models) => {
    models.Connection.belongsTo(models.User,{as: 'customer'});
    models.Connection.belongsTo(models.User,{as: 'developer'});
    models.Connection.belongsTo(models.User,{as: 'admin'});
    models.Connection.hasMany(models.Message);
  };
     
  return Connection;

};