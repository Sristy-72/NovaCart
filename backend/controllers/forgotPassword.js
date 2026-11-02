import crypto from "node:crypto";
import pool from "../config/db.js";
import sendEmail from "../utils/sendEmail.js";
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // find user
    const result = await pool.query(
      `select id , name , email 
      from users 
      where email =$1`,
      [email],
    );

    // check if user exist
    const user = result.rows[0];
    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "If an account exists, a reset link will be sent.",
      });
    }
    // generate reset token

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // delete the unused hashed token if stored
    await pool.query(
      `delete from password_reset_tokens
         where user_id = $1 and used_at is null`,
      [user.id],
    );

    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    // store hashed token into database
    await pool.query(
      `
            insert into password_reset_tokens 
            (user_id, token_hash , expires_at)
            values ($1 , $2, $3)`,
      [user.id, tokenHash, expiry],
    );

    // generate reset link
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    // send through email
    try {
      await sendEmail(
        user.email,
        "NovaCart Password Reset",
        `
      <h2>Password Reset Request</h2>
      <p>Click below to reset your password.</p>
      <a href="${resetLink}">Reset Password</a>
       <p>This link expires in 15 minutes.</p>
  `,
      );
    } catch (emailError) {
      // remove token if delivery fails

      await pool.query(
        `
        delete from password_reset_tokens 
        where token_hash= $1`,
        [tokenHash],
      );
      throw emailError;
    }

    return res.status(200).json({ message: "reset link sent successfully" });
  } catch (error) {
    console.error("forget password error:", error);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

export default forgotPassword;
