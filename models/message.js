module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('message', {
    body: {
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

  Message.associate = (models) => {
    models.Message.belongsTo(models.User,{as: 'sender'});
    models.Message.belongsTo(models.Connection);
  };
     
  return Message;

};