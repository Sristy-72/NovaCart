import pool from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  // token and newPassword is required
  if (!token || !newPassword) {
    return res.status(400).json({
      message: " token and new Password is reauired",
    });
  }

  // checking password requirement
  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Password must contain at least 8 characters",
    });
  }

  let client;
  // hashing the token recieved from frontend
  try {
    const hashToken = crypto.createHash("sha256").update(token).digest("hex");

    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      `
            select user_id
             from password_reset_tokens
            where token_hash= $1 
            and expires_at>now()
            and used_at is null
            for update `,
      [hashToken],
    );

    if (result.rows.length === 0) {
      await client.query("rollback");
      return res.status(400).json({
        message: "invalid or expired reset token",
      });
    }

    const hash_pass = await bcrypt.hash(newPassword, 12);
    const user = result.rows[0];
    const userId = user.user_id;

    // update user password
    await client.query(
      `
      update users 
      set hashedpass =$1
      where id = $2
      `,
      [hash_pass, userId],
    );

    // mark token as used
    await client.query(
      `
   update password_reset_tokens
   set used_at = now()
   where user_id = $1`,
      [userId],
    );
    await client.query("COMMIT");

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    client?.release();
  }
};

export default resetPassword;
