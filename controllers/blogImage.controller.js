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

    // Kiểm tra blog có tồn tại không
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Kiểm tra quyền user
    if (blog.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
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
