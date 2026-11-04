import pool from "../config/db.js";

const deleteProduct = async (req, res) => {
  const { product_id } = req.params;

  try {
    if (!product_id) {
      return res.status(400).json({
        message: " product_id  is missing",
      });
    }

    const result = await pool.query(
      `
        delete from products
        where id =$1 
        returning *
        `,
      [product_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "product not found",
      });
    }
    return res.status(200).json({
      message: " product deleted successfully",
    });
  } catch (error) {
    console.error("delete product error:", error);
    return res.status(404).json({
      error: error.message,
    });
  }
};

export default deleteProduct;
