module.exports = (sequelize, DataTypes) => {
  const Revew = sequelize.define('revew', {
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
     
  return Revew;

};