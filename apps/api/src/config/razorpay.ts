import Razorpay from "razorpay";
console.log("Razorpay env check:", {
  keyId: Boolean(process.env.RAZORPAY_KEY_ID),
  keySecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
});
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    "Razorpay environment variables are missing"
  );
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export default razorpay;