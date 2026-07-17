import { proxyConnectionsRequest } from "@/app/api/connections/_proxy";

type ConnectionsRouteContext = {
  params: Promise<{ path: string[] }>;
};

async function resolvePath(context: ConnectionsRouteContext): Promise<string> {
  const params = await context.params;
  return `/api/connections/${params.path.join("/")}`;
}

export async function DELETE(request: Request, context: ConnectionsRouteContext): Promise<Response> {
  return proxyConnectionsRequest(request, await resolvePath(context));
}

export async function GET(request: Request, context: ConnectionsRouteContext): Promise<Response> {
  return proxyConnectionsRequest(request, await resolvePath(context));
}

export async function POST(request: Request, context: ConnectionsRouteContext): Promise<Response> {
  return proxyConnectionsRequest(request, await resolvePath(context));
}

export async function PUT(request: Request, context: ConnectionsRouteContext): Promise<Response> {
  return proxyConnectionsRequest(request, await resolvePath(context));
}
