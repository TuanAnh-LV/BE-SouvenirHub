// controllers/address.controller.js
const Address = require('../models/shippingAddress.model');

exports.getMyAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user_id: req.user.id });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const address = new Address({ ...req.body, user_id: req.user.id });
    await address.save();
    res.status(201).json(address);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create address' });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const updated = await Address.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Address not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update address' });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const deleted = await Address.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Address not found' });
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete address' });
  }
};

exports.getAddressById = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) return res.status(404).json({ error: 'Address not found' });
    res.json(address);
  } catch (err) {
    res.status(400).json({ error: 'Failed to fetch address' });
  }
};