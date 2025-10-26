import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// API endpoint for daily deposits calculation
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ authentication จาก cookie
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // ดึง query parameters
    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get('month') || '0');
    const year = parseInt(searchParams.get('year') || '0');

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month or year' },
        { status: 400 }
      );
    }

    // สร้างช่วงวันที่สำหรับเดือนที่ต้องการ
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // วันสุดท้ายของเดือน
    const daysInMonth = endDate.getDate();

    // ดึงข้อมูล campaigns ที่อยู่ในช่วงเดือนนี้
    // โดยต้อง parse start date ที่เป็น string format
    const campaigns = await prisma.campaignData.findMany({
      where: {
        start: {
          not: null,
        },
      },
      select: {
        adid: true,
        start: true,
        off: true,
        deposit: true,
      },
    });

    // สร้าง data structure สำหรับเก็บ daily deposits
    const dailyDepositsData: Record<string, Record<string, number>> = {};
    let totalDeposits = 0;
    const adidsSet = new Set<string>();

    // ฟังก์ชันแปลง date string เป็น Date object
    const parseDate = (dateStr: string | null): Date | null => {
      if (!dateStr) return null;
      
      // ลอง parse หลายรูปแบบ
      // Format: dd/mm/yyyy
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const mon = parseInt(parts[1]) - 1;
        const yr = parseInt(parts[2]);
        return new Date(yr, mon, day);
      }
      
      // Format: yyyy-mm-dd
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      return null;
    };

    // ฟังก์ชันตรวจสอบว่าวันนั้นอยู่ในช่วงที่ active หรือไม่
    const isActiveOnDay = (day: number, startDate: Date | null, offDate: Date | null): boolean => {
      if (!startDate) return false;
      
      const checkDate = new Date(year, month - 1, day);
      
      // ต้อง active หลังจาก start date
      if (checkDate < startDate) return false;
      
      // ถ้ามี off date ต้อง active ก่อน off date
      if (offDate && checkDate >= offDate) return false;
      
      return true;
    };

    // วนลูปประมวลผลแต่ละ campaign
    campaigns.forEach((campaign) => {
      if (!campaign.adid) return;
      
      const startDate = parseDate(campaign.start);
      const offDate = parseDate(campaign.off);
      
      // ตรวจสอบว่า campaign นี้ทำงานในเดือนที่เลือกหรือไม่
      if (!startDate) return;
      if (startDate.getFullYear() > year) return;
      if (startDate.getFullYear() === year && startDate.getMonth() > month - 1) return;
      if (offDate && offDate.getFullYear() < year) return;
      if (offDate && offDate.getFullYear() === year && offDate.getMonth() < month - 1) return;

      const adid = campaign.adid;
      const depositPerDay = campaign.deposit || 0;

      if (!dailyDepositsData[adid]) {
        dailyDepositsData[adid] = {};
      }

      adidsSet.add(adid);

      // กระจาย deposit ให้แต่ละวันที่ active
      for (let day = 1; day <= daysInMonth; day++) {
        if (isActiveOnDay(day, startDate, offDate)) {
          const dayKey = `day${day}`;
          if (!dailyDepositsData[adid][dayKey]) {
            dailyDepositsData[adid][dayKey] = 0;
          }
          dailyDepositsData[adid][dayKey] += depositPerDay;
          totalDeposits += depositPerDay;
        }
      }
    });

    // สร้าง summary
    const summary = {
      totalAdIds: adidsSet.size,
      totalDeposits: Math.round(totalDeposits * 100) / 100,
      month: month,
      year: year,
      daysInMonth: daysInMonth,
    };

    return NextResponse.json({
      success: true,
      data: dailyDepositsData,
      summary: summary,
    });

  } catch (error) {
    console.error('Error fetching daily deposits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
