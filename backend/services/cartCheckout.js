// this is for proceed to payment

import pool from "../config/db.js";

// recieve selected payment option , quantity , product_id  and address from frontend

const cartCheckout = async (req, res) => {
  const user_id = req.user.id;
  const { items, address_id, payment_method } = req.body;

  try {
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: " atleast one item is required",
      });
    }
    if (!Number.isInteger(address_id) || address_id <= 0) {
      return res.status(400).json({
        message: "Invalid address ID",
      });
    }
    if (!["COD", "ONLINE"].includes(payment_method)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    const productIds = new Set();

    // validate the product id and its quantity then store the ids into productIds
    for (const item of items) {
      if (
        !item ||
        !Number.isInteger(item.product_id) ||
        item.quantity <= 0 ||
        item.product_id <= 0 ||
        !Number.isInteger(item.quantity)
      ) {
        return res.status(400).json({
          message: " Invalud product id or quantity",
        });
      }
      if (productIds.has(item.product_id)) {
        return res.status(400).json({
          message: " duplicate product found",
        });
      }
      productIds.add(item.product_id);
    }

    const ids = items.map((item) => item.product_id);

    // select the item with stored ids along with its metadata from products and user's cart

    const result = await pool.query(
      `
     select cart_items.product_id , 
     cart_items.quantity as cart_quantity,
     products.name,
     products.stock,
     products.price,
     products.descr
     from cart_items
     join products 
     on products.id = cart_items.product_id 
     where cart_items.user_id = $1  and 
     cart_items.product_id = ANY($2::int[])
    `,
      [user_id, ids],
    );
    if (result.rows.length != items.length) {
      return res.status(400).json({
        message: " some items are missing ",
      });
    }

    const checkoutItems = [];
    // validate selected Quantities
    for (const item of items) {
      const product = result.rows.find((p) => p.product_id == item.product_id);

      if (!product) {
        return res.status(404).json({
          message: " product not found in cart_items",
        });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({
          message: `${product.name} has insufficient stock`,
        });
      }
      if (item.quantity > product.cart_quantity) {
        return res.status(400).json({
          message: `Selected quantity exceeds cart quantity for ${product.name}`,
        });
      }
      const itemSubtotal = Number(product.price) * item.quantity; // subtotal of each item

      checkoutItems.push({
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    const subtotal = checkoutItems.reduce(
      (total, item) => total + item.subtotal,
      0,
    );
    const shipping = subtotal > 500 ? 0 : 40;
    const total = subtotal + shipping;

    // validate address ownership
    const addressId = await pool.query(
      `
      SELECT
      id,
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      address_type
      FROM addresses
      WHERE id = $1 AND user_id = $2
      `,
      [address_id, user_id],
    );

    if (addressId.rows.length === 0) {
      return res.status(404).json({
        message: "address not found",
      });
    }
    return res.status(200).json({
      message: "Checkout Summary generated successfully",
      items: checkoutItems,
      address: addressId.rows[0],
      payment_method,
      subtotal,
      total,
      shipping,
    });
  } catch (error) {
    console.error("Cart checkout error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
export default cartCheckout;
