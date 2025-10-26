import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface DailyDataPoint {
  date: string;
  value: number;
}

interface TeamMetric {
  team_name: string;
  planned_inquiries: number;
  total_inquiries: number;
  wasted_inquiries: number;
  net_inquiries: number;
  planned_daily_spend: number;
  actual_spend: number;
  deposits_count: number;
  new_player_value_thb: number;
  cpm_cost_per_inquiry: number;
  cost_per_deposit: number;
  inquiries_per_deposit: number;
  quality_inquiries_per_deposit: number;
  one_dollar_per_cover: number;
  page_blocks_7d: number;
  page_blocks_30d: number;
  silent_inquiries: number;
  repeat_inquiries: number;
  existing_user_inquiries: number;
  spam_inquiries: number;
  blocked_inquiries: number;
  under_18_inquiries: number;
  over_50_inquiries: number;
  foreigner_inquiries: number;
  cpm_cost_per_inquiry_daily: DailyDataPoint[];
  deposits_count_daily: DailyDataPoint[];
  cost_per_deposit_daily: DailyDataPoint[];
  one_dollar_per_cover_daily: DailyDataPoint[];
  facebook_cost_per_inquiry: number;
  actual_spend_daily: DailyDataPoint[];
  total_inquiries_daily: DailyDataPoint[];
}

// Parse dd/mm/yyyy to Date
function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

