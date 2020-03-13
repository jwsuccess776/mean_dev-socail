const express = require('express')
const router = express.Router()
const userCtrl = require('../controllers/user.controller')

module.exports = router

router.get('/search', userCtrl.searchUsers)
router.get('/:id', userCtrl.getUserById)
router.post('/get-user-by-email', userCtrl.getUserByEmail)
router.get('/:id/videos', userCtrl.getUserVideos)