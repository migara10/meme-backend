import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const tokenVerifyMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - Token not provided' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.ACCESS_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

export default tokenVerifyMiddleware;