// Format Date to YYYY-MM-DD
function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    // ตรวจสอบ authentication
    await requireAuth();
    
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate'); // YYYY-MM-DD
    const exchangeRate = parseFloat(searchParams.get('exchangeRate') || '35');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing startDate or endDate parameters' },
        { status: 400 }
      );
    }

    // Fetch all gatewayData records
    const allData = await prisma.gatewayData.findMany();

    // Filter by date range - แปลงเป็น UTC date เพื่อเปรียบเทียบแบบวันที่เท่านั้น
    const startDateObj = new Date(startDate + 'T00:00:00Z');
    const endDateObj = new Date(endDate + 'T23:59:59Z');

    const filteredData = allData.filter((record: any) => {
      const recordDate = parseDate(record.date);
      if (!recordDate) return false;
      
      // เปรียบเทียบแบบวันที่เท่านั้น (ไม่สน timezone)
      const recordDateUTC = new Date(Date.UTC(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate()));
      return recordDateUTC >= startDateObj && recordDateUTC <= endDateObj;
    });

    // Group by team
    const teamMap = new Map<string, any[]>();
    filteredData.forEach((record: any) => {
      const team = record.team || 'Unknown';
      if (!teamMap.has(team)) {
        teamMap.set(team, []);
      }
      teamMap.get(team)!.push(record);
    });

    // Transform to TeamMetric[]
    const teamMetrics: TeamMetric[] = [];

    teamMap.forEach((records, teamName) => {
      // Aggregate totals
      let totalPlannedMessages = 0;
      let totalTotalMessages = 0;
      let totalLostMessages = 0;
      let totalNetMessages = 0;
      let totalPlannedSpendPerDay = 0;
      let totalSpend = 0;
      let totalDeposits = 0;
      let totalNewPlayerRevenue = 0;
      let totalPageBlocks7d = 0;
      let totalPageBlocks30d = 0;
      let totalSilent = 0;
      let totalDuplicate = 0;
      let totalHasUser = 0;
      let totalSpam = 0;
      let totalBlocked = 0;
      let totalUnder18 = 0;
      let totalOver50 = 0;
      let totalForeign = 0;

      // Daily arrays
      const dailyCpm: DailyDataPoint[] = [];
      const dailyDeposits: DailyDataPoint[] = [];
      const dailyCostPerDeposit: DailyDataPoint[] = [];
      const dailyCover: DailyDataPoint[] = [];
      const dailySpend: DailyDataPoint[] = [];
      const dailyInquiries: DailyDataPoint[] = [];

      // Sort by date
      records.sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });

      // Running totals for cover calculation
      let cumulativeRevenue = 0;
      let cumulativeSpend = 0;

      records.forEach((record: any) => {
        const parseNumber = (val: string) => parseFloat(String(val).replace(/,/g, '')) || 0;
        
        const plannedMessages = parseNumber(record.plannedMessages);
        const totalMessages = parseNumber(record.totalMessages);
        const lostMessages = parseNumber(record.lostMessages);
        const netMessages = parseNumber(record.netMessages);
        const plannedSpendPerDay = parseNumber(record.plannedSpendPerDay);
        const spend = parseNumber(record.spend);
        const deposits = parseNumber(record.topUp);
        const newPlayerRevenue = parseNumber(record.newPlayerRevenueTeam);
        const pageBlocks7d = parseNumber(record.pageBlocks7Days);
        const pageBlocks30d = parseNumber(record.pageBlocks30Days);
        const silent = parseNumber(record.silent);
        const duplicate = parseNumber(record.duplicate);
        const hasUser = parseNumber(record.hasUser);
        const spam = parseNumber(record.spam);
        const blocked = parseNumber(record.blocked);
        const under18 = parseNumber(record.under18);
        const over50 = parseNumber(record.over50);
        const foreign = parseNumber(record.foreign);

        totalPlannedMessages += plannedMessages;
        totalTotalMessages += totalMessages;
        totalLostMessages += lostMessages;
        totalNetMessages += netMessages;
        totalPlannedSpendPerDay += plannedSpendPerDay;
        totalSpend += spend;
        totalDeposits += deposits;
        totalNewPlayerRevenue += newPlayerRevenue; // รวมยอดทั้งหมด
        totalPageBlocks7d = Math.max(totalPageBlocks7d, pageBlocks7d);
        totalPageBlocks30d = Math.max(totalPageBlocks30d, pageBlocks30d);
        totalSilent += silent;
        totalDuplicate += duplicate;
        totalHasUser += hasUser;
        totalSpam += spam;
        totalBlocked += blocked;
        totalUnder18 += under18;
        totalOver50 += over50;
        totalForeign += foreign;

        // Daily calculations
        const recordDate = parseDate(record.date);
        const dateStr = recordDate ? formatDateYMD(recordDate) : record.date;

        const dailyCpmValue = totalMessages > 0 ? spend / totalMessages : 0;
        dailyCpm.push({ date: dateStr, value: dailyCpmValue });

        dailyDeposits.push({ date: dateStr, value: deposits });

        const dailyCostPerDepositValue = deposits > 0 ? spend / deposits : 0;
        dailyCostPerDeposit.push({ date: dateStr, value: dailyCostPerDepositValue });

        // Cover calculation (cumulative)
        cumulativeRevenue += newPlayerRevenue;
        cumulativeSpend += spend;
        const coverValue = cumulativeSpend > 0 ? cumulativeRevenue / (cumulativeSpend * exchangeRate) : 0;
        dailyCover.push({ date: dateStr, value: coverValue });

        dailySpend.push({ date: dateStr, value: spend });
        dailyInquiries.push({ date: dateStr, value: totalMessages });
      });

      // Calculate final metrics
      const cpmCostPerInquiry = totalTotalMessages > 0 ? totalSpend / totalTotalMessages : 0;
      const costPerDeposit = totalDeposits > 0 ? totalSpend / totalDeposits : 0;
      const inquiriesPerDeposit = totalDeposits > 0 ? totalTotalMessages / totalDeposits : 0;
      const qualityInquiriesPerDeposit = totalDeposits > 0 ? totalNetMessages / totalDeposits : 0;
      const oneDollarPerCover = cumulativeSpend > 0 ? cumulativeRevenue / (cumulativeSpend * exchangeRate) : 0;

      teamMetrics.push({
        team_name: teamName,
        planned_inquiries: totalPlannedMessages,
        total_inquiries: totalTotalMessages,
        wasted_inquiries: totalLostMessages,
        net_inquiries: totalNetMessages,
        planned_daily_spend: totalPlannedSpendPerDay,
        actual_spend: totalSpend,
        deposits_count: totalDeposits,
        new_player_value_thb: totalNewPlayerRevenue, // รวมยอดเล่นใหม่ทั้งหมด
        cpm_cost_per_inquiry: cpmCostPerInquiry,
        cost_per_deposit: costPerDeposit,
        inquiries_per_deposit: inquiriesPerDeposit,
        quality_inquiries_per_deposit: qualityInquiriesPerDeposit,
        one_dollar_per_cover: oneDollarPerCover,
        page_blocks_7d: totalPageBlocks7d,
        page_blocks_30d: totalPageBlocks30d,
        silent_inquiries: totalSilent,
        repeat_inquiries: totalDuplicate,
        existing_user_inquiries: totalHasUser,
        spam_inquiries: totalSpam,
        blocked_inquiries: totalBlocked,
        under_18_inquiries: totalUnder18,
        over_50_inquiries: totalOver50,
        foreigner_inquiries: totalForeign,
        cpm_cost_per_inquiry_daily: dailyCpm,
        deposits_count_daily: dailyDeposits,
        cost_per_deposit_daily: dailyCostPerDeposit,
        one_dollar_per_cover_daily: dailyCover,
        facebook_cost_per_inquiry: cpmCostPerInquiry,
        actual_spend_daily: dailySpend,
        total_inquiries_daily: dailyInquiries,
      });
    });

    return NextResponse.json(teamMetrics);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    console.error('Error fetching overview data:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the data.' },
      { status: 500 }
    );
  }
}
