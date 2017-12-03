module.exports = (sequelize, DataTypes) => {
  const SystemMessage = sequelize.define('systemMessage', {
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    seen: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        notEmpty: true,
      },
    },
  });

  SystemMessage.associate = (models) => {
    models.SystemMessage.belongsTo(models.User);
  };
     
  return SystemMessage;

};