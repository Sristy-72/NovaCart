import pool from "../config/db.js";
import bcrypt from "bcrypt";
import generateToken from "../config/generateToken.js";
export const loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `
    select id , name ,email , hashedpass  , role
    from users
    where email = $1`,
      [email],
    );

    //  Check if user exists

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: " user not found",
      });
    }
    const user = result.rows[0];

    //  Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.hashedpass);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    // send token as cookie

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
};

export const logoutController = (req, res) => {
  res.clearCookie("token");
  res.json({
    message: "Logged out successfully",
  });
};
