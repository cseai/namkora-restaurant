"use strict";
import userTypes from "./userTypes";
import { UsersStorageKey } from "./storageKeys";
import * as model from "./model";
import { ValidationError } from "./exceptions";

export default class User {
  usename = "";
  _password = "";
  userType = userTypes.ANONYMOUS;

  constructor(usename = "", rawPassword = "", userType = userTypes.ANONYMOUS) {
    this.usename = usename;
    this._password = rawPassword ? encriptPassword(rawPassword) : "";
    if (userType === userTypes.CUSTOMER || userType === userTypes.ADMIN)
      this.userType = userType;
    else this.userType = userTypes.ANONYMOUS;
  }
}

User.prototype.getPasswordHash = function () {
  return this._password;
};

User.prototype.normalizeUsername = function () {
  this.usename = normalizeUsername(this.usename);
  return this;
};

User.prototype.resetPassword = function (rawPassword) {
  this._password = rawPassword ? encriptPassword(rawPassword) : "";
  persistUsers();
};

User.prototype.isCorrectPassword = function (rawPassword) {
  encriptPassword(rawPassword) === this.getPasswordHash();
};

User.prototype.save = function () {
  const user = getUser(this.usename);
  if (!user) {
    // new user
    model.state.users.push(this);
  } else {
    // Same user. Early return
    if (user === this) return this;

    user.usename = this.usename;
    user._password = this.getPasswordHash();
    user.userType = this.userType;
  }

  // synce to local storage
  persistUsers();
  return this;
};

const getUser = (usename) => {
  usename = normalizeUsername(usename);
  for (i = 0; i < model.state.users.length; i++) {
    if (model.state.users[i].usename === usename) return model.state.users[i];
  }
  return false;
};

const isUsernameExist = (usename) => {
  usename = normalizeUsername(usename);
  let found = false;
  for (i = 0; i < model.state.users.length && !found; i++) {
    if (model.state.users[i].usename === usename) return true;
  }
  return found;
};

const normalizeUsername = (usename) => {
  return typeof usename === "string" ? usename.trim() : "";
};

const encriptPassword = (rawPassword) => {
  // TODO: Implement real encription algorithm
  const hashPrefix = "super#duper#";
  const hashPostfix = "#password";
  return `${hashPrefix}${rawPassword}${hashPostfix}`;
};

const persistUsers = () => {
  localStorage.setItem(UsersStorageKey, JSON.stringify(model.state.users));
};

export const createUser = (
  username,
  rawPassword,
  userType = userTypes.CUSTOMER
) => {
  if (!(username || rawPassword))
    throw new ValidationError("Username and/or password required");
  if (isUsernameExist(username))
    throw new ValidationError(
      `The given username (${username}) is already exist! Try another one!`
    );
  const user = new User(username, rawPassword, userType);
  user.normalizeUsername().resetPassword(rawPassword);
  user.userType =
    userType === userTypes.ADMIN ? userTypes.ADMIN : userTypes.CUSTOMER;

  return user.save();
};
