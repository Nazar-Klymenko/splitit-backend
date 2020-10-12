const createError = require("http-errors");
const User = require("../models/user");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../middleware/auth");
const client = require("../utils/redis");

async function SignUp(req, res, next) {
  const { avatar, name, surname, email, bio, password } = req.body;

  try {
    const exists = await User.findOne({ email: email });
    if (exists) {
      throw createError.Conflict(
        `user with such email (${email}) already exists`
      );
    }
    const userObj = await new User({
      avatar: avatar,
      name: name,
      surname: surname,
      email: email,
      bio: bio,
      password: password,
    });
    const savedUser = await userObj.save();

    const accessToken = await signAccessToken(savedUser.id);
    const refreshToken = await signRefreshToken(savedUser.id);

    res.header("authorization", accessToken);
    res.header("expiresIn", process.env.JWT_TOKEN_EXPIRES * 60 * 1000);
    res.cookie("refreshToken", refreshToken, {
      maxAge: process.env.REFRESH_TOKEN_EXPIRES * 60 * 1000,
      httpOnly: true,
      // secure: true   production
    });
    res.sendStatus(200);
    // res.send({ accessToken, refreshToken });
  } catch (error) {
    if (error.name === "ValidationError") res.status(422);
    next(error);
  }
}

async function Login(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw createError.Unauthorized("Invalid Email or Password");

    const isMatch = await user.isValidPassword(req.body.password);
    if (!isMatch) throw createError.Unauthorized("Invalid Email or Password");

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);

    res.header("authorization", accessToken);
    res.header("expiresIn", process.env.JWT_TOKEN_EXPIRES * 60 * 1000);
    res.cookie("refreshToken", refreshToken, {
      maxAge: process.env.REFRESH_TOKEN_EXPIRES * 60 * 1000,
      httpOnly: true,
      // secure: true   production
    });
    res.sendStatus(200);
    // res.send({ accessToken, refreshToken });
  } catch (error) {
    if (error.name === "ValidationError")
      return next(createError.BadRequest("Invalid Email or Password"));
    next(error);
  }
}

async function Logout(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);
    client.DEL(userId, (error, value) => {
      if (error) {
        console.log(error.message);
        throw createError.InternalServerError();
      }
      console.log(value);
      res.sendStatus(204);
    });
  } catch (error) {
    next(error);
  }
}

async function CurrentUser(req, res, next) {
  try {
    const user = await await User.findById(req.payload.aud);
    res.send(user.email);
  } catch (error) {
    next(error);
  }
}

async function DeleteUser(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw createError.BadRequest();
    const isMatch = await user.isValidPassword(req.body.password);
    if (!isMatch) throw createError.Unauthorized("Invalid Password");

    const { refreshToken } = req.cookies;
    if (!refreshToken) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);

    const deletingUser = await User.findByIdAndDelete(userId);

    client.DEL(userId, (error, value) => {
      if (error) {
        console.log(error.message);
        throw createError.InternalServerError();
      }
      console.log(value);
    });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

async function AddAvatar(req, res, next) {
  try {
  } catch (error) {}
}

async function DeleteAvatar(req, res, next) {
  try {
  } catch (error) {}
}

async function RefreshToken(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);
    const accessToken = await signAccessToken(userId);
    const refToken = await signRefreshToken(userId);
    res.header("authorization", accessToken);
    res.header("expiresIn", process.env.JWT_TOKEN_EXPIRES * 60 * 1000);

    res.cookie("refreshToken", refToken, {
      maxAge: process.env.REFRESH_TOKEN_EXPIRES * 60 * 1000,
      httpOnly: true,
      // secure: true   production
    });
    res.sendStatus(200);
    // res.send({ accessToken: accessToken, refreshToken: refToken });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  SignUp,
  Login,
  Logout,
  RefreshToken,
  CurrentUser,
  DeleteUser,
  AddAvatar,
  DeleteAvatar,
};
