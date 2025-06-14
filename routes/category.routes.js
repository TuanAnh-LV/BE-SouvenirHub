// routes/category.routes.js
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");
const {
  createCategoryValidator,
  updateCategoryValidator,
} = require("../validators/category.validator");
const { validate } = require("../middlewares/validate.middleware");
/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Get all categories, optionally filter by name
 *     tags: [Categories]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Filter categories by name substring
 *     responses:
 *       200:
 *         description: List of categories
 */
router.post("/get", categoryController.getAll);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parent_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 */
router.post(
  "/",
  verifyToken,
  requireRole(["admin"]),
  createCategoryValidator,
  validate,
  categoryController.create
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parent_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put(
  "/:id",
  verifyToken,
  requireRole(["admin"]),
  updateCategoryValidator,
  validate,
  categoryController.update
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete(
  "/:id",
  verifyToken,
  requireRole(["admin"]),
  categoryController.remove
);

module.exports = router;
