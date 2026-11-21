import pool from "../config/db.js";

const editProfile = async (req, res) => {
  const { name, phone, gender } = req.body;
  try {
    const result = await pool.query(
      `
    update users
    set name = $1 , phone = $2, 
    address = $3, gender = $4
    where id = $5
    returning name , phone ,  gender`,
      [name, phone, gender, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    return res.status(200).json({
      message: " profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Edit profile error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
export default editProfile;
