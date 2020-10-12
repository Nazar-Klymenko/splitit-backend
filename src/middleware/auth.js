const JWT = require("jsonwebtoken");
const CreateError = require("http-errors");
const client = require("../utils/redis");

const signAccessToken = (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const options = {
      expiresIn: "15m",
      issuer: "ADD THIS LATER.com",
      audience: userId,
    };
    JWT.sign(payload, secret, options, (error, token) => {
      if (error) {
        console.log(error.message);
        reject(CreateError.InternalServerError());
        return;
      }
      resolve(token);
    });
  });
};

const signRefreshToken = (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      expiresIn: "1y",
      issuer: "ADD THIS LATER.com",
      audience: userId,
    };
    JWT.sign(payload, secret, options, (error, token) => {
      if (error) {
        console.log(error.message);
        reject(CreateError.InternalServerError());
        return;
      }
      client.SET(userId, token, "EX", 365 * 24 * 60 * 60, (error, reply) => {
        if (error) {
          console.log(error.message);
          reject(CreateError.InternalServerError());
          return;
        }
        resolve(token);
      });
    });
  });
};

const verifyAccessToken = (req, res, next) => {
  if (!req.headers["authorization"]) return next(CreateError.Unauthorized());
  const authHeader = req.headers["authorization"];
  const bearerToken = authHeader.split(" ");
  const token = bearerToken[1];
  JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, payload) => {
    if (error) {
      if (error.name === "JsonWebTokenError") {
        return next(CreateError.Unauthorized());
      } else {
        return next(CreateError.Unauthorized(error.message));
      }
    }

    req.payload = payload;
    next();
  });
};

const verifyRefreshToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    JWT.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, payload) => {
        if (err)
          return reject(CreateError.Unauthorized("Refresh Token expired"));
        const userId = payload.aud;
        client.GET(userId, (error, result) => {
          if (error) {
            console.log(error.message);
            reject(CreateError.InternalServerError());
            return;
          }
          if (refreshToken === result) return resolve(userId);
          reject(CreateError.Unauthorized("Refresh Token expired"));
        });
      }
    );
  });
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
