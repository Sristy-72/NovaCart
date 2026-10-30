- there is two ways to validate that an empty image is not getting fetched on frontend

#### 1 using Multer and sending file to backend for verification before uploading it to the S3 --this method is done before uploading it to s3

```bash
Router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file || req.file.size === 0) {
      return res.status(400).json({
        message: "Please upload a valid image",
      });
    }

    // Upload to S3 using PutObjectCommand
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
);

```

#### 2 using headObjectCommand to verify if an empty object s3 key is not getting stored in Postgresql ---this method is done after uploading the image to s3

### My approach --> Keep HeadObjectCommand for backend verification, especially before saving the product details in PostgreSQL. It provides an additional layer of protection.

                                 ||
                                 ||
                                 this will be done in three parts

- 1.Frontend validates the selected image.

- 2.Backend generates a presigned URL.
- 3.Frontend uploads directly to S3

```bash
const uploadResponse = await fetch(data.uploadUrl, {
  method: "PUT",
  headers: {
    "Content-Type": imageFile.type,
  },
  body: imageFile,
});

if (!uploadResponse.ok) {
  throw new Error("S3 upload failed");
}

```

, then asks the backend to verify it using HeadObjectCommand.
