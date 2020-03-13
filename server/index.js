// config should be imported before importing any other file
const config = require('./config/config');
const app = require('./config/express');
require('./config/mongoose');
const connectionHelper = require('./helpers/online-user.helper')
const http = require('http').Server(app)
const io = require('socket.io')(http)
const videoUploadHelper = require('./helpers/s3.helper')

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {

  io.on('connection', (socket) => {
    socket.on('connection-data', async data => {
      const connection = await connectionHelper.connected(data._id, socket.id)
      const { firstName, lastName, avatar, email, socketID, _id } = connection
      io.sockets.connected[socket.id].user = { firstName, lastName, avatar, email, socket: socketID, _id }
      io.emit(`user-connected-${connection._id}`, { user: connection })
    })
    socket.on('disconnect', async () => {
      const disconnection = await connectionHelper.disconnected(socket.id)
      if (socket.streamOptions && socket.streamOptions.isLiveStreaming) {
        const { stream, channel, user, video } = socket.streamOptions
        videoUploadHelper.uploadStreamToS3({ stream, channel, user, video })
      }
      if (disconnection) {
        io.emit(`user-disconnected-${disconnection._id}`, { user: disconnection })
      }
    })

    socket.on('friend-request-sent', data => {
      const { recipient, requester } = data
      const recepientConnection = Object.values(io.sockets.connected).map(connection => connection.user).filter(user => !!(user && user._id == recipient))[0]
      if (recepientConnection)
        io.emit(`friend-request-recieved-${recepientConnection.socket}`, { requester })
    })

    socket.on('friend-request-accepted', data => {
      const { recipient, requester } = data
      const requesterConnection = Object.values(io.sockets.connected).map(connection => connection.user).filter(user => !!(user && user._id == requester))[0]

      if (requesterConnection)
        io.emit(`friend-request-accepted-${requesterConnection.socket}`, { recipient })
    })

    socket.on('friend-message-sent', data => {
      const { recipient, requester } = data
      const recepientConnection = Object.values(io.sockets.connected).map(connection => connection.user).filter(user => !!(user && user._id == recipient))[0]
      if (recepientConnection)
        io.emit(`friend-message-recieved-${recepientConnection.socket}`, { requester })
    })

    socket.on('stream-data-started', async data => {
      const { stream, channel, user } = data
      socket.streamOptions = {
        isLiveStreaming: true,
        stream, channel, user
      }
      const video = await videoUploadHelper.createVideoRecord({ stream, channel, user })
      socket.streamOptions.video = video.id
    })

    socket.on('stream-data-available', data => {
      const { buffer } = data
      const { stream, channel, user } = socket.streamOptions
      videoUploadHelper.appendToVideoFile({ buffer, stream, channel, user })
    })

    socket.on('maintenance-mode', data => {
      io.emit(`maintenance-mode`, { data })
    })

  })

  http.listen(config.port, () => {
    console.info(`server started on port ${config.port} (${config.env})`);
  });
}

module.exports = app;
