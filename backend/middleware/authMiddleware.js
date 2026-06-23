const jwt = require("jsonwebtoken");

// This middleware checks if a valid JWT was sent before allowing access to a route
const protect = (req, res, next) => {
  // Tokens are sent in the header like: "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token is valid and not tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user's id to the request so later routes know who's calling
    req.userId = decoded.userId;

    next(); // move on to the actual route handler
  } catch (error) {
    res.status(401).json({ message: "Token is invalid or expired" });
  }
};

module.exports = protect;