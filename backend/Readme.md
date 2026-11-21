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

## Routes

- api/upload/upload ---> for posting the image metadata to the backend
- api/upload/verify-upload ---> for verifying whether the uploaded image is not empty

## checoutPreview

1.  first check whether user is sending an array of items or not
2.  now run a loop to check whether all the products_id and quanity is integer or not
3.  store the product id in an array
4.  fetch those items with product id from database where product_id = stored array of ids
5.  now check all the items selected is equal to the result.length
6.  now validate the stock and quantity from the database whether the stock is not empty or requested quantity does not exceeds the stock availabity or quantity is not more than the requested quantity
7.  push the selected items into checked items after validation
8.  once validation is done calculate the price of all the items and then add shipping price
9.  return all the items selected along with total price and shipping price

## how order is placed thorugh Razorpay

Step-by-step: What happens when the customer clicks Pay?

1.  — Frontend sends a request to your backend
2.  Backend creates your application order
3.  Backend sends a request to Razorpay
4.  Frontend opens Razorpay Checkout
5.  Razorpay communicates with the bank
6.  Razorpay returns payment details to the frontend
7.  Backend verifies the payment signature
8.  Backend updates PostgreSQL
9.  What if the frontend never receives the response?

- Consider this situation:

1. Customer pays successfully.
2. Razorpay processes the payment.
3. Internet connection drops.
4. Frontend never receives the success callback.
5. Your database still says PENDING.
   This is why Razorpay provides Webhooks.

A webhook is a server-to-server notification

Novacart × Razorpay
End-to-end payment architecture
Next.js Frontend

Checkout page

1. POST /api/orders/place

Express Backend

Validate cart and create ShopSphere order

2. POST Razorpay Orders API

Razorpay Server

Creates Razorpay Order ID

3. Returns Razorpay Order ID

Next.js Frontend

Opens Razorpay Checkout

4. Customer completes payment

Razorpay + Bank

Processes and returns payment result

5. Payment details returned to frontend

Next.js → Express Backend

POST /api/payment/verify

6. Verify signature and payment status

PostgreSQL 7. payment_status = PAID

order_status = CONFIRMED

Webhook provides an additional server-to-server payment notification and reconciliation path.

Customer Your Frontend Your Server Razorpay
| | | |
| 1. Start checkout | | |
|-------------------->| 2. Create order | |
| |---------------------->| 3. POST /v1/orders |
| | |--------------------->|
| | | order_id |
| |<----------------------|<---------------------|
| 4. Pay (modal) | | |
|-------------------->| 5. checkout.js opens | |
| |------------------------------------------------>|
| | OTP / bank redirect / UPI approval |
|<------------------------------------------------------------------->|
| | 6. success (handler / callback_url) |
| | (payment_id, order_id, signature) |
| |---------------------->| 7. Verify signature |
| | | 8. Capture + fulfil |
| | |--------------------->|
| | | 9. Webhook: captured |
| | |<---------------------|
