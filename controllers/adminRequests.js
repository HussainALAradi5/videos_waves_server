const Request = require('../models/adminRequest')
const authService = require('../service/auth')

const createRequest = async (req, res) => {
  const userId = req.user.id
  const { reason } = req.body

  if (!reason) {
    return res.status(400).json({ message: 'Reason is required' })
  }

  try {
    const newRequest = new Request({
      requestedUserId: userId,
      dateOfRequest: new Date(),
      reason,
      isAccepted: false
    })
    await newRequest.save()
    res.status(201).json(newRequest)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error while creating request' })
  }
}

const getRequests = async (req, res) => {
  try {
    const requests = await Request.find().populate('requestedUserId')
    res.status(200).json(requests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error while fetching requests' })
  }
}

const getRequestById = async (req, res) => {
  const { requestId } = req.params

  try {
    const request = await Request.findById(requestId).populate(
      'requestedUserId'
    )
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }
    res.status(200).json(request)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error while fetching request' })
  }
}

const updateRequest = async (req, res) => {
  const { requestId } = req.params
  const { isAccepted } = req.body

  try {
    const request = await Request.findById(requestId)
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    request.isAccepted = isAccepted
    await request.save()
    res.status(200).json(request)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error while updating request' })
  }
}

const deleteRequest = async (req, res) => {
  const { requestId } = req.params

  try {
    const request = await Request.findById(requestId)
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    await request.remove()
    res.status(200).json({ message: 'Request deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error while deleting request' })
  }
}

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest
}
