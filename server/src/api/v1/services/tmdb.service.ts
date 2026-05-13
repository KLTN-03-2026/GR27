import axios from "axios";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/w500";

// Map ageRating TMDb certification → chuẩn Việt Nam của bạn
const mapAgeRating = (releaseDatesResults: any[]): string => {
  const vnEntry = releaseDatesResults.find((c: any) => c.iso_3166_1 === "VN");
  const usEntry = releaseDatesResults.find((c: any) => c.iso_3166_1 === "US");

  const rawVN = vnEntry?.release_dates?.[0]?.certification || "";
  const rawUS = usEntry?.release_dates?.[0]?.certification || "";
  const raw = rawVN || rawUS;

  const certMap: Record<string, string> = {
    // US ratings
    "G": "P",
    "PG": "K",
    "PG-13": "T13",
    "R": "T18",
    "NC-17": "T18",
    // VN ratings (nếu TMDb có sẵn)
    "P": "P",
    "K": "K",
    "T13": "T13",
    "T16": "T16",
    "T18": "T18",
    "C": "C",
  };

  return certMap[raw] || "T13"; // fallback
};

// ─────────────────────────────────────────────────────────────
// Tìm kiếm phim theo tên
// ─────────────────────────────────────────────────────────────
export const searchFilms = async (query: string, language: string) => {
  const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
    params: {
      api_key: TMDB_API_KEY,
      query,
      language,
      page: 1,
    },
  });

  return response.data.results.slice(0, 8).map((film: any) => ({
    tmdbId: film.id,
    title: film.title,
    originalTitle: film.original_title,
    releaseDate: film.release_date,
    thumbnail: film.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${film.poster_path}`
      : null,
    overview: film.overview,
  }));
};

// ─────────────────────────────────────────────────────────────
// Lấy chi tiết phim + map sang schema của bạn
// ─────────────────────────────────────────────────────────────
export const getAndMapFilmDetail = async (tmdbId: string, language: string) => {
  // Gọi song song 3 endpoint để tiết kiệm thời gian
  const [detailRes, detailEnRes, creditsRes, releaseDatesRes, videosRes] = await Promise.all([
    axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: { api_key: TMDB_API_KEY, language },
    }),

     axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: { api_key: TMDB_API_KEY, language: "en-US" },
    }),

    axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`, {
      params: { api_key: TMDB_API_KEY, language },
    }),
    axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/release_dates`, {
      params: { api_key: TMDB_API_KEY },
    }),
    axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/videos`, {
      params: { api_key: TMDB_API_KEY, language: "en-US" },
    }),
  ]);

  const d = detailRes.data;
  const dEn = detailEnRes.data;
  const credits = creditsRes.data;
  const releaseDates = releaseDatesRes.data.results || [];
  const videos = videosRes.data.results || [];

  // Lấy top 10 diễn viên
  const actors = (credits.cast || [])
    .slice(0, 10)
    .map((a: any) => a.name);

  // Lấy đạo diễn
  const directors = (credits.crew || [])
    .filter((c: any) => c.job === "Director")
    .map((c: any) => c.name);

  // Lấy trailer YouTube (ưu tiên official trailer)
  const trailer = videos.find(
    (v: any) => v.site === "YouTube" && v.type === "Trailer" && v.official
  ) || videos.find(
    (v: any) => v.site === "YouTube" && v.type === "Trailer"
  );
  const trailerUrl = trailer
    ? `https://www.youtube.com/watch?v=${trailer.key}`
    : "";

  // Map ngôn ngữ gốc
  const languageMap: Record<string, string> = {
    vi: "Tiếng Việt",
    en: "English",
    ko: "한국어",
    ja: "日本語",
    zh: "中文",
    fr: "Français",
    es: "Español",
    th: "ภาษาไทย",
  };
  const filmLanguage = languageMap[d.original_language] || d.original_language || "";

  return {
    // ── Tự động fill ──────────────────────────────────────────
    title: d.title || "",
    otherTitles: d.original_title && d.original_title !== d.title
      ? d.original_title
      : "",
    description: d.overview || "",
    duration: d.runtime || 0,
    releaseDate: d.release_date || null,
    thumbnail: d.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${d.poster_path}`
      : "",
    trailer: trailerUrl,
    actors: actors.join(", "),
    directors: directors.join(", "),
    filmLanguage,
    subtitles: "Tiếng Việt",
    ageRating: mapAgeRating(releaseDates),
    isTrending: d.popularity > 100,

    // ── Dùng để client tự map category ───────────────────────
    // TMDb genres trả về đúng tên tiếng Anh
    tmdbGenres: (dEn.genres || []).map((g: any) => g.name),

    // ── Admin tự chọn ─────────────────────────────────────────
    availableFormats: [],
    categoryIds: [],
  };
};