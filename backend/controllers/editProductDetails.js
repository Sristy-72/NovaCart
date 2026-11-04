import pool from "../config/db.js";

const editProductDetails = async (req, res) => {
  const { product_id } = req.params;
  const { name, price, stock, cat_id, descr } = req.body;
  try {
    await pool.query(
      `
    update products 
    set name= $1,
    price=$2,
    stock = $3,
    cat_id = $4 ,
    descr = $5      
    where id =$6
     returning * `,
      [name, price, stock, cat_id, descr, product_id],
    );

    return res.status(200).json({
      message: " product details updated successfully",
    });
  } catch (error) {
    console.error(" product detail update error:", error);
    return res.status(400).json({
      error: error.message,
    });
  }
};
export default editProductDetails;
