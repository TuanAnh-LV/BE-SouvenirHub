const cloudinary = require('cloudinary').v2;
const ShopApplication = require('../models/shopApplication.model');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const streamUpload = (fileBuffer, folder, filename, type = 'raw') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: type,
        use_filename: true,
        public_id: filename
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

exports.submitApplication = async (req, res) => {
  try {
    const {
      shop_id,
      business_name,
      business_category,
      representative_name,
      email,
      phone,
      address,
      logo_url,
      tax_id,
      id_card_number
    } = req.body;

    const existing = await ShopApplication.findOne({ shop_id });
    if (existing) return res.status(400).json({ error: 'Application already submitted for this shop' });

    let idCardFrontUrl = '';
    let idCardBackUrl = '';
    let licenseFileUrl = '';

    if (req.files?.id_card_front?.[0]) {
      const result = await streamUpload(
        req.files.id_card_front[0].buffer,
        `private_docs/${shop_id}`,
        'id_card_front',
        'image'
      );
      idCardFrontUrl = result.secure_url;
    }

    if (req.files?.id_card_back?.[0]) {
      const result = await streamUpload(
        req.files.id_card_back[0].buffer,
        `private_docs/${shop_id}`,
        'id_card_back',
        'image'
      );
      idCardBackUrl = result.secure_url;
    }

    if (req.files?.license_file?.[0]) {
      const result = await streamUpload(
        req.files.license_file[0].buffer,
        `private_docs/${shop_id}`,
        'license_file',
        'raw'
      );
      licenseFileUrl = result.secure_url;
    }

    const app = new ShopApplication({
      shop_id,
      business_name,
      business_category,
      representative_name,
      email,
      phone,
      address,
      logo_url,
      tax_id,
      id_card_number,
      license_file_url: licenseFileUrl,
      id_card_front_url: idCardFrontUrl,
      id_card_back_url: idCardBackUrl,
      additional_files: [],
      status: 'pending',
      submitted_at: new Date()
    });

    await app.save();
    res.status(201).json(app);
  } catch (err) {
    console.error('Submit application error:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};



exports.getApplicationByShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const app = await ShopApplication.findOne({ shop_id: shopId });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json(app);
  } catch (err) {
    console.error('Get application error:', err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
};
