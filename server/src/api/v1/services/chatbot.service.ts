import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
} from "@google/generative-ai";
import Film from "../models/film.model";
import Cinema from "../models/cinema.model";
import ShowTime from "../models/showTime.model";
import Category from "../models/category.model";
import { CommonStatus } from "../../../types/common.type";

// ── Khởi tạo Gemini client ────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const PRIMARY_MODEL = "gemini-3.1-flash-lite-preview";
const FALLBACK_MODEL = "gemini-2.5-flash";

const isOverloadError = (err: any): boolean => {
  const status = err?.status ?? err?.httpStatus ?? err?.response?.status;
  const message: string = err?.message ?? "";
  return (
    status === 503 ||
    status === 429 ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("Service Unavailable")
  );
};

const getModel = (modelName: string) =>
  genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: buildSystemPrompt(
      process.env.CLIENT_URL || "http://localhost:3000",
    ),
    tools: [{ functionDeclarations: CHATBOT_TOOLS }],
  });

// ── System prompt (nhận clientUrl động từ .env) ───────────────────────────────

const buildSystemPrompt = (clientUrl: string) =>
  `Bạn là Movix Assistant — trợ lý AI của hệ thống rạp chiếu phim đa rạp Movix.

NHIỆM VỤ:
- Gợi ý phim phù hợp với sở thích người dùng
- Cung cấp thông tin lịch chiếu, rạp chiếu chính xác
- Hướng dẫn quy trình đặt vé, thanh toán trên hệ thống Movix
- Trả lời thân thiện, ngắn gọn, tự nhiên bằng tiếng Việt

NGUYÊN TẮC:
- Chỉ tư vấn phim và rạp CÓ TRONG DỮ LIỆU được cung cấp qua tools, không bịa đặt
- Nếu không tìm thấy kết quả, thông báo lịch sự và gợi ý tìm kiếm cách khác
- Khi nhắc đến phim, kèm thể loại và thời lượng nếu có
- Khi nhắc đến suất chiếu, kèm giờ chiếu và định dạng (2D/3D)
- Giá vé tính bằng VNĐ, format số có dấu chấm phân cách ngàn

ĐƯỜNG DẪN (QUAN TRỌNG):
- Base URL của website: ${clientUrl}
- Khi đề cập đến một bộ phim cụ thể, LUÔN thêm link xem chi tiết theo cú pháp Markdown: [Tên Phim](${clientUrl}/films/SLUG_PHIM)
  Ví dụ: [Ma Chải Đầu](${clientUrl}/films/ma-chai-dau)
- Khi đề cập đến một rạp chiếu cụ thể, LUÔN thêm link theo cú pháp: [Tên Rạp](${clientUrl}/cinema/SLUG_RAP)
  Ví dụ: [Galaxy Trường Chinh](${clientUrl}/cinema/galaxy-truong-chinh)
- SLUG lấy từ field "slug" trong dữ liệu tool trả về — KHÔNG được tự bịa slug
- Nếu dữ liệu không có field slug thì không tạo link, chỉ ghi tên thông thường`;

// ── Booking guide tĩnh ────────────────────────────────────────────────────────

const BOOKING_GUIDE: Record<string, string> = {
  "đặt vé": `QUY TRÌNH ĐẶT VÉ TRÊN MOVIX:
1. Chọn phim từ trang chủ hoặc tìm kiếm
2. Chọn rạp, ngày và suất chiếu mong muốn
3. Chọn ghế trên sơ đồ phòng chiếu (Thường / VIP / Sweetbox)
4. Thêm combo bắp nước nếu muốn
5. Kiểm tra thông tin đơn hàng
6. Thanh toán và nhận vé điện tử`,

  "thanh toán": `PHƯƠNG THỨC THANH TOÁN TRÊN MOVIX:
- PayOS (QR Code hoặc thẻ ATM nội địa)
- Ví điện tử (Momo, ZaloPay)

Lưu ý: Hoàn thành thanh toán trong 15 phút sau khi chọn ghế, sau đó ghế sẽ tự động được giải phóng.`,

  "hoàn vé": `CHÍNH SÁCH HOÀN/ĐỔI VÉ MOVIX:
- Hiện tại hệ thống chúng tôi không hỗ trợ hoàn vé
- Trong vòng 15 phút trước giờ chiếu: không thể đặt vé
- Liên hệ hỗ trợ: support@movix.vn`,

  "tài khoản": `TÀI KHOẢN MOVIX:
- Đăng ký bằng email hoặc số điện thoại
- Lịch sử đặt vé lưu trong mục "Vé của tôi"
- Nhận vé điện tử qua email sau khi thanh toán thành công`,
};

