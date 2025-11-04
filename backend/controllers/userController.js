import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// Create a new user
export const createUser = async (req, res) => {
  const { name, email, password, department, designation, role,slackId} = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: "Email already exists." });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    department,
    designation,
    role,
    slackId
  });
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

  const token = jwt.sign({ id: newUser._id, role: newUser.role, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: "1d" });

  res.cookie("token", token, {
    httpOnly: true,       // JS cannot access
    sameSite: "lax",
    secure: false,   // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });



  await newUser.save();
  res.status(201).json({ message: "User registered successfully" });

};

// login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid email or password" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

  const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "1d" });
  // req.cookies.token = token;

  res.cookie("token", token, {
    httpOnly: false,
    sameSite: "lax",
secure: false,
    maxAge: 24 * 60 * 60 * 1000,
  });

  console.log("Created JWT:", token);

  res.json({ message: "Login successful" });
// server login response
// res
//   .cookie("token", token, { httpOnly: true })
//   .json({ role: user.role, name: user.name }); // send minimal info

}

//Get All Users
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
}

export const getUserProfile = async (req, res) => {
  const requestedUserId = req.params.id; // from URL
  const loggedInUser = req.user; // from token

  try {
    // Developers can only fetch their own profile
    if (loggedInUser.role !== "Admin" && requestedUserId !== loggedInUser.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(requestedUserId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// edit user
export const editUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, department, designation, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, department, designation, role },
      { new: true }
    ).select("-password");
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Save new password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false, // allow http for dev
    sameSite: "lax",
    path: "/", // must match the cookie path
  });
  res.json({ message: "Logged out successfully" });
};
