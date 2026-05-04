// src/components/Chatbot/index.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  RobotOutlined,
  SendOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { sendChatMessage } from "../../services/chatbotServices";
import "./Chatbot.scss";

// ── Markdown-lite renderer ────────────────────────────────────────────────────
//
// VẤN ĐỀ STREAMING: Gemini stream link Markdown theo từng chunk nhỏ, ví dụ:
//   chunk 1 → "xem tại đây: [Vận May](http://localhost:3000/films"
//   chunk 2 → "/van-may)"
//
// Khi renderMarkdown chạy sau chunk 1, regex link Markdown chưa match (thiếu ")"),
// nhưng regex URL thuần lại bắt được "http://localhost:3000/films" và bọc vào <a>.
// Sau đó chunk 2 gắn thêm "/van-may)" vào → HTML bị vỡ thành:
//   http://localhost:3000/films/van-may)" class="chatbot-link">...
//
// FIX: Trước khi escape + render, tách phần "đuôi chưa hoàn chỉnh" ra khỏi text.
// Phần đuôi là bất kỳ chuỗi nào trông như link Markdown đang dở (có "[" hoặc "](")
// chưa đóng ")". Phần đó được giữ nguyên dạng text, không đưa vào pipeline render.
// Khi chunk tiếp theo đến, fullBotText đã đủ → render lại toàn bộ → link hoàn chỉnh.

const splitIncompleteMarkdownLink = (text) => {
  // Tìm vị trí xuất hiện cuối cùng của "[" chưa có "](" hoàn chỉnh phía sau
  // hoặc đang có "](" nhưng chưa có ")" đóng
  const incompletePattern = /(\[[^\]]*$|\[[^\]]*\]\([^)]*$)/;
  const match = text.match(incompletePattern);
  if (!match) return { safe: text, tail: "" };
  const idx = text.lastIndexOf(match[0]);
  return {
    safe: text.slice(0, idx),
    tail: text.slice(idx),
  };
};

const renderMarkdown = (text) => {
  if (!text) return "";

  // Tách phần link đang stream dở ra — phần đó không render, giữ nguyên
  const { safe, tail } = splitIncompleteMarkdownLink(text);

  const processSegment = (raw) => {
    const escaped = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Link Markdown hoàn chỉnh [label](url) — phân biệt nội bộ vs ngoài
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        (_, label, href) => {
          const isInternal =
            href.startsWith(window.location.origin) ||
            href.startsWith(
              process.env.REACT_APP_CLIENT_URL || window.location.origin
            );
          if (isInternal) {
            return `<a href="${href}" class="chatbot-link">${label}</a>`;
          }
          return `<a href="${href}" class="chatbot-link" target="_blank" rel="noopener noreferrer">${label}</a>`;
        }
      )
      // URL thuần — lookbehind chặt hơn: không bắt URL đã nằm trong href="..."
      // (tức là sau khi link Markdown đã được render thành thẻ <a> ở bước trên)
      .replace(
        /(?<!href=")(?<!\()(?<!\]\()(https?:\/\/[^\s<"&]+)/g,
        '<a href="$1" class="chatbot-link" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      .replace(/\n/g, "<br/>");
  };

  // Phần safe: render bình thường
  // Phần tail: escape HTML rồi nối thẳng vào (hiển thị text thô trong khi chờ)
  const renderedSafe = processSegment(safe);
  const escapedTail = tail
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  return renderedSafe + escapedTail;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const WELCOME_MSG = {
  id: "welcome",
  role: "bot",
  text: "Xin chào! Tôi là **Movix Assistant** 🎬\n\nTôi có thể giúp bạn:\n- Tìm phim theo thể loại, diễn viên\n- Xem lịch chiếu, rạp gần bạn\n- Hướng dẫn đặt vé\n\nBạn muốn biết gì nào?",
};

const QUICK_SUGGESTIONS = [
  "Phim hành động hay nhất",
  "Lịch chiếu hôm nay",
  "Cách đặt vé",
  "Phim kinh dị đang chiếu",
];