// ── Map thể loại Tiếng Việt → Tiếng Anh (khớp với title trong DB) ─────────────

const GENRE_MAP: Record<string, string> = {
  "hành động": "action",
  "phiêu lưu": "adventure",
  "hoạt hình": "animation",
  hài: "comedy",
  "hài hước": "comedy",
  "tội phạm": "crime",
  "tâm lý": "drama",
  "chính kịch": "drama",
  "giả tưởng": "fantasy",
  "viễn tưởng": "fantasy",
  "lịch sử": "historical",
  "kinh dị": "horror",
  "bí ẩn": "mystery",
  "lãng mạn": "romance",
  "tình cảm": "romance",
  "khoa học viễn tưởng": "sci-fi",
  "khoa học": "sci-fi",
  "hồi hộp": "thriller",
  "kinh dị tâm lý": "thriller",
  "chiến tranh": "war",
};

/**
 * Chuẩn hóa tên thể loại: nếu user nhập tiếng Việt thì map sang tiếng Anh,
 * nếu đã là tiếng Anh (hoặc không có trong map) thì giữ nguyên.
 */
const normalizeGenre = (genre: string): string => {
  const lower = genre.toLowerCase().trim();
  return GENRE_MAP[lower] ?? lower;
};

// ── Định nghĩa Function Calling tools ────────────────────────────────────────
// Dùng SchemaType enum từ @google/generative-ai — KHÔNG dùng string literal

