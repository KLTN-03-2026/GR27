import { Request, Response } from "express";
import * as chatbotService from "../services/chatbot.service";
import { IChatHistory } from "../services/chatbot.service";

// [POST] /api/v1/chatbot
export const chat = async (req: Request, res: Response): Promise<void> => {
  const { message, history = [] } = req.body as {
    message: string;
    history: IChatHistory[];
  };

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ code: 400, message: "Tin nhắn không được để trống" });
    return;
  }

  // ── Setup SSE streaming ────────────────────────────────────────────────────
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await chatbotService.processChatMessage(
      message.trim(),
      history,
      // onChunk: stream từng đoạn text về FE
      (text: string) => sendEvent({ text }),
      // onStatus: thông báo trạng thái xử lý
      (status: string, tool?: string) => sendEvent({ status, tool })
    );

    sendEvent({ status: "done" });
    res.end();
  } catch (error) {
    console.error("[Chatbot Error]", error);
    sendEvent({ status: "error", message: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!" });
    res.end();
  }
};