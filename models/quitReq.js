module.exports = (sequelize, DataTypes) => {
  const QuitReq = sequelize.define('quitReq', {
    requested: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  });

  QuitReq.associate = (models) => {
    models.QuitReq.belongsTo(models.User);
  };
     
  return QuitReq;

};