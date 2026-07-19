import { proxyDataModelsRequest } from "@/app/api/data-models/_proxy";

type DataModelsRouteContext = {
  params: Promise<{ path: string[] }>;
};

async function resolvePath(context: DataModelsRouteContext): Promise<string> {
  const params = await context.params;
  return `/api/data-models/${params.path.join("/")}`;
}

export async function DELETE(request: Request, context: DataModelsRouteContext): Promise<Response> {
  return proxyDataModelsRequest(request, await resolvePath(context));
}

export async function GET(request: Request, context: DataModelsRouteContext): Promise<Response> {
  return proxyDataModelsRequest(request, await resolvePath(context));
}

export async function POST(request: Request, context: DataModelsRouteContext): Promise<Response> {
  return proxyDataModelsRequest(request, await resolvePath(context));
}

export async function PUT(request: Request, context: DataModelsRouteContext): Promise<Response> {
  return proxyDataModelsRequest(request, await resolvePath(context));
}