const CHATBOT_TOOLS: FunctionDeclaration[] = [
  {
    name: "searchFilms",
    description:
      "Tìm kiếm phim đang hoạt động trong hệ thống Movix. Dùng khi user hỏi: gợi ý phim hay, tìm phim theo thể loại, diễn viên, đạo diễn, hoặc mô tả nội dung phim.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        genre: {
          type: SchemaType.STRING,
          description:
            "Thể loại phim. Database lưu bằng tiếng Anh, hãy tự dịch nếu user nói tiếng Việt. Các giá trị hợp lệ: Action, Adventure, Animation, Comedy, Crime, Drama, Fantasy, Historical, Horror, Mystery, Romance, Sci-Fi, Thriller, War.",
        },
        actor: {
          type: SchemaType.STRING,
          description: "Tên diễn viên cần tìm",
        },
        director: {
          type: SchemaType.STRING,
          description: "Tên đạo diễn cần tìm",
        },
        keyword: {
          type: SchemaType.STRING,
          description: "Từ khóa tìm kiếm trong tên phim hoặc mô tả phim",
        },
        ageRating: {
          type: SchemaType.STRING,
          description: "Giới hạn độ tuổi: P, T13, T16, T18",
        },
        language: {
          type: SchemaType.STRING,
          description:
            "Ngôn ngữ phim: Tiếng Việt, Tiếng Anh, Tiếng Hàn, Tiếng Nhật...",
        },
      },
    },
  },
  {
    name: "getFilmDetail",
    description:
      "Lấy thông tin chi tiết của một bộ phim: mô tả đầy đủ, trailer, diễn viên, đạo diễn, thời lượng. Dùng khi user hỏi sâu hơn về một bộ phim cụ thể đã được đề cập.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        filmName: {
          type: SchemaType.STRING,
          description: "Tên phim cần xem chi tiết",
        },
      },
    },
  },
  {
    name: "getCinemas",
    description:
      "Lấy danh sách rạp chiếu phim theo thành phố hoặc thương hiệu. Dùng khi user hỏi: rạp nào ở thành phố X, có rạp CGV/Lotte/Galaxy ở đâu không.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        city: {
          type: SchemaType.STRING,
          description:
            "Tên thành phố: Hà Nội, Hồ Chí Minh, Đà Nẵng, Cần Thơ...",
        },
        brand: {
          type: SchemaType.STRING,
          description: "Thương hiệu rạp: CGV, Lotte, Galaxy, BHD, Cinestar...",
        },
      },
    },
  },
  {
    name: "getShowtimes",
    description:
      "Lấy lịch chiếu theo phim, rạp, thành phố hoặc ngày. Dùng khi user hỏi: phim X chiếu ở đâu, suất chiếu lúc mấy giờ, tối nay có phim gì ở CGV, phim ABC ngày mai ở rạp XYZ.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        filmName: {
          type: SchemaType.STRING,
          description: "Tên phim cần xem lịch chiếu",
        },
        cinemaName: {
          type: SchemaType.STRING,
          description: "Tên rạp chiếu cụ thể",
        },
        brand: {
          type: SchemaType.STRING,
          description: "Thương hiệu rạp: CGV, Lotte, Galaxy...",
        },
        city: {
          type: SchemaType.STRING,
          description: "Tên thành phố cần tìm lịch chiếu",
        },
        date: {
          type: SchemaType.STRING,
          description:
            "Ngày chiếu. Chấp nhận các định dạng: today (hôm nay), tomorrow (ngày mai), DD/MM, DD/MM/YYYY, hoặc YYYY-MM-DD. " +
            "Ví dụ: '19/05', '19/05/2026', '2026-05-19'. " +
            "Chỉ truyền khi user chỉ định ngày cụ thể, KHÔNG truyền nếu user hỏi chung chung.",
        },
        format: {
          type: SchemaType.STRING,
          description: "Định dạng chiếu: 2D, 3D, IMAX",
        },
      },
    },
  },
  {
    name: "getShowtimesByCinema",
    description:
      "Lấy tất cả phim đang chiếu tại một rạp cụ thể trong ngày. Dùng khi user hỏi: rạp X hôm nay chiếu phim gì, Galaxy Trường Chinh đang có suất chiếu nào.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        cinemaName: {
          type: SchemaType.STRING,
          description: "Tên rạp chiếu phim",
        },
        date: {
          type: SchemaType.STRING,
          description:
            "Ngày xem lịch. Chấp nhận: today, tomorrow, DD/MM, DD/MM/YYYY, hoặc YYYY-MM-DD. Mặc định là hôm nay.",
        },
      },
    },
  },
  {
    name: "getBookingGuide",
    description:
      "Lấy hướng dẫn quy trình đặt vé, thanh toán, hoàn vé của hệ thống Movix. Dùng khi user hỏi cách đặt vé, phương thức thanh toán, chính sách hoàn vé.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        topic: {
          type: SchemaType.STRING,
          description:
            "Chủ đề cần hướng dẫn: đặt vé, thanh toán, hoàn vé, tài khoản",
        },
      },
    },
  },
];

// ── Helper: resolve ngày từ chuỗi "today"/"tomorrow"/ISO sang khoảng UTC+7 ────

const resolveDate = (dateStr: string): { start: Date; end: Date } => {
  const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

  let base: Date;
  if (dateStr === "today") {
    base = new Date();
  } else if (dateStr === "tomorrow") {
    base = new Date();
    base.setDate(base.getDate() + 1);
  } else {
    const dmMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
    if (dmMatch) {
      const day = parseInt(dmMatch[1], 10);
      const month = parseInt(dmMatch[2], 10) - 1; // month 0-based
      const year = dmMatch[3]
        ? parseInt(dmMatch[3], 10)
        : new Date().getFullYear(); // dùng năm hiện tại nếu không có
      base = new Date(year, month, day);
    } else {
      // ISO YYYY-MM-DD hoặc các định dạng khác
      base = new Date(dateStr);
      if (isNaN(base.getTime())) base = new Date();
    }
  }

  // Lấy ngày theo giờ VN để xác định đúng ngày người dùng đang muốn
  const vnNow = new Date(base.getTime() + VN_OFFSET_MS);
  const vnDateStr = vnNow.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Tạo start/end với timezone offset +07:00 tường minh
  const start = new Date(`${vnDateStr}T00:00:00.000+07:00`);
  const end = new Date(`${vnDateStr}T23:59:59.999+07:00`);

  return { start, end };
};

// ── Helper: format Date → "HH:mm" theo giờ VN (UTC+7) ──────────────────────
// Convert sang giờ VN trước khi đưa vào response.

