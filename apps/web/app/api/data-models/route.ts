import { proxyDataModelsRequest } from "@/app/api/data-models/_proxy";

export function GET(request: Request): Promise<Response> {
  return proxyDataModelsRequest(request, "/api/data-models");
}

export function POST(request: Request): Promise<Response> {
  return proxyDataModelsRequest(request, "/api/data-models");
}
