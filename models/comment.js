const mongoose = require('mongoose')
const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    },
    comment: { type: String }
  },
  { timestamps: true }
)
const model = mongoose.model('Comment', commentSchema)
const Comment = model
module.exports = Comment
