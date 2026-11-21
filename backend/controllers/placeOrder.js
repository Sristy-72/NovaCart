// this is for placing the order
//Currently, both COD and ONLINE follow the same process: the order is created, stock is reduced, and cart quantities are updated.

import pool from "../config/db.js";

// recieve selected payment option , quantity , product_id  and address from frontend

const placeOrder = async (req, res) => {
  const user_id = req.user.id;
  const { items, address_id, payment_method } = req.body;

  let transactionStarted = false;
  let client;

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
    client = await pool.connect();
    await client.query("BEGIN");

    // select the item with stored ids along with its metadata from products and user's cart
    transactionStarted = true;
    const result = await client.query(
      `
     select cart_items.product_id , 
     cart_items.quantity as cart_quantity,
     products.name,
     products.stock,
     products.price
     from cart_items
     join products 
     on products.id = cart_items.product_id 
     where cart_items.user_id = $1  and 
     cart_items.product_id = ANY($2::int[])
     order by products.id
     for update of cart_items , products
    `,
      [user_id, ids],
    );
    if (result.rows.length != items.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(400).json({
        message: " some items are missing ",
      });
    }

    const checkoutItems = [];
    // Validate quantities and calculate subtotal
    for (const item of items) {
      const product = result.rows.find((p) => p.product_id == item.product_id);

      if (!product) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(404).json({
          message: " product not found in cart_items",
        });
      }
      if (item.quantity > product.stock) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          message: `${product.name} has insufficient stock`,
        });
      }
      if (item.quantity > product.cart_quantity) {
        await client.query("ROLLBACK");
        transactionStarted = false;

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

    const orderMetadata = await client.query(
      `
       select 
       id,
       full_name ,
       phone,
       address_line1,
       address_line2,
       city,
       state,
       pincode
       from addresses
       where 
       user_id = $1  and id = $2
        `,
      [user_id, address_id],
    );
    if (orderMetadata.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Address not found",
      });
    }
    const address = orderMetadata.rows[0];

    const order = await client.query(
      `
      insert  into orders 
      (user_id , total , payment_method , address_id , full_name, phone ,address_line1 ,
       address_line2,city , state , pincode , subtotal , shipping_fee 
        )
        values ($1, $2, $3, $4 , $5 , $6, $7, $8, $9, $10, $11, $12, $13) 
         RETURNING id, total, payment_status, order_status
      `,
      [
        user_id,
        total,
        payment_method,
        address_id,
        address.full_name,
        address.phone,
        address.address_line1,
        address.address_line2,
        address.city,
        address.state,
        address.pincode,
        subtotal,
        shipping,
      ],
    );
    const orderId = order.rows[0].id;
    for (const item of checkoutItems) {
      await client.query(
        `
      INSERT INTO order_items (
      order_id, product_id, product_name,
      quantity, unit_price, subtotal
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
        [
          orderId,
          item.product_id,
          item.name,
          item.quantity,
          item.price,
          item.subtotal,
        ],
      );
    }
    for (const item of checkoutItems) {
      const stockUpdate = await client.query(
        `
        UPDATE products
        SET stock = stock - $1
        WHERE id = $2 AND stock >= $1
        RETURNING id
    `,
        [item.quantity, item.product_id],
      );

      if (stockUpdate.rows.length === 0) {
        throw new Error("Stock update failed");
      }
    }

    for (const item of checkoutItems) {
      const cartUpdate = await client.query(
        `
    UPDATE cart_items
    SET quantity = quantity - $1
    WHERE user_id = $2 AND product_id = $3
    RETURNING quantity
    `,
        [item.quantity, user_id, item.product_id],
      );

      if (cartUpdate.rows.length === 0) {
        throw new Error("Cart update failed");
      }

      if (Number(cartUpdate.rows[0].quantity) === 0) {
        await client.query(
          `
      DELETE FROM cart_items
      WHERE user_id = $1 AND product_id = $2
      `,
          [user_id, item.product_id],
        );
      }
    }
    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      message: "Order placed successfully",
      order: order.rows[0],
      items: checkoutItems,
      subtotal,
      shipping,
      total,
    });
  } catch (error) {
    if (client && transactionStarted) {
      await client.query("ROLLBACK");
    }

    console.error("Place error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};
export default placeOrder;
