const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
dotenv.config()
const port = process.env.PORT || 5000
const db = require('./config/db')
const userRoutes = require('./routes/user')
const videoRoutes = require('./routes/video')

app.use(express.json())
app.use(cors())
const connect = db.connectDB()
app.use('/user', userRoutes)
app.use('/videos', express.static(path.join(__dirname, 'client/public/videos')))

app.use('/videos', videoRoutes)

app.listen(port, () => {
  connect
  console.log(`server start at http://localhost:${port}`)
})
