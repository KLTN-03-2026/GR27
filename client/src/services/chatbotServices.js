// src/services/chatbotServices.js
// Dùng fetch thay axios vì SSE (Server-Sent Events) không hỗ trợ qua axios

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * Gửi tin nhắn đến chatbot qua SSE stream.
 *
 * @param {string} message - Tin nhắn của user
 * @param {Array}  history - Lịch sử hội thoại [{ role, parts: [{ text }] }]
 * @param {object} callbacks
 * @param {(text: string) => void}   callbacks.onChunk   - Nhận từng đoạn text stream
 * @param {(status: string, tool?: string) => void} callbacks.onStatus  - Nhận trạng thái (thinking/fetching/answering/done/error)
 * @param {(signal: AbortSignal) => void} [callbacks.onAbortRef] - Trả về AbortController để cancel
 * @returns {Promise<void>}
 */
export const sendChatMessage = async (message, history, callbacks) => {
  const { onChunk, onStatus } = callbacks;

  const controller = new AbortController();
  if (callbacks.onAbortRef) callbacks.onAbortRef(controller);

  const response = await fetch(`${API_BASE_URL}/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal: controller.signal,
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE: mỗi event kết thúc bằng "\n\n"
    const parts = buffer.split("\n\n");
    buffer = parts.pop(); // giữ phần chưa hoàn chỉnh

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;

      try {
        const json = JSON.parse(line.slice(5).trim());

        if (json.text !== undefined) {
          onChunk(json.text);
        }

        if (json.status !== undefined) {
          onStatus(json.status, json.tool);
        }
      } catch {
        // parse lỗi → bỏ qua chunk đó
      }
    }
  }
};