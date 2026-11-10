//This endpoint only prepares the checkout summary. It will not create the final order yet.

import pool from "../config/db";

const viewCheckout = async (req, res) => {
  const [quantity, product_id] = req.body;
  const { items } = req.body;

  await pool.query(`
      
        `);
};
