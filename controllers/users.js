const User = require('../models/user')
const authService = require('../service/auth')

const invalidData = (fields) => {
  return fields.some((field) => !field)
}

const register = async (req, res) => {
  const { userName, password, email } = req.body

  if (invalidData([userName, password, email])) {
    return res.status(400).json({ message: 'You must fill all the fields!' })
  }

  try {
    const isExist = await User.findOne({ email })
    if (isExist)
      return res.status(400).json({ message: 'User already exists!' })

    const hashed = await authService.hashPassword(password)
    const user = new User({ userName, password_digest: hashed, email })
    await user.save()
    res
      .status(201)
      .json({ message: 'User has been registered successfully 😊' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Some technical issue 😒' })
  }
}

const login = async (req, res) => {
  const { usernameOrEmail, password } = req.body

  if (!password || !usernameOrEmail) {
    return res.status(400).json({ message: 'You must fill all the fields!' })
  }

  try {
    const query = usernameOrEmail.includes('@')
      ? { email: usernameOrEmail }
      : { userName: usernameOrEmail }

    const user = await User.findOne(query)

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const isMatch = await authService.comparePassword(
      password,
      user.password_digest
    )
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const token = authService.generateToken(user)
    res.json({ token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}

const editProfile = async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Authorization denied, no token provided' })
  }

  const decoded = authService.verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  const { userName, currentPassword, newPassword, confirmPassword } = req.body

  if (!userName && !currentPassword && !newPassword) {
    return res
      .status(400)
      .json({ message: 'Provide a new username or password!' })
  }

  if (newPassword && newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ message: 'New password and confirm password do not match' })
  }

  try {
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found!' })
    }

    if (currentPassword) {
      const isMatch = await authService.comparePassword(
        currentPassword,
        user.password_digest
      )
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: 'Current password is incorrect' })
      }
    }

    if (userName) {
      user.userName = userName
    }

    if (newPassword) {
      user.password_digest = await authService.hashPassword(newPassword)
    }

    await user.save()
    res.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}

const deleteUser = async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Authorization denied, no token provided' })
  }

  const decoded = authService.verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  try {
    const user = await User.findByIdAndUpdate(decoded.id, { isActive: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found!' })
    }

    res.json({ message: 'User deactivated successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}
const getUserDetails = async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Authorization denied, no token provided' })
  }

  const decoded = authService.verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  try {
    const user = await User.findById(decoded.id).select('-password_digest')
    if (!user) {
      return res.status(404).json({ message: 'User not found!' })
    }
    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = {
  register,
  login,
  editProfile,
  deleteUser,
  getUserDetails
}