const toVNTimeStr = (date: Date): string =>
  new Date(date).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

// ── Thực thi từng tool call ─────────────────────

const executeToolCall = async (
  toolName: string,
  args: Record<string, string>,
): Promise<any> => {
  switch (toolName) {
    // ── searchFilms ───────────────────────────────────────────────────────────
    case "searchFilms": {
      const query: any = { status: CommonStatus.ACTIVE, deleted: false };

      if (args.actor) {
        query.actors = { $regex: args.actor, $options: "i" };
      }
      if (args.director) {
        query.directors = { $regex: args.director, $options: "i" };
      }
      if (args.keyword) {
        query.$or = [
          { title: { $regex: args.keyword, $options: "i" } },
          { description: { $regex: args.keyword, $options: "i" } },
          {
            otherTitles: {
              $elemMatch: { $regex: args.keyword, $options: "i" },
            },
          },
        ];
      }
      if (args.ageRating) {
        query.ageRating = args.ageRating.toUpperCase();
      }
      if (args.language) {
        query.filmLanguage = { $regex: args.language, $options: "i" };
      }

      if (args.genre) {
        const normalizedGenre = normalizeGenre(args.genre);
        const matchedCategories = await Category.find({
          title: { $regex: normalizedGenre, $options: "i" },
        })
          .select("_id")
          .lean();

        query.categoryIds = { $in: matchedCategories.map((c: any) => c._id) };
      }

      const films = await Film.find(query)
        .populate({ path: "categoryIds", select: "title" })
        .select(
          "title categoryIds actors directors duration ageRating filmLanguage description availableFormats thumbnail slug isTrending",
        )
        .sort({ isTrending: -1, createdAt: -1 })
        .limit(20)
        .lean();

      return films;
    }

    // ── getFilmDetail ─────────────────────────────────────────────────────────
    case "getFilmDetail": {
      if (!args.filmName) return null;

      const film = await Film.findOne({
        status: CommonStatus.ACTIVE,
        deleted: false,
        $or: [
          { title: { $regex: args.filmName, $options: "i" } },
          {
            otherTitles: {
              $elemMatch: { $regex: args.filmName, $options: "i" },
            },
          },
        ],
      })
        .populate({ path: "categoryIds", select: "title" })
        .lean();

      return film;
    }

    // ── getCinemas ────────────────────────────────────────────────────────────
    case "getCinemas": {
      const query: any = { status: CommonStatus.ACTIVE, deleted: false };

      if (args.brand) {
        const brands = await Cinema.find({
          name: { $regex: args.brand, $options: "i" },
          deleted: false,
        }).select("_id");
        const brandIds = brands.map((b) => b._id);
        query.parentId = { $in: brandIds };
      }

      let cinemas = await Cinema.find(query)
        .populate({ path: "parentId", select: "name avatar" })
        .populate({ path: "cityIds", select: "name" })
        .select("name address avatar cityIds parentId slug") // ← slug thêm vào đây
        .sort({ createdAt: -1 })
        .lean();

      // Lọc city phía app sau populate vì cityIds là mảng
      if (args.city) {
        cinemas = cinemas.filter((c: any) =>
          c.cityIds?.some((city: any) =>
            city.name?.toLowerCase().includes(args.city.toLowerCase()),
          ),
        );
      }

      return cinemas;
    }

    // ── getShowtimes ──────────────────────────────────────────────────────────
    case "getShowtimes": {
      const query: any = {
        status: CommonStatus.ACTIVE,
        deleted: false,
      };

      if (args.date) {
        const { start, end } = resolveDate(args.date);
        query.startTime = { $gte: start, $lte: end };
      } else {
        const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
        const nowVN = new Date(Date.now() + VN_OFFSET_MS);
        const todayVNStr = nowVN.toISOString().slice(0, 10);
        const startOfTodayVN = new Date(`${todayVNStr}T00:00:00.000+07:00`);
        query.startTime = { $gte: startOfTodayVN };
      }

      if (args.filmName) {
        const film = await Film.findOne({
          deleted: false,
          $or: [
            { title: { $regex: args.filmName, $options: "i" } },
            {
              otherTitles: {
                $elemMatch: { $regex: args.filmName, $options: "i" },
              },
            },
          ],
        }).select("_id");

        if (!film) {
          return {
            error: `Không tìm thấy phim "${args.filmName}" trong hệ thống`,
          };
        }
        query.filmId = film._id;
      }

      if (args.cinemaName || args.brand || args.city) {
        const cinemaQuery: any = {
          status: CommonStatus.ACTIVE,
          deleted: false,
        };

        if (args.cinemaName) {
          cinemaQuery.name = { $regex: args.cinemaName, $options: "i" };
        }
        if (args.brand) {
          const brands = await Cinema.find({
            name: { $regex: args.brand, $options: "i" },
            deleted: false,
          }).select("_id");
          cinemaQuery.parentId = { $in: brands.map((b) => b._id) };
        }

        let cinemas = await Cinema.find(cinemaQuery)
          .populate({ path: "cityIds", select: "name" })
          .lean();

        if (args.city) {
          cinemas = cinemas.filter((c: any) =>
            c.cityIds?.some((city: any) =>
              city.name?.toLowerCase().includes(args.city.toLowerCase()),
            ),
          );
        }

        if (cinemas.length > 0) {
          query.cinemaId = { $in: cinemas.map((c: any) => c._id) };
        }
      }

      if (args.format) {
        query.format = { $regex: args.format, $options: "i" };
      }

      const showtimes = await ShowTime.find(query)
        .populate({
          path: "filmId",
          select: "title thumbnail duration ageRating slug",
        })
        .populate({
          path: "cinemaId",
          select: "name address avatar cityIds parentId slug",
          populate: [
            { path: "cityIds", select: "name" },
            { path: "parentId", select: "name" },
          ],
        })
        .populate({ path: "roomId", select: "name" })
        .select(
          "filmId cinemaId roomId startTime endTime format basePrice seatTypes seats status",
        )
        .sort({ startTime: 1 })
        .limit(50)
        .lean();

      return showtimes.map((st: any) => ({
        ...st,
        startTime: toVNTimeStr(st.startTime),
        endTime: toVNTimeStr(st.endTime),
        availableSeats:
          st.seats?.filter((s: any) => s.status === "available").length ?? 0,
        totalSeats: st.seats?.length ?? 0,
        seats: undefined,
      }));
    }

    // ── getShowtimesByCinema ──────────────────────────────────────────────────
    case "getShowtimesByCinema": {
      if (!args.cinemaName) return null;

      const cinema = await Cinema.findOne({
        name: { $regex: args.cinemaName, $options: "i" },
        status: CommonStatus.ACTIVE,
        deleted: false,
      })
        .populate({ path: "cityIds", select: "name" })
        .populate({ path: "parentId", select: "name" })
        .select("name address avatar cityIds parentId slug") 
        .lean();

      if (!cinema)
        return {
          error: `Không tìm thấy rạp "${args.cinemaName}" trong hệ thống`,
        };

      
      const { start, end } = resolveDate(args.date || "today");

      const showtimes = await ShowTime.find({
        cinemaId: (cinema as any)._id,
        status: CommonStatus.ACTIVE,
        deleted: false,
        startTime: { $gte: start, $lte: end },
      })
        .populate({
          path: "filmId",
          select: "title thumbnail duration ageRating categoryIds slug",
          populate: { path: "categoryIds", select: "title" },
        })
        .select("filmId startTime endTime format basePrice seats")
        .sort({ startTime: 1 })
        .lean();

      const filmMap: Record<string, any> = {};
      for (const st of showtimes) {
        const film: any = st.filmId;
        if (!film) continue;
        const filmId = film._id.toString();
        if (!filmMap[filmId]) {
          filmMap[filmId] = {
            _id: film._id,
            title: film.title,
            thumbnail: film.thumbnail,
            duration: film.duration,
            ageRating: film.ageRating,
            categories: film.categoryIds,
            slug: film.slug,
            showtimes: [],
          };
        }
        filmMap[filmId].showtimes.push({
          _id: (st as any)._id,
          startTime: toVNTimeStr(st.startTime),
          endTime: toVNTimeStr(st.endTime),
          format: st.format,
          basePrice: st.basePrice,
          availableSeats:
            (st.seats as any[])?.filter((s) => s.status === "available")
              .length ?? 0,
        });
      }

      return {
        cinema: {
          name: (cinema as any).name,
          address: (cinema as any).address,
          cities: (cinema as any).cityIds,
          brand: (cinema as any).parentId?.name,
          slug: (cinema as any).slug, // ← slug thêm vào đây
        },
        date: start.toISOString().split("T")[0],
        films: Object.values(filmMap),
      };
    }

    // ── getBookingGuide ───────────────────────────────────────────────────────
    case "getBookingGuide": {
      const topic = (args.topic || "đặt vé").toLowerCase();
      const key =
        Object.keys(BOOKING_GUIDE).find((k) => topic.includes(k)) || "đặt vé";
      return { guide: BOOKING_GUIDE[key] };
    }

    default:
      return null;
  }
};

