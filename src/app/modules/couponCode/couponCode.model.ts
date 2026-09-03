import { Schema, model } from "mongoose";
import { TCouponCode } from "./couponCode.interface";

const CouponCodeSchema = new Schema<TCouponCode>(
  {
    code: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CouponCode = model<TCouponCode>("CouponCode", CouponCodeSchema);

export default CouponCode;
