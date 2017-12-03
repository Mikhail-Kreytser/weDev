module.exports = (sequelize, DataTypes) => {
  const Profile = sequelize.define('profile', {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    bio: {
      type: DataTypes.TEXT,
    },
    companyWebsite: {      
      type: DataTypes.STRING,
      validate: {
        isUrl: true,
      },
    },
    companyInfo: {
      type: DataTypes.STRING,
    },
    profileImage: {
      type :DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    rating:{
      type :DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        max: 5,
        min: 0,
      },
    },
  });

  Profile.associate = (models) => {
    models.Profile.belongsTo(models.User);
  };

  return Profile;
};
