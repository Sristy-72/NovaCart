import express from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const Router = express.Router();

Router.post("/upload", async (req, res) => {
  try {
    const { fileName, contentType, fileSize } = req.body;

    // Validate file size (5 MB)
    if (fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "File too large" });
    }

    //if image is not uploaded by user ---> if image will be not uploaded then backend will not get image metadata so it will give this error
    if (!fileName || !fileSize || !contentType) {
      return res.status(400).send({
        message: " upload image or missing image metadata ",
      });
    }

    // generating unique imageName
    const imageName = `images/${fileName}${uuidv4()}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imageName,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command);
    return res.status(200).json({
      message: "presigned url generated",
      uploadUrl: url,
      imageName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default Router;
