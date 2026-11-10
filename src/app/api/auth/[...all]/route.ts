import { getAuth } from "@/server/auth";
import { z } from "zod";
const disabled = new Set([
  "/request-password-reset",
  "/reset-password",
  "/send-verification-email",
  "/verify-email",
]);
const email = z.email().max(254);
const password = z.string().min(12).max(128);
const code = z.string().regex(/^\d{6}$/);
const authInputs: Record<string, z.ZodType> = {
  "/sign-up/email": z.object({
    email,
    password,
    name: z.string().trim().min(1).max(120),
  }),
  "/sign-in/email": z.object({
    email,
    password: z.string().min(1).max(128),
    rememberMe: z.boolean().optional(),
  }),
  "/email-otp/verify-email": z.object({ email, otp: code }),
  "/email-otp/send-verification-otp": z.object({
    email,
    type: z.literal("email-verification"),
  }),
  "/email-otp/request-password-reset": z.object({ email }),
  "/email-otp/reset-password": z.object({ email, otp: code, password }),
};
async function handle(request: Request) {
  const path = new URL(request.url).pathname.replace("/api/auth", "");
  if (disabled.has(path))
    return Response.json(
      { message: "Use an emailed code to verify or reset your password." },
      { status: 404 },
    );
  if (request.method === "POST" && authInputs[path]) {
    let body: unknown;
    try {
      body = await request.clone().json();
    } catch {
      return Response.json(
        { message: "Enter valid form details." },
        { status: 400 },
      );
    }
    const result = authInputs[path].safeParse(body);
    if (!result.success)
      return Response.json(
        {
          message:
            result.error.issues[0]?.message || "Check your form details.",
        },
        { status: 400 },
      );
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    request = new Request(request.url, {
      method: request.method,
      headers,
      body: JSON.stringify(result.data),
    });
  }
  try {
    return await getAuth().handler(request);
  } catch {
    return Response.json(
      {
        message:
          "Sign-in is unavailable. Check the local database and email setup.",
      },
      { status: 503 },
    );
  }
}
export const GET = handle;
export const POST = handle;
