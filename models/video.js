const mongoose = require('mongoose')
const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
      }
    ],
    numberOfLikes: { type: Number, default: 0 },
    numberOfViews: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
)
const model = mongoose.model('Video', videoSchema)
const Video = model
module.exports = Video
