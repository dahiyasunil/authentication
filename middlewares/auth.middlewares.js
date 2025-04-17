import jwt from "jsonwebtoken";

async function isLoggedIn(req, res, next) {
  try {
    const authToken = req.cookies?.token;

    if (!authToken) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    const decodedData = jwt.verify(authToken, process.env.SECRET);

    req.user = decodedData;
  } catch (error) {
    console.error("Auth middleware failure");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
  next();
}

export { isLoggedIn };
