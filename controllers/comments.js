const Comment = require('../models/comment')

const addComment = async (req, res) => {
  const { id } = req.params
  const { comment } = req.body
  const userId = req.user.id

  if (!comment) {
    return res.status(400).json({ message: 'Comment cannot be empty' })
  }

  try {
    const newComment = new Comment({ userId, id, comment })
    await newComment.save()

    res.status(201).json(newComment)
  } catch (error) {
    console.error('Error saving comment:', error)
    res.status(500).json({ error: 'Server error while adding comment' })
  }
}

const getCommentsByVideo = async (req, res) => {
  const { videoId } = req.params

  try {
    const comments = await Comment.find({ videoId }).populate('userId')
    res.status(200).json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    res.status(500).json({ error: 'Server error while fetching comments' })
  }
}

const editComment = async (req, res) => {
  const { commentId } = req.params
  const { comment } = req.body
  const userId = req.user.id

  if (!comment) {
    return res.status(400).json({ message: 'Comment cannot be empty' })
  }

  try {
    const existingComment = await Comment.findById(commentId)
    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    if (existingComment.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to edit this comment' })
    }

    existingComment.comment = comment
    await existingComment.save()
    res.status(200).json(existingComment)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error while editing comment' })
  }
}

const removeComment = async (req, res) => {
  const { commentId } = req.params
  const userId = req.user.id

  try {
    const existingComment = await Comment.findById(commentId)
    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    if (existingComment.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to delete this comment' })
    }

    await Comment.deleteOne({ _id: commentId })
    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error while deleting comment' })
  }
}

module.exports = {
  addComment,
  getCommentsByVideo,
  editComment,
  removeComment
}
