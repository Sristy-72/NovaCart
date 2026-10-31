import pool from "../config/db.js";
import bcrypt from "bcrypt";
export const loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `
    select id , name ,email , hashedpass 
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

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
};
