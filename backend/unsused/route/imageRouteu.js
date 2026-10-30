import express from "express";

import multer from "multer";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "node:path";

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const Router = express.Router();
const storage = multer.memoryStorage(); // ye sirf temporarily file ke metadata ko store karega jo phir s3 ke paas jayega
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

Router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("Please select an image to upload");
    }

    // Generate unique key/filename
    const fileExtension = path.extname(req.file.originalname);
    const imageName = `images/${uuidv4()}${fileExtension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );

    res.status(201).json({
      message: "Image uploaded successfully",
      imageName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

Router.get("/:imageName", async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `images/${req.params.imageName}`,
    });
    const imageUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    res.status(200).json({ imageUrl });
  } catch (error) {
    res.status(500).json({ errr: error.message });
  }
});

// this is unused in imageRoutes because verification for the image metadata will be already done in productRoutes during uploading the image
Router.post("/verify-upload", async (req, res) => {
  try {
    const { imageName } = req.body;
    const command = new HeadObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imageName,
    });

    const result = await s3Client.send(command);

    if (!result.ContentLength || result.ContentLength === 0) {
      return res.status(400).json({
        message: "uploaded image is empty",
      });
    }
    return res.status(200).json({
      message: " image uplaoded successfully ",
      size: result.ContentLength,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
});

export default Router;
