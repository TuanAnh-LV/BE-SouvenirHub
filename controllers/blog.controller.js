const Blog = require("../models/blog.model");
const BlogImage = require("../models/blogImage.model");
const cloudinary = require("cloudinary").v2;
const sanitizeHtml = require("sanitize-html");
const User = require("../models/user.model"); // Assuming you have a User model

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "souvenirhub/blogs",
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

exports.createBlog = async (req, res) => {
  try {
    const cleanContent = sanitizeHtml(req.body.content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img",
        "h1",
        "h2",
        "u",
        "iframe",
      ]),
      allowedAttributes: {
        "*": ["style", "class", "href", "src", "alt", "title"],
        iframe: ["src", "allowfullscreen", "width", "height"],
      },
    });
    const blog = new Blog({
      user: req.user.id,
      title: req.body.title,
      thumbnail: req.body.thumbnail,
      content: cleanContent,
      tags: req.body.tags,
      status: req.body.status || "draft",
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error("Blog create error:", err);
    res.status(400).json({
      error: "BLOG_CREATE_FAILED",
      message: "Failed to create blog",
    });
  }
};
