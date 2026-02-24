const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    // Use fallback secret if not provided in environment
    const secret = process.env.JWT_SECRET || "defaultsecretkey";
    const decoded = jwt.verify(token, secret);

    req.userId = decoded.id;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token"
    });
  }
};
