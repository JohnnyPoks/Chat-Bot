const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db/dbConnector");

class Chat extends Model {}

Chat.init(
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    messages: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Chat",
    timestamps: false,
  }
);

module.exports = Chat;
