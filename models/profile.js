module.exports = (sequelize, DataTypes) => {
  const Profile = sequelize.define('profile', {
    bio: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  });

  Profile.associate = (models) => {
    models.Profile.belongsTo(models.User);
  }

  return Profile;
};
