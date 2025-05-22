const querystring = require('qs');
const crypto = require('crypto');
const Payment = require('../models/payment.model');
const Order = require('../models/order.model');
const TransactionMap = require('../models/transactionMap.model');

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

exports.createVnpayPayment = async (req, res) => {
  try {
    const { order_id } = req.body;
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;
    const date = new Date();
    const createDate = date.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
    const txnRef = `${Date.now()}`;
    const amount = Math.round(order.total_price * 100);

    await TransactionMap.create({ txn_ref: txnRef, order_id });

    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ipAddr = rawIp === '::1' ? '127.0.0.1' : rawIp;

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: 'Thanh toan don hang',
      vnp_OrderType: 'other',
      vnp_Amount: amount.toString(),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    };

    const orderedParams = sortObject(vnp_Params);
    const signData = querystring.stringify(orderedParams, { encode: false });
    const signed = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');
    orderedParams.vnp_SecureHash = signed;

    const payUrl = `${vnpUrl}?${querystring.stringify(orderedParams, { encode: true })}`;

    console.log('--- [DEBUG CREATE VNPAY] ---');
    console.log('Raw data to hash:', signData);
    console.log('Local hash       :', signed);
    console.log('Full payUrl      :', payUrl);

    res.json({ payUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create VNPay payment', detail: err.message });
  }
};

exports.vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const secretKey = process.env.VNP_HASH_SECRET;
    const signData = querystring.stringify(sortObject(vnp_Params), { encode: false });
    const checkHash = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('=== VNPay RETURN DEBUG ===');
    console.log('Raw data to sign:', signData);
    console.log('Local hash       :', checkHash);
    console.log('VNPay sent hash  :', secureHash);

    if (vnp_Params.vnp_ResponseCode === '00') {
      return res.send('<h2> Thanh toán thành công!</h2><p>Đơn hàng của bạn đã được tiếp nhận.</p>');
    } else {
      return res.send('<h2> Thanh toán thất bại.</h2><p>Vui lòng thử lại hoặc chọn phương thức khác.</p>');
    }    
  } catch (err) {
    res.status(500).send('Xử lý thất bại');
  }
};
exports.vnpayNotify = async (req, res) => {
  try {
    const vnp_Params = req.body;
    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const secretKey = process.env.VNP_HASH_SECRET;
    const signData = querystring.stringify(sortObject(vnp_Params), { encode: false });
    const checkHash = crypto.createHmac('sha512', secretKey)
      .update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log('=== VNPay SIGNATURE DEBUG ===');
    console.log('Raw data to sign:', signData);
    console.log('Local generated hash:', checkHash);
    console.log('VNPay sent hash     :', secureHash);

    if (secureHash === checkHash && vnp_Params.vnp_ResponseCode === '00') {
      const txn = await TransactionMap.findOne({ txn_ref: vnp_Params.vnp_TxnRef });
      if (!txn) return res.status(404).send('Transaction not found');

      const order = await Order.findById(txn.order_id);
      if (!order) return res.status(404).send('Order not found');

      const existing = await Payment.findOne({ order_id: order._id });
      if (!existing) {
        const payment = new Payment({
          order_id: order._id,
          amount: vnp_Params.vnp_Amount / 100,
          payment_method: 'vnpay',
          status: 'paid',
          paid_at: new Date()
        });
        await payment.save();
        order.status = 'paid';
        await order.save();
      }
      return res.status(200).send('OK');
    } else {
      return res.status(400).send('INVALID HASH or FAILED PAYMENT');
    }
  } catch (err) {
    console.error('VNPay Notify Error:', err);
    return res.status(500).send('ERROR');
  }
};
