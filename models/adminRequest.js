const mongoose = require('mongoose')
const adminRequestSchema = new mongoose.Schema(
  {
    requestedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateOfRequest: { type: Date, default: Date.now },
    reason: {
      type: String,
      required: true
    },
    isAccepted: { type: Boolean }
  },
  { timestamps: true }
)
const model = mongoose.model('Request', adminRequestSchema)
const Request = model
module.exports = Request
