import { PayOS } from "@payos/node";

// ✅ Khởi tạo PayOS client với config mới (v2.x)
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID!,
  apiKey: process.env.PAYOS_API_KEY!,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
  // Optional: Có thể thêm các options khác
  // partnerCode: process.env.PAYOS_PARTNER_CODE,
  // timeout: 30000,
  // maxRetries: 3,
  // logLevel: 'info',
});

/**
 * ✅ Tạo payment link (v2.x API)
 */
export const createPaymentLink = async (
  orderCode: number,
  amount: number,
  description: string,
  returnUrl: string,
  cancelUrl: string
) => {
  try {
    const paymentData = {
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl,
    };

    // ✅ Sử dụng paymentRequests.create() thay vì paymentRequests.create()
    const paymentLinkRes = await payos.paymentRequests.create(paymentData);
    return paymentLinkRes;
  } catch (error) {
    console.error("PayOS createPaymentLink error:", error);
    throw error;
  }
};

/**
 * ✅ Verify webhook data (v2.x API)
 * @param webhookData - Data nhận từ webhook endpoint
 * @returns Verified webhook data hoặc null nếu signature không hợp lệ
 */
export const verifyPaymentWebhookData = async (webhookData: any) => {
  try {
    // ✅ Sử dụng webhooks.verify() để verify và nhận data
    const verifiedData = await payos.webhooks.verify(webhookData);
    return verifiedData;
  } catch (error) {
    console.error("PayOS verifyPaymentWebhookData error:", error);
    // ✅ Trả về null thay vì false để phân biệt lỗi và invalid signature
    return null;
  }
};

/**
 * ✅ Lấy thông tin payment link (v2.x API)
 */
export const getPaymentLinkInformation = async (orderCode: number) => {
  try {
    // ✅ Sử dụng paymentRequests.get() với orderCode
    const paymentInfo = await payos.paymentRequests.get(orderCode);
    return paymentInfo;
  } catch (error) {
    console.error("PayOS getPaymentLinkInformation error:", error);
    throw error;
  }
};

/**
 * ✅ Hủy payment link (v2.x API)
 */
export const cancelPaymentLink = async (
  orderCode: number,
  cancellationReason?: string
) => {
  try {
    // ✅ Sử dụng paymentRequests.cancel()
    const result = await payos.paymentRequests.cancel(
      orderCode,
      cancellationReason
    );
    return result;
  } catch (error) {
    console.error("PayOS cancelPaymentLink error:", error);
    throw error;
  }
};

/**
 * ✅ NEW: Đăng ký webhook endpoint (v2.x feature)
 * Chỉ cần gọi 1 lần khi setup
 */
export const registerWebhook = async (webhookUrl: string) => {
  try {
    const confirmResult = await payos.webhooks.confirm(webhookUrl);
    return confirmResult;
  } catch (error) {
    console.error("PayOS registerWebhook error:", error);
    throw error;
  }
};

/**
 * ✅ NEW: Tạo signature thủ công nếu cần (v2.x feature)
 */
export const createSignature = async (data: any) => {
  try {
    const signature = await payos.crypto.createSignatureFromObj(
      data,
      process.env.PAYOS_CHECKSUM_KEY!
    );
    return signature;
  } catch (error) {
    console.error("PayOS createSignature error:", error);
    throw error;
  }
};

// ✅ Export PayOS client instance để sử dụng trực tiếp nếu cần
export default payos;