import axios, { AxiosError } from "axios";

// ─── Types ────────────────────────────────────────────────
interface NimbusAuthResponse {
  status: boolean;
  data: string; // The token is returned as a direct string
  message: string;
}

interface NimbusErrorResponse {
  status?: boolean;
  message?: string;
  error?: string;
}

// ─── Module-level cache ───────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Returns a valid NimbusPost bearer token.
 * Caches the token for 23 hours to avoid unnecessary auth calls.
 */
export const getNimbusPostToken = async (): Promise<string> => {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const email = process.env.NIMBUS_EMAIL;
  const password = process.env.NIMBUS_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing NIMBUS_EMAIL or NIMBUS_PASSWORD environment variables"
    );
  }

  try {
    const response = await axios.post<NimbusAuthResponse>(
      "https://api.nimbuspost.com/v1/users/login",
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Check for status AND that the token string exists
    if (
      !response.data?.status ||
      typeof response.data?.data !== "string" ||
      !response.data.data
    ) {
      console.error("Invalid NimbusPost Auth Response:", response.data);
      throw new Error(
        response.data?.message || "Invalid response from NimbusPost"
      );
    }

    cachedToken = response.data.data;
    // Cache for 23 hours (tokens are valid for 24h)
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

    return cachedToken;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<NimbusErrorResponse>;
      
      // Log the actual NimbusPost error message for debugging
      console.error(
        "NimbusPost Auth Error Details:", 
        axiosError.response?.data || axiosError.message
      );

      // Throw the specific error message from NimbusPost if available
      const actualMessage = 
        axiosError.response?.data?.message || 
        axiosError.response?.data?.error || 
        axiosError.message || 
        "Failed to authenticate with NimbusPost";
        
      throw new Error(actualMessage);
    } else {
      const genericError = error as Error;
      console.error("NimbusPost Auth Error:", genericError.message);
      throw new Error(genericError.message || "Failed to authenticate with NimbusPost");
    }
  }
};

/**
 * Clears the cached token.
 * Useful when you rotate credentials or handle auth failures.
 */
export const clearNimbusPostToken = (): void => {
  cachedToken = null;
  tokenExpiry = null;
};

// ─── NEW: request wrapper ─────────────────────────────────
export const nimbusRequest = async <T>(
  fn: (token: string) => Promise<T>
): Promise<T> => {
  const token = await getNimbusPostToken();
  return fn(token);
};