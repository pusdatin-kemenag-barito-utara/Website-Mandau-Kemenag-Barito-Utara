import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path ? path.join("/") : "";
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `http://127.0.0.1:8080/api/v1/${pathStr}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") || "",
        authorization: request.headers.get("authorization") || "",
      },
    });
    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Proxy Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path ? path.join("/") : "";
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `http://127.0.0.1:8080/api/v1/${pathStr}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: BodyInit | null = null;
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      body = await request.formData();
    } else {
      body = await request.text();
    }

    const headers: Record<string, string> = {
      cookie: request.headers.get("cookie") || "",
      authorization: request.headers.get("authorization") || "",
    };
    if (!contentType.includes("multipart/form-data")) {
      headers["content-type"] = contentType;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
    });
    const resHeaders: Record<string, string> = {
      "content-type": res.headers.get("content-type") || "application/json",
    };
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      resHeaders["set-cookie"] = setCookie;
    }
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Proxy Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path ? path.join("/") : "";
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `http://127.0.0.1:8080/api/v1/${pathStr}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: BodyInit | null = null;
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      body = await request.text();
    }

    const headers: Record<string, string> = {
      cookie: request.headers.get("cookie") || "",
      authorization: request.headers.get("authorization") || "",
    };
    if (!contentType.includes("multipart/form-data")) {
      headers["content-type"] = contentType;
    }

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body,
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Proxy Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path ? path.join("/") : "";
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `http://127.0.0.1:8080/api/v1/${pathStr}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        cookie: request.headers.get("cookie") || "",
        authorization: request.headers.get("authorization") || "",
      },
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Proxy Error" }, { status: 500 });
  }
}
