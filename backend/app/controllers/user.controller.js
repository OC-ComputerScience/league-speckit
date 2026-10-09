import bcrypt from "bcryptjs";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { parseId } from "../helpers/fields.js";

const SALT_ROUNDS = 10;

const toPublicUser = (user) => ({
  id: user.id,
  fName: user.fName,
  lName: user.lName,
  email: user.email,
  username: user.username,
  role: user.role,
});

const exports = {};

exports.findAll = async (req, res) => {
  try {
    const users = await db.user.findAll({
      attributes: ["id", "username", "fName", "lName"],
      order: [["username", "ASC"]],
    });

    return res.send(users);
  } catch (err) {
    logger.error(`User findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch users." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const userId = parseId(req.params.id);
    if (userId == null) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await db.user.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    return res.send(toPublicUser(user));
  } catch (err) {
    logger.error(`User findOne failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch user profile." });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = parseId(req.params.id);
    if (userId == null) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await db.user.unscoped().findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    const password = req.body?.password;
    if (password === undefined || password === null || String(password) === "") {
      return res.status(400).send({ message: "Password is required." });
    }

    if (String(password).length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }

    user.password = await bcrypt.hash(String(password), SALT_ROUNDS);
    await user.save();

    const updatedUser = await db.user.findByPk(userId);
    return res.send(toPublicUser(updatedUser));
  } catch (err) {
    logger.error(`User update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update user profile." });
  }
};

export default exports;
