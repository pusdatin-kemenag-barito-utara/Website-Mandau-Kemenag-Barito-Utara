export async function verifyTurnstileToken(
  token: string,
  ip?: string,
): Promise<{ success: boolean; error?: string }> {
  const isDev =
    process.env.NODE_ENV === "development" ||
    !process.env.TURNSTILE_SECRET_KEY;

  if (isDev) {
    return { success: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", process.env.TURNSTILE_SECRET_KEY!);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData },
    );

    const result = await response.json();

    if (!result.success) {
      console.error("Turnstile verification failed:", result["error-codes"]);
      return { success: false, error: "Verifikasi keamanan gagal." };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Turnstile error:", error instanceof Error ? error.message : error);
    return { success: false, error: "Gagal memverifikasi keamanan." };
  }
}
