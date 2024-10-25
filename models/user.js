const mongoose = require('mongoose')
const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true
    },
    email: { type: String, required: true, unique: true },
    password_digest: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    isActive: {
      type: Boolean,
      default: true
    },
    image: {
      type: String
    }
  },
  { timestamps: true }
)
const model = mongoose.model('User', userSchema)
const User = model
module.exports = User
