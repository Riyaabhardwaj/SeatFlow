import { User } from "../users/user.model.js";
import { comparePassword, hashPassword } from "./auth.utils.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "./auth.tokens.js";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await User.findOne({
    email: input.email,
  });

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    phone: input.phone,
    role: "CUSTOMER",
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isVerified: user.isVerified,
  };
}

export async function loginUser(input: LoginInput) {
  // passwordHash has select: false in the User schema,
  // so we explicitly include it for password verification.
  const user = await User.findOne({
    email: input.email,
  }).select("+passwordHash");

  // Don't reveal whether the email exists.
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await comparePassword(
    input.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  // Generate a short-lived access token.
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  // Generate a longer-lived refresh token.
  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
    },

    accessToken,

    refreshToken,
  };
}