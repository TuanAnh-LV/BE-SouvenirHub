const Blog = require("../models/blog.model");
const BlogImage = require("../models/blogImage.model");
const cloudinary = require("cloudinary").v2;
const sanitizeHtml = require("sanitize-html");
const User = require("../models/user.model");

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

exports.getMyBlogs = async (req, res) => {
  try {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>getMyBlogs called');
    const blogs = await Blog.find({ user: req.user.id })
      .populate("user", "name");
    // ... tương tự đoạn trên
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: "BLOG_FETCH_MY_FAILED", message: err.message });
  }
};


exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ created_at: -1 })
      .populate("user", "name");
    // Lấy images cho từng blog
    const blogIds = blogs.map((b) => b._id);
    const images = await BlogImage.find({ blog_id: { $in: blogIds } });
    const blogsWithImages = blogs.map((blog) => {
      const blogImages = images.filter(
        (img) => img.blog_id.toString() === blog._id.toString()
      );
      return { ...blog.toObject(), images: blogImages };
    });
    res.json(blogsWithImages);
  } catch (err) {
    res.status(500).json({ error: "BLOG_FETCH_FAILED", message: err.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("user", "name");
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    const images = await BlogImage.find({ blog_id: blog._id });
    res.json({ ...blog.toObject(), images });
  } catch (err) {
    res.status(500).json({ error: "BLOG_FETCH_FAILED", message: err.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    // Chỉ cho phép người tạo blog update
    if (blog.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Bạn không có quyền sửa blog này" });
    }

    const cleanContent = req.body.content
      ? sanitizeHtml(req.body.content, {
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
        })
      : undefined;

    const updateData = {
      ...req.body,
      ...(cleanContent && { content: cleanContent }),
    };

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json(updatedBlog);
  } catch (err) {
    res.status(400).json({ error: "BLOG_UPDATE_FAILED", message: err.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    // Chỉ cho phép người tạo blog xóa
    if (blog.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Bạn không có quyền xóa blog này" });
    }

    await Blog.findByIdAndDelete(req.params.id);
    await BlogImage.deleteMany({ blog_id: req.params.id });
    res.json({ message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ error: "BLOG_DELETE_FAILED", message: err.message });
  }
};

