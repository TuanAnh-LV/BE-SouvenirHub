const BlogImage = require("../models/blogImage.model");
const cloudinary = require("cloudinary").v2;
const Blog = require("../models/blog.model");

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

exports.uploadBlogImages = async (req, res) => {
  try {
    const { blogId } = req.params;
    const files = req.files;
    const uploadedImages = [];

    // Chỉ kiểm tra blog có tồn tại, KHÔNG kiểm tra quyền user ở đây
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (files && files.length > 0) {
      for (const file of files) {
        const result = await streamUpload(file.buffer);

        const savedImage = new BlogImage({
          blog_id: blogId,
          url: result.secure_url,
        });

        await savedImage.save();
        uploadedImages.push(savedImage);
      }
    }

    res.status(201).json(uploadedImages);
  } catch (err) {
    console.error("Upload blog image error:", err);
    res.status(500).json({ error: "Failed to upload images" });
  }
};

exports.getImagesByBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const images = await BlogImage.find({ blog_id: blogId });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch images" });
  }
};

exports.deleteImageById = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await BlogImage.findByIdAndDelete(imageId);
    if (!image) return res.status(404).json({ error: "Image not found" });
    res.json({ message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete image" });
  }
};

exports.deleteImagesByBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    await BlogImage.deleteMany({ blog_id: blogId });
    res.json({ message: "All images deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete images" });
  }
};
