import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Parse dd/mm/yyyy to Date
function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate'); // YYYY-MM-DD
    const team = searchParams.get('team');

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Required: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&team=ชื่อทีม',
        example: '/api/debug-compare?startDate=2025-10-01&endDate=2025-10-31&team=สาวอ้อย'
      }, { status: 400 });
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // ดึงข้อมูลทั้งหมด
    const where: any = {};
    if (team) where.team = team;

    const allData = await prisma.gatewayData.findMany({ where });

    // Filter by date range
    const filteredData = allData.filter((record: any) => {
      const recordDate = parseDate(record.date);
      if (!recordDate) return false;
      return recordDate >= startDateObj && recordDate <= endDateObj;
    });

    // Group by team
    const teamMap = new Map<string, any[]>();
    filteredData.forEach((record: any) => {
      const teamName = record.team;
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, []);
      }
      teamMap.get(teamName)!.push(record);
    });

    // Calculate totals
    const results: any[] = [];
    teamMap.forEach((records, teamName) => {
      let totalNewPlayerRevenue = 0;
      const dailyBreakdown: any[] = [];

      records.sort((a: any, b: any) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });

      records.forEach((record: any) => {
        const revenue = parseFloat(record.newPlayerRevenueTeam) || 0;
        totalNewPlayerRevenue += revenue;
        
        dailyBreakdown.push({
          date: record.date,
          newPlayerRevenueTeam_raw: record.newPlayerRevenueTeam,
          newPlayerRevenueTeam_parsed: revenue,
        });
      });

      results.push({
        team: teamName,
        dateRange: `${startDate} to ${endDate}`,
        totalDays: records.length,
        totalNewPlayerRevenue_summed: totalNewPlayerRevenue,
        dailyBreakdown,
      });
    });

    return NextResponse.json({
      query: { startDate, endDate, team },
      totalTeams: results.length,
      results,
      note: 'totalNewPlayerRevenue_summed คือผลรวมของยอดเล่นใหม่ทุกวัน'
    });
  } catch (error) {
    console.error('Debug compare error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
