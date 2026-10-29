import pool from "../config/db";

const addProducts = async (req, res) => {
  const [name, descr, price, stock, quantity, cat_id, imageUrl] = req.body;

  try {
    if (!name || !price || !descr || !quantity || !cat_id) {
      return res.status(400).json({
        message: "Missing Required details",
        success: false,
      });
    }
    const queryText = `
      insert into products (name , price , stock, cat_id, quantity, descr , imageUrl )
      values ($1, $2, $3 , $4, $5, $6, $7)
      returning *;
      `;

    const values = [
      name,
      price,
      stock || 0,
      cat_id,
      quantity || 0,
      descr,
      imageUrl,
    ];

    // execute query
    const result = await pool.query(queryText, values);

    res.status(201).json({
      success: true,
      message: "Product added successfully!",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while adding product",
      error: error.message,
    });
  }
};
export default addProducts;
