// controllers/payment.controller.js
const Payment = require('../models/payment.model');
const Order = require('../models/order.model');
const crypto = require('crypto');
const axios = require('axios');

const MOMO_ENDPOINT = 'https://test-payment.momo.vn/gw_payment/transactionProcessor';
const partnerCode = process.env.MOMO_PARTNER_CODE ;
const accessKey = process.env.MOMO_ACCESS_KEY ;
const secretKey = process.env.MOMO_SECRET_KEY ;
const redirectUrl = process.env.MOMO_REDIRECT_URL ;
const ipnUrl = process.env.MOMO_IPN_URL ;
const requestType = 'captureMoMoWallet';

exports.mockPay = async (req, res) => {
  try {
    const { order_id } = req.body;
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const payment = new Payment({
      order_id,
      amount: parseFloat(order.total_price.toString()),
      payment_method: 'COD',
      status: 'paid',
      paid_at: new Date()
    });

    await payment.save();

    order.status = 'pending';
    await order.save();

    res.json({ message: 'Payment completed (COD)', payment });
  } catch (err) {
    console.error('Error in mockPay:', err);
    res.status(400).json({ error: 'Failed to process payment' });
  }
};


exports.processOnlinePayment = async (req, res) => {
  try {
    const { order_id, method, real_amount } = req.body;
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const payment = new Payment({
      order_id,
      amount: real_amount,
      payment_method: method,
      status: 'paid',
      paid_at: new Date()
    });
    await payment.save();
    order.status = 'paid';
    await order.save();
    res.json({ message: 'Payment recorded successfully', payment });
  } catch (err) {
    res.status(400).json({ error: 'Failed to process online payment' });
  }
};

exports.createPayOSPayment = async (req, res) => {
  try {
    const { amount, orderCode, description, returnUrl, cancelUrl } = req.body;
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    // Tạo chuỗi data theo đúng thứ tự alphabet
    const data = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    // Tạo signature
    const signature = crypto
      .createHmac('sha256', checksumKey)
      .update(data)
      .digest('hex');

    const response = await axios.post('https://api-merchant.payos.vn/v2/payment-requests', {
      amount,
      orderCode,
      description,
      returnUrl,
      cancelUrl,
      signature
    }, {
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Tạo thanh toán thất bại', error: error.message });
  }
};

exports.createMomoPayment = async (req, res) => {
  try {
    const { order_id } = req.body;
    const order = await Order.findById(order_id);
    if (!order_id) return res.status(400).json({ error: 'order_id is required' });

    const requestId = `${partnerCode}-${Date.now()}`;
    const orderInfo = `Thanh toán đơn hàng ${order_id}`;
    const amount = parseFloat(order.total_price.toString());
    if (parseFloat(amount) !== parseFloat(order.total_price)) {
      return res.status(400).end();
    }
    

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${order_id}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: amount.toString(),
      orderId: order_id,
      orderInfo,
      returnUrl: redirectUrl,
      notifyUrl: ipnUrl,
      requestType,
      extraData: '',
      signature
    };

    const response = await axios.post(MOMO_ENDPOINT, requestBody);
    res.json({ payUrl: response.data.payUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Momo payment', detail: err.message });
  }
};

exports.handleMomoReturn = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      resultCode,
      message
    } = req.query;

    if (resultCode === '0') {
      return res.send('Thanh toán MoMo thành công. Cảm ơn bạn!');
    } else {
      return res.send(`Thanh toán thất bại: ${message}`);
    }
  } catch (err) {
    return res.status(500).send('Xử lý lỗi khi trở về từ Momo');
  }
};

exports.handleMomoNotify = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      resultCode,
      signature,
      requestId,
      orderInfo,
      responseTime,
      transId,
      payType,
      orderType
    } = req.body;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (resultCode === 0 && signature === expectedSignature) {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).end();

      const payment = new Payment({
        order_id: orderId,
        amount,
        payment_method: 'momo',
        status: 'paid',
        paid_at: new Date()
      });
      await payment.save();
      order.status = 'paid';
      await order.save();
      return res.status(200).end();
    } else {
      return res.status(400).end();
    }
  } catch (err) {
    return res.status(500).end();
  }
};


exports.handlePayOS = async (req, res) => {
  try {
    const data = req.body.data || {};
    const orderCode = data.orderCode;
    const payosCode = data.code;
    const payosSuccess = req.body.success;

    // Log để debug mọi trường hợp
    console.log("Webhook received (cancel test):", JSON.stringify(req.body));

    let status;
    if (payosCode === "00" && payosSuccess === true) {
      status = "PAID";
    } else if (payosCode !== "00" || payosSuccess === false) {
      status = "CANCELLED"; // hoặc "FAILED" tùy ý bạn
    } else {
      status = "UNKNOWN";
    }

    const order = await Order.findOne({ order_code: orderCode });
    if (order) {
      if (status === "PAID") {
        order.status = "processing";
      } else if (status === "CANCELLED") {
        order.status = "cancelled";
      }
      await order.save();
      console.log("Order updated:", order);
    } else {
      console.log("Order not found with order_code:", orderCode);
    }

    res.status(200).json({ message: "Webhook received" });
  } catch (err) {
    console.error("PayOS webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};