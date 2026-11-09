import pool from "../config/db.js";

const addToCart = async (req, res) => {
  const user_id = req.user.id;
  const { product_id, quantity } = req.body;

  try {
    // 1. Validate input
    if (!product_id || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Valid product ID and quantity are required",
      });
    }

    // 2. Check product existence
    const productExists = await pool.query(
      `SELECT id, stock FROM products WHERE id = $1`,
      [product_id],
    );

    if (productExists.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = productExists.rows[0];

    // 3. Check existing cart quantity
    const existingCart = await pool.query(
      `SELECT quantity FROM cart_items
       WHERE user_id = $1 AND product_id = $2`,
      [user_id, product_id],
    );

    const existingQuantity = existingCart.rows[0]?.quantity || 0;
    const updatedQuantity = existingQuantity + quantity;

    // 4. Validate stock
    if (updatedQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} items are currently available`,
      });
    }

    // 5. Insert or update cart item
    const result = await pool.query(
      `INSERT INTO cart_items (product_id, user_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE
       SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [product_id, user_id, quantity],
    );

    return res.status(200).json({
      message: "Product added to cart successfully",
      cartItem: result.rows[0],
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default addToCart;
