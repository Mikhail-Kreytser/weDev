module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('post', {
    slug: {
      type: DataTypes.STRING,
      unique: 'compositeIndex',
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    title: {
      type: DataTypes.STRING,
      unique: 'compositeIndex',
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    body: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    bidingDeadline: {
      type: DataTypes.DATE,
      allowNull:false,
      validate: {
        isDate: true,
        //isAfter
        notEmpty: true,
      },
    },
    completionDeadline: {
      type: DataTypes.DATE,
      allowNull:false,
      validate: {
        //isAfter
        isDate: true,
        notEmpty: true,
      },
    },
    tag: {
      type: DataTypes.ARRAY(DataTypes.TEXT) ,
      allowNull: true,
        validate: {
          //notEmpty: true,
        },
    },
  });

  Post.associate = (models) => {
    models.Post.belongsTo(models.User);
    models.Post.hasMany(models.Bid);
  }
     
  return Post;
};
