const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  refreshToken,
  logout
} = require('../controllers/authControllerSupabase');
const { protectSupabase } = require('../middleware/supabase-auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           description: The user's email
 *         password:
 *           type: string
 *           description: The user's password
 *         firstName:
 *           type: string
 *           description: The user's first name
 *         lastName:
 *           type: string
 *           description: The user's last name
 *         phone:
 *           type: string
 *           description: The user's phone number
 *         role:
 *           type: string
 *           description: The user's role (user, lawyer, admin)
 *           enum: [user, lawyer, admin]
 *       example:
 *         id: d5fE_asz
 *         email: john.doe@example.com
 *         password: password123
 *         firstName: John
 *         lastName: Doe
 *         phone: +1234567890
 *         role: user
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: The user's password (min 6 characters)
 *               firstName:
 *                 type: string
 *                 description: The user's first name
 *               lastName:
 *                 type: string
 *                 description: The user's last name
 *               phone:
 *                 type: string
 *                 description: The user's phone number
 *               role:
 *                 type: string
 *                 enum: [user, lawyer, admin]
 *                 default: user
 *                 description: The user's role
 *             example:
 *               email: john.doe@example.com
 *               password: password123
 *               firstName: John
 *               lastName: Doe
 *               phone: +1234567890
 *               role: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - User already exists or invalid data
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email
 *               password:
 *                 type: string
 *                 description: The user's password
 *             example:
 *               email: john.doe@example.com
 *               password: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', protectSupabase, getMe);
router.put('/profile', protectSupabase, updateProfile);
router.post('/logout', protectSupabase, logout);

module.exports = router;
