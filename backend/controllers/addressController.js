import pool from "../config/db.js";

const postAddress = async (req, res) => {
  const user_id = req.user.id;
  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pincode,
    address_type,
  } = req.body;
  if (!full_name || !phone || !address_line1 || !city || !state || !pincode) {
    return res.status(400).json({
      message: " some required details are missing",
    });
  }

  try {
    const result = await pool.query(
      `
        insert into addresses 
        (user_id,full_name , phone , address_line1 , address_line2 , city, state , pincode , address_type)
        values ($1 ,$2 , $3 , $4, $5, $6, $7 , $8 , $9)
        returning *
        `,
      [
        user_id,
        full_name,
        phone,
        address_line1,
        address_line2 || null,
        city,
        state,
        pincode,
        address_type || "Home",
      ],
    );

    return res.status(201).json({
      message: " address added successfully",
      address: result.rows[0],
    });
  } catch (error) {
    console.log(" could not add address:", error);
    return res.status(500).json({
      message: " Internal server error",
    });
  }
};

const getAddress = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `
     select full_name , phone , address_line1, address_line2 ,city , state, pincode , address_type
       from addresses 
     where user_id = $1 
     order by created_at desc
    `,
      [user_id],
    );
    const addresses = result.rows;

    return res.status(200).json({
      message: " address fetched successfully",
      address: addresses,
    });
  } catch (error) {
    console.log(" get address error:", error);
    return res.status(500).json({
      message: " Internal server error",
    });
  }
};
export default { postAddress, getAddress };
