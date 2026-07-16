import { proxyAuthRequest } from "@/app/api/auth/_proxy";

export async function GET(request: Request) {
  return proxyAuthRequest(request, "/api/auth/me");
}
