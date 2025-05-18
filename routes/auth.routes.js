// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 */
router.post('/login', authController.login);


router.post('/google-login', authController.googleLogin);
/**
 * @swagger
 * /api/auth/google-login:
 *   post:
 *     summary: Login with Google
 */
module.exports = router;
