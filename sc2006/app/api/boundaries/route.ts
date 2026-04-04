import { NextResponse } from 'next/server';

const DATASET_ID = 'd_4765db0e87b9c86336792efe8a1f7a66';

export async function GET() {
  try {
    const pollRes = await fetch(
      `https://api-open.data.gov.sg/v1/public/api/datasets/${DATASET_ID}/poll-download`,
      { next: { revalidate: 86400 } } // cache for 24h
    );

    if (!pollRes.ok) {
      return NextResponse.json({ error: 'Failed to reach data.gov.sg' }, { status: 502 });
    }

    const pollData = await pollRes.json();

    if (pollData.code !== 0) {
      return NextResponse.json({ error: pollData.errMsg || 'Error generating download link' }, { status: 502 });
    }

    const geoJsonRes = await fetch(pollData.data.url);
    if (!geoJsonRes.ok) {
      return NextResponse.json({ error: 'Failed to download GeoJSON' }, { status: 502 });
    }

    const geoJson = await geoJsonRes.json();
    return NextResponse.json(geoJson);
  } catch (error) {
    console.error('Boundaries proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
