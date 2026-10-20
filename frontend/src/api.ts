// ──────────────────────────────────────────────
// Adastra : API Client
// ──────────────────────────────────────────────

import type {
  DatesResponse,
  StocksResponse,
  StockDetail,
  MarketStats,
  BacktestResponse,
  InvestorQuestionnaireAnswers,
  InvestorProfileResult,
  PortfolioRecommendation,
  AdviserChatResponse,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

let activeSessionToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("adastra_session_token") : null;

export function setSessionToken(token: string | null) {
  activeSessionToken = token;
  if (token && typeof window !== "undefined") {
    localStorage.setItem("adastra_session_token", token);
  } else if (typeof window !== "undefined") {
    localStorage.removeItem("adastra_session_token");
  }
}

export function getSessionToken(): string | null {
  return activeSessionToken;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (activeSessionToken) {
    headers["Authorization"] = `Bearer ${activeSessionToken}`;
    headers["X-Adastra-Session-Token"] = activeSessionToken;
  }
  return headers;
}

async function fetchJSON<T>(url: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

async function postJSON<T>(url: string, body: any, timeoutMs = 4000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDates(): Promise<DatesResponse> {
  return fetchJSON<DatesResponse>(`${API_BASE}/dates`);
}

export async function fetchStocks(date?: string): Promise<StocksResponse> {
  const query = date ? `?date=${date}` : "";
  return fetchJSON<StocksResponse>(`${API_BASE}/stocks${query}`);
}

export async function fetchStockDetail(stkcd: number, date?: string, profile?: string): Promise<StockDetail> {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (profile) params.append("profile", profile);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchJSON<StockDetail>(`${API_BASE}/stocks/${stkcd}${query}`);
}

export async function fetchStats(date?: string): Promise<MarketStats> {
  const query = date ? `?date=${date}` : "";
  return fetchJSON<MarketStats>(`${API_BASE}/stats${query}`);
}

export async function fetchBacktest(date?: string): Promise<BacktestResponse> {
  const query = date ? `?date=${date}` : "";
  return fetchJSON<BacktestResponse>(`${API_BASE}/backtest${query}`);
}

export async function assessInvestorProfile(
  answers: InvestorQuestionnaireAnswers,
  investorName: string = "Client"
): Promise<InvestorProfileResult> {
  const res = await postJSON<InvestorProfileResult & { session_token?: string }>(`${API_BASE}/profile/assess`, {
    answers,
    investor_name: investorName,
  });
  if (res.session_token) {
    setSessionToken(res.session_token);
  }
  return res;
}

export async function initAuthSession(
  investorName: string = "Client",
  initialProfile: string = "C3"
): Promise<{ session_token: string; status: string; profile: string }> {
  const res = await postJSON<{ session_token: string; status: string; profile: string }>(`${API_BASE}/auth/session`, {
    investor_name: investorName,
    initial_profile: initialProfile,
  });
  if (res.session_token) {
    setSessionToken(res.session_token);
  }
  return res;
}

export async function fetchPortfolioRecommendation(
  profile: string = "C3",
  date?: string,
  budget: number = 100000.0,
  topK: number = 5
): Promise<PortfolioRecommendation> {
  const params = new URLSearchParams({
    profile,
    budget: budget.toString(),
    top_k: topK.toString(),
  });
  if (date) params.append("date", date);
  return fetchJSON<PortfolioRecommendation>(`${API_BASE}/portfolio/recommend?${params.toString()}`);
}

export async function sendAdviserChat(
  message: string,
  profile: string = "C3",
  date?: string,
  stkcd?: number
): Promise<AdviserChatResponse> {
  return postJSON<AdviserChatResponse>(`${API_BASE}/adviser/chat`, {
    message,
    profile,
    date,
    stkcd,
  });
}
