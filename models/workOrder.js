module.exports = (sequelize, DataTypes) => {
  const WorkOrder = sequelize.define('workOrder', {
    comment: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  });

  WorkOrder.associate = (models) => {
    models.WorkOrder.belongsTo(models.Post);
    models.WorkOrder.belongsTo(models.User);
  };
     
  return WorkOrder;

};