// statusText chỉ dùng cho trạng thái "Đang trả lời..." và "Đang tra cứu..."
// Trạng thái "thinking" sẽ hiển thị trực tiếp trong bubble của bot
const STATUS_TEXT = {
  fetching: "Đang tìm kiếm dữ liệu...",
  answering: "Đang trả lời...",
};

// ── Component ─────────────────────────────────────────────────────────────────
const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [history, setHistory] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusText, setStatusText] = useState("");
  // isThinking: true khi đang ở giai đoạn "suy nghĩ" — hiển thị trong bubble
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const streamingMsgIdRef = useRef(null);

  // ── Resize state ────────────────────────────────────────────────────────────
  const windowRef = useRef(null);
  const resizeRef = useRef({
    active: false,
    direction: null, // "left" | "top"
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  // Auto scroll xuống cuối
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  // ── Xử lý click link nội bộ bên trong dangerouslySetInnerHTML ──────────────
  // Vì chatbot dùng dangerouslySetInnerHTML, React Router không bắt được
  // sự kiện click trên thẻ <a> được inject. Ta dùng event delegation để
  // intercept click và dùng useNavigate — không reload trang, giữ nguyên
  // lịch sử chat.
  const handleBubbleClick = useCallback((e) => {
    const anchor = e.target.closest("a.chatbot-link");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    try {
      const url = new URL(href);
      if (url.origin === window.location.origin) {
        // Link nội bộ → navigate SPA, không reload
        e.preventDefault();
        navigate(url.pathname + url.search + url.hash);
      }
      // Link ngoài → để trình duyệt xử lý (target="_blank")
    } catch {
      // href không hợp lệ → bỏ qua
    }
  }, [navigate]);

  // ── Resize handlers ─────────────────────────────────────────────────────────
  const startResize = useCallback((e, direction) => {
    e.preventDefault();
    const el = windowRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    resizeRef.current = {
      active: true,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    };

    const onMove = (moveEvent) => {
      if (!resizeRef.current.active) return;
      const { direction, startX, startY, startWidth, startHeight } = resizeRef.current;

      if (direction === "left") {
        const dx = startX - moveEvent.clientX; // kéo sang trái → tăng width
        const newWidth = Math.min(
          Math.max(startWidth + dx, 280),
          680
        );
        el.style.width = newWidth + "px";
      } else if (direction === "top") {
        const dy = startY - moveEvent.clientY; // kéo lên → tăng height
        const newHeight = Math.min(
          Math.max(startHeight + dy, 360),
          window.innerHeight * 0.85
        );
        el.style.height = newHeight + "px";
      }
    };

    const onUp = () => {
      resizeRef.current.active = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = direction === "left" ? "ew-resize" : "ns-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  // ── Gửi tin nhắn ───────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text) => {
      const trimmed = (text ?? inputText).trim();
      if (!trimmed || isStreaming) return;

      setInputText("");

      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", text: trimmed },
      ]);

      // Thêm tin nhắn bot rỗng (sẽ stream vào đây)
      const botMsgId = `bot-${Date.now()}`;
      streamingMsgIdRef.current = botMsgId;
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, role: "bot", text: "", thinking: true },
      ]);

      setIsStreaming(true);
      setIsThinking(true);
      setStatusText("");

      let fullBotText = "";

      try {
        await sendChatMessage(trimmed, history, {
          onAbortRef: (controller) => {
            abortControllerRef.current = controller;
          },
          onChunk: (chunk) => {
            // Khi nhận chunk đầu tiên → hết thinking, bắt đầu stream text
            if (isThinking || fullBotText === "") {
              setIsThinking(false);
              // Xoá flag thinking trên message
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, thinking: false } : m
                )
              );
            }
            fullBotText += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId ? { ...m, text: fullBotText } : m
              )
            );
          },
          onStatus: (status, tool) => {
            if (status === "done" || status === "error") {
              setIsThinking(false);
              setStatusText("");
              // Đảm bảo xoá flag thinking
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, thinking: false } : m
                )
              );
            } else if (status === "thinking") {
              // Giữ trạng thái thinking trong bubble — không set statusText
              setIsThinking(true);
            } else if (status === "fetching") {
              // fetching: hiển thị trong status bar bên dưới
              setIsThinking(false);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, thinking: false } : m
                )
              );
              setStatusText(
                tool
                  ? `Đang tra cứu ${
                      tool === "searchFilms"
                        ? "phim"
                        : tool === "getShowtimes"
                        ? "lịch chiếu"
                        : "dữ liệu"
                    }...`
                  : STATUS_TEXT.fetching
              );
            } else {
              setStatusText(STATUS_TEXT[status] || "");
            }
          },
        });

        setHistory((prev) => [
          ...prev,
          { role: "user", parts: [{ text: trimmed }] },
          { role: "model", parts: [{ text: fullBotText }] },
        ]);
      } catch (err) {
        if (err.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    text: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại! 😅",
                    thinking: false,
                  }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        setIsThinking(false);
        setStatusText("");
        streamingMsgIdRef.current = null;
      }
    },
    [inputText, isStreaming, history, isThinking]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInputText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  const handleClose = () => {
    abortControllerRef.current?.abort();
    setIsOpen(false);
  };

  const handleOpen = () => setIsOpen(true);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating action button */}
      <div className="chatbot-fab">
        {!isOpen && <span className="chatbot-fab__pulse" />}
        <button
          className={`chatbot-fab__btn${isOpen ? " chatbot-fab__btn--open" : ""}`}
          onClick={isOpen ? handleClose : handleOpen}
          title="Movix Assistant"
          aria-label="Mở chatbot"
        >
          {isOpen ? <CloseOutlined /> : <RobotOutlined />}
        </button>
      </div>

      {/* Chat window */}
      {isOpen && (
        <div
          ref={windowRef}
          className="chatbot-window"
          role="dialog"
          aria-label="Movix Chatbot"
        >
          {/* ── Resize handles ── */}
          <div
            className="chatbot-window__resize-left"
            onMouseDown={(e) => startResize(e, "left")}
            title="Kéo để thay đổi chiều rộng"
          />
          <div
            className="chatbot-window__resize-top"
            onMouseDown={(e) => startResize(e, "top")}
            title="Kéo để thay đổi chiều cao"
          />

          {/* Header */}
          <div className="chatbot-window__header">
            <div className="chatbot-window__header-avatar">
              <RobotOutlined />
            </div>
            <div className="chatbot-window__header-info">
              <div className="chatbot-window__header-name">Movix Assistant</div>
              <div className="chatbot-window__header-status">Trực tuyến</div>
            </div>
            <button
              className="chatbot-window__header-close"
              onClick={handleClose}
              aria-label="Đóng chatbot"
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Messages */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="chatbot-window__messages"
            onClick={handleBubbleClick}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-window__msg chatbot-window__msg--${msg.role}`}
              >
                {msg.role === "bot" && (
                  <div className="chatbot-window__msg-avatar">
                    <RobotOutlined />
                  </div>
                )}

                {/* Nếu đang thinking → hiển thị bubble dots, ngược lại hiển thị text */}
                {msg.thinking ? (
                  <div className="chatbot-window__msg-bubble chatbot-window__msg-bubble--thinking">
                    <span className="chatbot-thinking-dots">
                      <span /><span /><span />
                    </span>
                  </div>
                ) : (
                  <div
                    className="chatbot-window__msg-bubble"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(msg.text),
                    }}
                  />
                )}
              </div>
            ))}

            {/* Quick suggestions — chỉ hiện sau welcome message */}
            {messages.length === 1 && (
              <div className="chatbot-suggestions">
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="chatbot-suggestions__btn"
                    onClick={() => handleSend(s)}
                    disabled={isStreaming}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Status bar — chỉ hiện khi fetching / answering (KHÔNG hiện khi thinking) */}
            {statusText && (
              <div className="chatbot-window__status">
                <span className="chatbot-window__status-dot">
                  <span /><span /><span />
                </span>
                {statusText}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="chatbot-window__input-area">
            <textarea
              ref={textareaRef}
              className="chatbot-window__textarea"
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              rows={1}
              disabled={isStreaming}
            />
            <button
              className="chatbot-window__send-btn"
              onClick={() => handleSend()}
              disabled={isStreaming || !inputText.trim()}
              aria-label="Gửi"
            >
              <SendOutlined />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;