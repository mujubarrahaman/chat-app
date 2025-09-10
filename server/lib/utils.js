import JWT from "jsonwebtoken";

// Function to generate a token for a user

export const generateToken = (userId)=>{
    const token = JWT.sign({userId}, process.env.JWT_SECRET);
    return token;
}