import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = header.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({
      $or: [{ "sessionTokens.token": token }, { sessionToken: token }]
    });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authMiddleware;
