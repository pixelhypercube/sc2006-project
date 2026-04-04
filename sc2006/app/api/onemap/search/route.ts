// app/api/onemap-search/route.ts
import { NextResponse } from "next/server";

const ONE_MAP_BASE = "https://www.onemap.gov.sg/api/common/elastic/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 3) {
    return NextResponse.json({ options: [] }, { status: 200 });
  }

  try {
    const token = process.env.ONEMAP_API_KEY;
    if (!token) {
      console.error("Please retrieve OneMap API key!");
      return NextResponse.json({ options: [] }, { status: 500 });
    }

    const url = `${ONE_MAP_BASE}?searchVal=${encodeURIComponent(
      q
    )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

    const resp = await fetch(url, {
      headers: { Authorization: token },
    });

    const data = await resp.json();

    const options = (data.results ?? []).map((r: any) => ({
      label: r.SEARCHVAL || r.ADDRESS,
      value: r.POSTAL,
      lat: parseFloat(r.LATITUDE),
      lng: parseFloat(r.LONGITUDE),
    }));

    return NextResponse.json({ options });
  } catch (error) {
    console.error("OneMap search error:", error);
    return NextResponse.json({ options: [] }, { status: 500 });
  }
}
