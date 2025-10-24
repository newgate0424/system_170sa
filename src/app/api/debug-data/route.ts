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
    const teamOrAdser = searchParams.get('team') || searchParams.get('adser');
    const isTeam = searchParams.has('team');
    
    if (!teamOrAdser) {
      return NextResponse.json({ 
        error: 'Please specify ?team=ชื่อทีม or ?adser=ชื่อ adser',
        examples: [
          '/api/debug-data?team=สาวอ้อย',
          '/api/debug-data?adser=Boogey'
        ]
      }, { status: 400 });
    }
    
    // ดึงข้อมูลทั้งหมด
    const where = isTeam ? { team: teamOrAdser } : { adser: teamOrAdser };
    
    const allData = await prisma.gatewayData.findMany({
      where,
      select: {
        team: true,
        adser: true,
        date: true,
        totalMessages: true,
        topUp: true,
        newPlayerRevenueTeam: true,
        newPlayerRevenueAdser: true,
        spend: true,
      }
    });

    // เรียงตามวันที่
    const sortedData = allData.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

    // เอาแค่ 10 วันล่าสุด
    const last10 = sortedData.slice(-10);

    return NextResponse.json({
      count: last10.length,
      filterType: isTeam ? 'team' : 'adser',
      filterValue: teamOrAdser,
      totalRecords: sortedData.length,
      data: last10.map((d, idx) => {
        const revenue = isTeam 
          ? parseFloat(d.newPlayerRevenueTeam) || 0
          : parseFloat(d.newPlayerRevenueAdser) || 0;
        
        return {
          index: idx + 1,
          team: d.team,
          adser: d.adser,
          date: d.date,
          topUp: parseFloat(d.topUp) || 0,
          spend: parseFloat(d.spend) || 0,
          newPlayerRevenue: revenue,
          newPlayerRevenue_raw: isTeam ? d.newPlayerRevenueTeam : d.newPlayerRevenueAdser,
        };
      }),
      summary: {
        question: 'ยอดเล่นใหม่ (newPlayerRevenue) เป็นยอดสะสมหรือยอดรายวัน?',
        hint: 'ถ้าเลขเพิ่มขึ้นเรื่อยๆ = ยอดสะสม, ถ้าเลขแตกต่างกันแต่ไม่เรียงเพิ่ม = ยอดรายวัน'
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
