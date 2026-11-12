//This endpoint only prepares the checkout summary. It will not create the final order yet.
// address and payment options

import pool from "../config/db.js";

const checkoutPreview = async (req, res) => {
  const user_id = req.user.id;
  const { items } = req.body;
  try {
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: " Atleast one product is reuired to continue",
      });
    }

    // validate the product id and quantity of each item in items
    const productIds = new Set();

    for (const item of items) {
      if (item.product_id <= 0 || item.quantity <= 0) {
        return res.status(400).json({
          message: " Invalid product ID or quantity",
        });
      }

      if (productIds.has(item.product_id)) {
        return res.status(400).json({
          message: " Duplicate products found ",
        });
      }
      productIds.add(item.product_id);
    }

    // Fetch selected products from the user's cart

    const ids = items.map((item) => item.product_id); // [1, 2, 3] -- array of product_id

    const result = await pool.query(
      `
      select 
      ci.product_id,
        ci.quantity AS cart_quantity,
        p.name,
        p.price,
        p.descr
      FROM cart_items ci
      JOIN products p
        ON ci.product_id = p.id
      WHERE ci.user_id = $1
        AND ci.product_id = ANY($2::int[])
      `,
      [user_id, ids],
    );
    //  Verify that every selected product belongs to the cart
    if (result.rows.length !== items.length) {
      return res.status(400).json({
        message: "Some selected products are not in your cart",
      });
    }

    //  Match requested quantities and validate stock
    const checkoutItems = [];

    for (const item of items) {
      const product = result.rows.find(
        (p) => String(p.product_id) === String(item.product_id),
      );

      if (product.stock === 0) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }
      if (item.quantity > product.cart_quantity) {
        return res.status(400).json({
          message: `Selected quantity exceeds cart quantity for ${product.name}`,
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          message: `${product.name} is out of stock or has insufficient stock`,
        });
      }

      const subtotal = Number(product.price) * item.quantity;

      checkoutItems.push({
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal,
      });
    }

    // 6. Calculate checkout total
    const subtotal = checkoutItems.reduce(
      (total, item) => total + item.subtotal,
      0,
    );
    let shipping;
    if (subtotal > 500) {
      shipping = 0;
    } else {
      shipping = 40;
    }

    const total = subtotal + shipping;

    // 7. Return checkout summary
    return res.status(200).json({
      message: "Checkout preview generated successfully",
      items: checkoutItems,
      subtotal,
      shipping,
      total,
    });
  } catch (error) {
    console.error("Checkout preview error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default checkoutPreview;
