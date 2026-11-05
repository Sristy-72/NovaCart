import pool from "../config/db.js";

// this is for viewing the cartitems of particular user
const viewCart = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      `
        select 
        cart_items.product_id,
        cart_items.user_id,
        cart_items.quantity,
        products.stock,
        products.name,
        products.price,
        products.descr,
        products.cat_id
        from cart_items 
        join products 
        on cart_items.product_id= products.id
        where cart_items.user_id = $1 
        `,
      [user_id],
    );
    if (result.rows.length == 0) {
      return res.status(404).json({
        message: "No items in the cart",
      });
    }

    return res.status(200).json({
      message: " items in your cart",
      cart: result.rows,
    });
  } catch (error) {
    console.error("view cart error:", error);

    return res.status(500).json({
      message: " internal server error",
    });
  }
};

export default viewCart;
