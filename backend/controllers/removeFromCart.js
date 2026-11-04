import pool from "../config/db.js";

const removeFromCart = async (req, res) => {
  const user_id = req.user.id;
  const { product_id } = req.body;
  try {
    const result = await pool.query(
      `
            delete from cart_items 
            where product_id = $1 and user_id = $2
            returning *
            `,
      [product_id, user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: " product not found in cart",
      });
    }

    return res.status(200).json({
      message: " Removed successfully from cart",
      cartItem: result.rows[0],
    });
  } catch (error) {
    console.error("Remove from cart error", error);

    return res.status(500).json({
      message: " internal server error",
    });
  }
};
export default removeFromCart;
