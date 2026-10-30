import express from "express";
import pool from "../config/db.js";
import s3Client from "../config/s3.js";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

const Router = express.Router();

Router.post("/", async (req, res) => {
  const { name, descr, price, stock, cat_id, imageName, originalFilename } =
    req.body;

  let client;

  try {
    // 1--> Validate product details

    if (
      !name?.trim() ||
      price == null ||
      stock == null ||
      !cat_id ||
      !imageName
    ) {
      return res.status(400).json({
        message: "Please provide all required product details",
      });
    }

    // 2--> Validate the S3 object key
    if (!imageName.startsWith("images/")) {
      return res.status(400).json({
        message: "Invalid image object key",
      });
    }

    // 3--> Verify image in S3
    const command = new HeadObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imageName,
    });

    const image = await s3Client.send(command);

    if (!image.ContentLength || image.ContentLength === 0) {
      return res.status(400).json({
        message: "Image is empty",
      });
    }

    if (!image.ContentType?.startsWith("image/")) {
      return res.status(400).json({
        message: "Uploaded file is not an image",
      });
    }

    // 4--> Start PostgreSQL transaction
    client = await pool.connect();
    await client.query("BEGIN");

    // 5--> Insert product
    const productResult = await client.query(
      `INSERT INTO products
       (name, descr, price, stock, cat_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, descr, price, stock, cat_id],
    );

    const product = productResult.rows[0];

    // 6--> Insert image metadata
    await client.query(
      `INSERT INTO product_images
       (product_id, object_key, original_filename, content_type, file_size)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        product.id,
        imageName,
        originalFilename || null,
        image.ContentType,
        image.ContentLength,
      ],
    );

    // 7--> Commit transaction
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Product created successfully",
      product,
      image: {
        objectKey: imageName,
        contentType: image.ContentType,
        fileSize: image.ContentLength,
      },
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Product creation error:", error);

    return res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  } finally {
    client?.release();
  }
});

export default Router;
