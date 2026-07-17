import { proxyConnectionsRequest } from "@/app/api/connections/_proxy";

export function GET(request: Request): Promise<Response> {
  return proxyConnectionsRequest(request, "/api/connections");
}

export function POST(request: Request): Promise<Response> {
  return proxyConnectionsRequest(request, "/api/connections");
}
