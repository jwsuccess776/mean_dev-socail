const mkdirp = require('mkdirp')
const extractFrames = require('ffmpeg-extract-frames')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')

const convertFile = ({ user, stream }) => {
  return new Promise((resolve, reject) => {
    ffmpeg(fs.createReadStream(`public/temp_videos/${user}/${stream}.webm`))
      .outputFormat('mp4')
      .saveToFile(`public/temp_videos/${user}/${stream}.mp4`, (stdout, stderr) => {
        console.log('file has been converted succesfully')
      })
      .on('error', err => {
        console.log('Error converting', err)
        return reject(err)
      })
      .on('progress', (progress) => {
        console.log('Processing: ' + progress.targetSize + ' KB converted');
      })
      .on('end', done => {
        fs.unlinkSync(`public/temp_videos/${user}/${stream}.webm`)
        resolve(true)
      })
  })
}

const extractVideoThumbnail = ({ user, stream, conversion }) => {
  return new Promise((resolve, reject) => {
    extractFrames({
      input: `public/temp_videos/${user}/${stream}.mp4`,
      output: `public/temp_videos/${user}/${stream}.jpg`,
      offsets: [
        5000
      ]
    })
      .then(async frame => {
        resolve(frame)
      })
      .catch(async e => {
        resolve(false)
      })
  })

}

module.exports = {
  convertFile,
  extractVideoThumbnail
}