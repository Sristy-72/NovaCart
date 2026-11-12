import pool from "../config/db.js";

const addToCart = async (req, res) => {
  const user_id = req.user.id;
  const { product_id, quantity } = req.body;
  // 1. Validate input
  if (!product_id || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      message: "Valid product ID and quantity are required",
    });
  }

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    // 2. Check product existence
    const productExists = await client.query(
      `SELECT id, stock FROM products WHERE id = $1 
      for update`,
      [product_id],
    );

    if (productExists.rows.length === 0) {
      await client.query("Rollback");
      transactionStarted = false;
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = productExists.rows[0];

    // 3. Check existing cart quantity
    const existingCart = await client.query(
      `SELECT quantity FROM cart_items
       WHERE user_id = $1 AND product_id = $2`,
      [user_id, product_id],
    );

    const existingQuantity = existingCart.rows[0]?.quantity || 0;
    const updatedQuantity = existingQuantity + quantity;

    // 4. Validate stock

    if (updatedQuantity > product.stock || updatedQuantity > 10) {
      await client.query("rollback");
      transactionStarted = false;
      return res.status(400).json({
        message: `Only ${product.stock} items are currently available or only 10 items per user allowed`,
      });
    }

    // 5. Insert or update cart item (upsert) if product already exist in the cart then just update the quantity and if it does not exist then add it
    const result = await client.query(
      `INSERT INTO cart_items (product_id, user_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE
       SET quantity = EXCLUDED.quantity
       RETURNING *`,
      [product_id, user_id, updatedQuantity],
    );
    await client.query("commit");
    transactionStarted = false;

    return res.status(200).json({
      message: "Product added to cart successfully",
      cartItem: result.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    console.error("Add to cart error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    client.release();
  }
};

export default addToCart;
