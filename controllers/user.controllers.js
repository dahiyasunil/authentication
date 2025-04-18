import User from "../models/User.models.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

async function registerUser(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "name, email and password are required.",
    });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User already exists." });
    }

    const user = await User.create({ name, email, password });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not registered." });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.verificationToken = token;

    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: user.email,
      subject: "Verify your email",
      html: `<p>Click on the following link to verify your email:</p><a href=${process.env.BASE_URL}/api/v1/users/verify/${token}>Verify Email</a>`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(201)
      .json({ message: "User registered successfully", success: true });
  } catch (error) {
    console.error("User not registered", err);

    res.status(400).json({
      message: "User not registered",
      success: false,
      error,
    });
  }
}

async function verifyUser(req, res) {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    return res.status(400).json({
      success: false,
      message: "Invalid verification token.",
    });
  }

  try {
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification token." });
    }

    user.verificationToken = undefined;
    user.isVerified = true;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "User verified successfully." });
  } catch (error) {
    console.error("Error while trying to verify user.", error);
    res.status(400).json({
      success: false,
      message: "Error while trying to verify user.",
      error,
    });
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "email and password are required!" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect Password." });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User is not verified" });
    }

    const jwtToken = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.SECRET,
      {
        expiresIn: "24h",
      },
    );

    const cookieOptions = {
      /** Setting httpOnly flag let the cookie be in control of backend and not easily manipulated by user */
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    };

    res.cookie("token", jwtToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      /** We send token as part of response in case of mobile app as their is no concept of cookies in apps */
      token: jwtToken,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error("Failed to login.", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to login user.", error });
  }
}

async function logoutUser(req, res) {
  try {
    res.cookie("token", "", { expiresIn: new Date(0) });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logoutUser controller.", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
}

async function userProfile(req, res) {
  try {
    const user = await User.findOne({ _id: req.user.id }).select("-password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "",
      user,
    });
  } catch (error) {
    console.error("Error in userProfile controller", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function forgetPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const resetPasswordToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = resetPasswordToken;
    user.passwordResetExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: user.email,
      subject: "Reset your password",
      html: `<p>Click on the following link to reset your password:</p><a href=${process.env.BASE_URL}/api/v1/users/reset-password/${resetPasswordToken}>Reset Password</a>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "An email is sent to user to reset password",
    });
  } catch (error) {
    console.error("Error in forget password controller ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
}

async function resetPassword(req, res) {
  const resetPasswordToken = req.params.token;
  const { newPassword, confirmPassword } = req.body;

  if (!resetPasswordToken) {
    return res.status(400).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "newPassword and confirmPassword are required",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "new password does not match confrim password.",
    });
  }

  try {
    const user = await User.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "reset link expired",
      });
    }

    user.password = confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error in resetPassword controller ", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
}

export {
  registerUser,
  verifyUser,
  loginUser,
  logoutUser,
  userProfile,
  forgetPassword,
  resetPassword,
};
