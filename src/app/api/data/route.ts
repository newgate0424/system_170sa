import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { fetchMonitorData } from '@/lib/bigquery';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const adser = searchParams.get('adser');
    const status = searchParams.get('status');
    const team = searchParams.get('team');
    const searchText = searchParams.get('searchText');

    const result = await fetchMonitorData({
      page,
      limit,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      adser: adser || undefined,
      status: status || undefined,
      team: team || undefined,
      searchText: searchText || undefined,
      userTeams: decoded.role === 'EMPLOYEE' ? decoded.teams : undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