// ── Kiểu dữ liệu cho history ──────────────────────────────────────────────────

export interface IChatHistory {
  role: "user" | "model";
  parts: { text: string }[];
}

// ── Service chính: xử lý chat + stream ───────────────────────────────────────

/**
 * Xử lý một lượt chat:
 * 1. Gọi Gemini lần 1 → nhận function call (nếu cần)
 * 2. Thực thi tool → query MongoDB
 * 3. Gọi Gemini lần 2 → stream câu trả lời về client
 *
 * @param message  - Tin nhắn hiện tại của user
 * @param history  - Lịch sử hội thoại (Gemini format)
 * @param onChunk  - Callback nhận từng đoạn text stream
 * @param onStatus - Callback nhận trạng thái xử lý
 */
export const processChatMessage = async (
  message: string,
  history: IChatHistory[],
  onChunk: (text: string) => void,
  onStatus: (status: string, tool?: string) => void,
): Promise<void> => {
  // Giữ tối đa 20 lượt chat gần nhất để tránh vượt token
  const trimmedHistory = history.slice(-20);

  // Lấy CLIENT_URL từ .env để nhúng vào system prompt
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  // ── Helper: thử gọi Gemini với fallback model khi bị overload ─────────────
  const withFallback = async <T>(
    fn: (model: ReturnType<typeof getModel>) => Promise<T>,
  ): Promise<T> => {
    try {
      return await fn(getModel(PRIMARY_MODEL));
    } catch (err: any) {
      if (isOverloadError(err)) {
        console.warn(
          `[Chatbot] ${PRIMARY_MODEL} quá tải, chuyển sang ${FALLBACK_MODEL}`,
        );
        return await fn(getModel(FALLBACK_MODEL));
      }
      throw err;
    }
  };

  // ── Bước 1: Gọi Gemini lần 1 — quyết định gọi tool nào ────────────────────
  onStatus("thinking");

  const firstResult = await withFallback((model) =>
    model.generateContent({
      contents: [
        ...trimmedHistory,
        { role: "user", parts: [{ text: message }] },
      ],
    }),
  );

  const firstResponse = firstResult.response;
  const firstContent = firstResponse.candidates?.[0]?.content;
  const firstPart = firstContent?.parts?.[0];

  // ── Bước 2: Nếu Gemini gọi tool → thực thi ────────────────────────────────
  const userTurn = { role: "user", parts: [{ text: message }] };
  let extraTurns: any[] = [];

  if (firstPart?.functionCall) {
    const { name, args } = firstPart.functionCall;
    onStatus("fetching", name);

    const toolResult = await executeToolCall(
      name,
      (args as Record<string, string>) || {},
    );

    extraTurns = [
      firstContent,
      {
        role: "function",
        parts: [
          {
            functionResponse: {
              name,
              response: { result: toolResult ?? "Không có dữ liệu" },
            },
          },
        ],
      },
    ];
  } else {
    const directText = firstPart?.text;
    if (directText) {
      onStatus("answering");
      onChunk(directText);
      return;
    }
  }

  // ── Bước 3: Gọi Gemini lần 2 — sinh câu trả lời (có stream) ──────────────
  onStatus("answering");

  const streamResult = await withFallback((model) =>
    model.generateContentStream({
      contents: [...trimmedHistory, userTurn, ...extraTurns],
    }),
  );

  for await (const chunk of streamResult.stream) {
    const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) onChunk(text);
  }
};
