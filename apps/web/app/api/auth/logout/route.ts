import { proxyAuthRequest } from "@/app/api/auth/_proxy";

export async function POST(request: Request) {
  return proxyAuthRequest(request, "/api/auth/logout");
}
