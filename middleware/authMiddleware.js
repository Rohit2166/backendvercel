const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({
      message: "No token provided"
    });


  const token = authHeader.split(" ")[1];

  try {

    // Use fallback secret if not provided in environment
    const secret = process.env.JWT_SECRET || "defaultsecretkey";
    
    const decoded = jwt.verify(token, secret);

    // Set both req.user and req.userId for compatibility
    req.user = decoded;
    req.userId = decoded.id;

    next();

  }
  catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(401).json({
      message: "Invalid or expired token. Please login again."
    });
  }

};
