import User from "../models/User.models.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

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
  } catch (err) {
    console.error("User not registered", err);

    res.status(400).json({
      message: "User not registered",
      success: false,
      error: err.message,
    });
  }
}

export { registerUser };
