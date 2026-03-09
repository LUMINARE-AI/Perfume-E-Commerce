import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import bcrypt from "bcryptjs";

export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user, "User profile fetched")
  );
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (name) req.user.name = name;
  if (email) req.user.email = email;

  await req.user.save();

  return res.status(200).json(
    new ApiResponse(200, req.user, "Profile updated")
  );
});

export const getAddress = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user.address || null, "Address fetched")
  );
});

export const updateAddress = asyncHandler(async (req, res) => {
  req.user.address = req.body;
  await req.user.save();

  return res.status(200).json(
    new ApiResponse(200, req.user.address, "Address updated")
  );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const isMatch = await bcrypt.compare(oldPassword, req.user.password);
  if (!isMatch) {
    throw new ApiError(400, "Old password is incorrect");
  }

  req.user.password = newPassword;
  await req.user.save();

  return res.status(200).json(
    new ApiResponse(200, null, "Password changed successfully")
  );
});

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if ([name, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
          role: loggedInUser.role  // ✅ Send role to frontend
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const RefreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;

  if (newPassword !== confPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  if (newPassword === oldPassword) {
    throw new ApiError(400, "New password cannot be the same as old password");
  }

  if (
    [oldPassword, newPassword, confPassword].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "User fetched successfully");
})

const forgotPassword = async (req, res) => {
  let user;

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const htmlMessage = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Georgia, 'Times New Roman', serif;
            background-color: #0a0a0a;
            color: #e0e0e0;
          }
          .wrapper {
            max-width: 580px;
            margin: 30px auto;
            background-color: #111111;
            border: 1px solid #2a2a2a;
          }
          .top-accent {
            height: 2px;
            background: linear-gradient(to right, transparent, #D4AF37, transparent);
          }
          .header {
            padding: 40px 40px 30px;
            text-align: center;
            border-bottom: 1px solid #1e1e1e;
          }
          .brand {
            font-size: 28px;
            letter-spacing: 0.2em;
            color: #D4AF37;
            font-family: Georgia, serif;
          }
          .brand-sub {
            font-size: 10px;
            letter-spacing: 0.4em;
            color: #666;
            margin-top: 4px;
            text-transform: uppercase;
          }
          .content {
            padding: 36px 40px;
          }
          .content p {
            font-size: 14px;
            line-height: 1.8;
            color: #aaa;
            margin-bottom: 16px;
            font-family: 'Segoe UI', Arial, sans-serif;
          }
          .content p.greeting {
            color: #e0e0e0;
            font-size: 15px;
          }
          .divider {
            height: 1px;
            background: #1e1e1e;
            margin: 24px 0;
          }
          .button-wrap {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 40px;
            background-color: #D4AF37;
            color: #000000;
            text-decoration: none;
            font-size: 12px;
            font-family: 'Segoe UI', Arial, sans-serif;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            font-weight: 600;
          }
          .warning {
            background: #1a1500;
            border-left: 3px solid #D4AF37;
            padding: 14px 16px;
            margin: 20px 0;
            font-size: 13px;
            color: #bba040;
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
          }
          .url-text {
            word-break: break-all;
            font-size: 12px;
            color: #D4AF37;
            font-family: monospace;
            background: #0d0d0d;
            padding: 12px;
            border: 1px solid #1e1e1e;
            margin-top: 8px;
            line-height: 1.6;
          }
          .footer {
            border-top: 1px solid #1e1e1e;
            padding: 24px 40px;
            text-align: center;
          }
          .footer p {
            font-size: 11px;
            color: #444;
            font-family: 'Segoe UI', Arial, sans-serif;
            letter-spacing: 0.05em;
            line-height: 1.8;
          }
          .bottom-accent {
            height: 1px;
            background: linear-gradient(to right, transparent, #D4AF37, transparent);
            opacity: 0.3;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="top-accent"></div>

          <div class="header">
            <div class="brand">BinKhalid</div>
            <div class="brand-sub">Parfumerie de Luxe</div>
          </div>

          <div class="content">
            <p class="greeting">Hello,</p>
            <p>
              We received a request to reset the password associated with your
              BinKhalid account. If this was you, click the button below to set
              a new password.
            </p>

            <div class="button-wrap">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>

            <div class="warning">
              ⏳ &nbsp;This link will expire in <strong>15 minutes</strong>. Please reset your password promptly.
            </div>

            <div class="divider"></div>

            <p>If the button above doesn't work, copy and paste the link below into your browser:</p>
            <div class="url-text">${resetUrl}</div>

            <div class="divider"></div>

            <p>
              If you did not request a password reset, you can safely ignore
              this email. Your password will remain unchanged and your account
              is secure.
            </p>
            <p>
              For any concerns, feel free to reach out to our support team.
            </p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} BinKhalid. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>

          <div class="bottom-accent"></div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: "Password Reset Request — BinKhalid",
      html: htmlMessage,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email successfully!",
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    // Cleanup tokens if email fails
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json({
      success: false,
      message: "Failed to send password reset email. Please try again later.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Password is required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Hash token from URL
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful! Please login with your new password."
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password"
    });
  }
};


export {
  registerUser,
  loginUser,
  logoutUser,
  RefreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  forgotPassword,
  resetPassword
};
