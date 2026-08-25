import {Schema,model} from "mongoose";
export type UserRole="CUSTOMER" | "ORGANIZER" |"SUPER_ADMIN";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  isVerified: boolean;
}

const userSchema=new Schema<IUser>(
{
    name:{
        type:String,
        required:true,
        trim:true,
        minLength:2,
        maxLength:100,
    },
        email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["CUSTOMER", "ORGANIZER", "SUPER_ADMIN"],
      default: "CUSTOMER",
    },

    phone: {
      type: String,
      trim: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
},
{
    timestamps:true,
}
);

export const User = model<IUser>("User", userSchema);