import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const team = searchParams.get('team')
    const adser = searchParams.get('adser')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const exchangeRateParam = searchParams.get('exchangeRate')
    const exchangeRate = exchangeRateParam ? parseFloat(exchangeRateParam) : 35
    const cpmTargetParam = searchParams.get('cpmTarget')
    const cpmTarget = cpmTargetParam ? parseFloat(cpmTargetParam) : 15

    // สร้าง where clause
    const where: any = {}

    if (team) {
      where.team = team
    }

    if (adser) {
      where.adser = adser
    }

    // Filter by month/year (วันที่เป็น dd/mm/yyyy)
    if (month || year) {
      if (month && year) {
        // กรองทั้งเดือนและปี เช่น "/1/2024" สำหรับมกราคม 2024
        const monthNum = getMonthNumber(month)
        if (monthNum) {
          // ใช้ contains เพื่อค้นหา "/เดือน/ปี" ใน date
          where.date = {
            contains: `/${monthNum}/${year}`
          }
        }
      } else if (year) {
        // กรองเฉพาะปี เช่น "/2024"
        where.date = {
          contains: `/${year}`
        }
      } else if (month) {
        // กรองเฉพาะเดือน เช่น "/1/" สำหรับมกราคม
        const monthNum = getMonthNumber(month)
        if (monthNum) {
          where.date = {
            contains: `/${monthNum}/`
          }
        }
      }
    }

    // ดึงข้อมูลจาก database
    const data = await prisma.gatewayData.findMany({
      where,
    })

    // เรียงลำดับวันที่อย่างถูกต้อง (แปลง dd/mm/yyyy เป็น Date object)
    data.sort((a, b) => {
      const dateA = parseDate(a.date)
      const dateB = parseDate(b.date)
      return dateA.getTime() - dateB.getTime() // น้อยไปมาก (เก่า → ใหม่)
    })

    let formattedData: any[]

    // ฟังก์ชันแปลงค่าเป็นตัวเลข (จัดการ comma, %, และค่าว่าง)
    const parseNumber = (value: string): number => {
      if (!value || value === '') return 0
      // ลบ comma, %, และช่องว่าง
      const cleaned = String(value).replace(/,/g, '').replace(/%/g, '').trim()
      const num = parseFloat(cleaned)
      return isNaN(num) ? 0 : num
    }

    // ถ้าไม่มี adser (Team view) ให้รวมยอดตามวันที่
    if (!adser && team) {
      // Group by date และรวมยอด
      const groupedData = new Map<string, any>()

      data.forEach((row) => {
        const dateKey = row.date
        
        if (!groupedData.has(dateKey)) {
          // สร้าง entry ใหม่
          groupedData.set(dateKey, {
            Team: row.team,
            Date: row.date,
            KPI_Budget_Used: '', // เพิ่มคอลัมน์ใหม่ (ค่าว่างไว้ก่อน)
            Planned_Messages: 0,
            Total_Messages: 0,
            'Messages(Meta)': 0,
            Lost_Messages: 0,
            Net_Messages: 0,
            'Planned_Spend/Day': 0,
            Spend: 0,
            CPM: 0, // คำนวณจาก Spend / Total_Messages
            'Cost_per_Message_(Meta)': 0, // คำนวณจาก Spend / Messages(Meta)
            'Top-up': 0,
            Messages_per_Top_up: '', // เพิ่มคอลัมน์ใหม่ (ค่าว่างไว้ก่อน)
            Quality_Messages_per_Top_up: '', // เพิ่มคอลัมน์ใหม่ (ค่าว่างไว้ก่อน)
            Cost_per_Top_up_Pure: 0, // คำนวณจาก Spend / Top-up
            'New Player Revenue (THB)': 0,
            USD_Cover: '', // เพิ่มคอลัมน์ใหม่ (ค่าว่างไว้ก่อน)
            Page_Blocks_7Days: 0,
            Page_Blocks_30Days: 0,
            Silent: 0,
            Duplicate: 0,
            Has_User: 0,
            Spam: 0,
            Blocked: 0,
            Under_18: 0,
            Over_50: 0,
            Foreign: 0,
          })
        }

        // รวมยอด (ใช้ parseNumber เพื่อจัดการ format ต่างๆ)
        const existing = groupedData.get(dateKey)
        existing.Total_Messages += parseNumber(row.totalMessages)
        existing['Messages(Meta)'] += parseNumber(row.messagesMeta)
        existing.Lost_Messages += parseNumber(row.lostMessages)
        existing.Net_Messages += parseNumber(row.netMessages)
        existing['Planned_Spend/Day'] += parseNumber(row.plannedSpendPerDay)
        existing.Spend += parseNumber(row.spend)
        existing.Planned_Messages += parseNumber(row.plannedMessages)
        existing['Top-up'] += parseNumber(row.topUp)
        existing['New Player Revenue (THB)'] += parseNumber(row.newPlayerRevenueTeam)
        existing.Page_Blocks_7Days += parseNumber(row.pageBlocks7Days)
        existing.Page_Blocks_30Days += parseNumber(row.pageBlocks30Days)
        existing.Silent += parseNumber(row.silent)
        existing.Duplicate += parseNumber(row.duplicate)
        existing.Has_User += parseNumber(row.hasUser)
        existing.Spam += parseNumber(row.spam)
        existing.Blocked += parseNumber(row.blocked)
        existing.Under_18 += parseNumber(row.under18)
        existing.Over_50 += parseNumber(row.over50)
        existing.Foreign += parseNumber(row.foreign)
      })

      // แปลงเป็น array และคำนวณ USD_Cover แบบสะสม
      const sortedData = Array.from(groupedData.values())
      let cumulativeSpend = 0
      let cumulativeRevenue = 0
      
      formattedData = sortedData.map(row => {
        // สะสมค่า Spend และ Revenue
        cumulativeSpend += row.Spend
        cumulativeRevenue += row['New Player Revenue (THB)']
        
        // คำนวณ CPM = Spend / Total_Messages
        const cpm = row.Total_Messages > 0 ? (row.Spend / row.Total_Messages).toFixed(2) : '0.00'
        
        // คำนวณ Cost_per_Message_(Meta) = Spend / Messages(Meta)
        const costPerMessageMeta = row['Messages(Meta)'] > 0 ? (row.Spend / row['Messages(Meta)']).toFixed(2) : '0.00'
        
        // คำนวณ Cost_per_Top_up_Pure = Spend / Top-up
        const costPerTopUpPure = row['Top-up'] > 0 ? (row.Spend / row['Top-up']).toFixed(2) : '0.00'
        
        // คำนวณ Messages_per_Top_up = (Top-up / Total_Messages) × 100
        const messagesPerTopUp = row.Total_Messages > 0 ? ((row['Top-up'] / row.Total_Messages) * 100).toFixed(2) + '%' : '0.00%'
        
        // คำนวณ Quality_Messages_per_Top_up = (Top-up / Net_Messages) × 100
        const qualityMessagesPerTopUp = row.Net_Messages > 0 ? ((row['Top-up'] / row.Net_Messages) * 100).toFixed(2) + '%' : '0.00%'
        
        // คำนวณ USD_Cover แบบสะสม = ยอดเล่นสะสม(฿) / (ค่าใช้จ่ายสะสม × อัตราแลกเปลี่ยน)
        const cumulativeSpendInTHB = cumulativeSpend * exchangeRate
        const usdCover = cumulativeSpendInTHB > 0 ? (cumulativeRevenue / cumulativeSpendInTHB).toFixed(2) : '0.00'
        
        // คำนวณ KPI_Budget_Used = (Total_Messages / (Spend / cpmTarget)) × 100
        const kpiBudgetUsed = cpmTarget > 0 ? ((row.Total_Messages / (row.Spend / cpmTarget)) * 100).toFixed(2) + '%' : '0.00%'
        
        return {
          ...row,
          KPI_Budget_Used: kpiBudgetUsed,
          Total_Messages: Math.round(row.Total_Messages).toString(),
          'Messages(Meta)': Math.round(row['Messages(Meta)']).toString(),
          Lost_Messages: Math.round(row.Lost_Messages).toString(),
          Net_Messages: Math.round(row.Net_Messages).toString(),
          'Planned_Spend/Day': '$' + row['Planned_Spend/Day'].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          Spend: '$' + row.Spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          CPM: cpm,
          'Cost_per_Message_(Meta)': costPerMessageMeta,
          Planned_Messages: Math.round(row.Planned_Messages).toString(),
          'Top-up': Math.round(row['Top-up']).toString(),
          Messages_per_Top_up: messagesPerTopUp,
          Quality_Messages_per_Top_up: qualityMessagesPerTopUp,
          Cost_per_Top_up_Pure: costPerTopUpPure,
          'New Player Revenue (THB)': '฿' + row['New Player Revenue (THB)'].toFixed(2),
          USD_Cover: '$' + usdCover,
          Page_Blocks_7Days: Math.round(row.Page_Blocks_7Days).toString(),
          Page_Blocks_30Days: Math.round(row.Page_Blocks_30Days).toString(),
          Silent: Math.round(row.Silent).toString(),
          Duplicate: Math.round(row.Duplicate).toString(),
          Has_User: Math.round(row.Has_User).toString(),
          Spam: Math.round(row.Spam).toString(),
          Blocked: Math.round(row.Blocked).toString(),
          Under_18: Math.round(row.Under_18).toString(),
          Over_50: Math.round(row.Over_50).toString(),
          Foreign: Math.round(row.Foreign).toString(),
        }
      })
      
      // Debug log
      console.log(`📊 Team aggregation: ${team}, Total records: ${data.length}, Grouped dates: ${groupedData.size}`)
    } else {
      // ถ้ามี adser (Adser view) ให้แสดงข้อมูลตามปกติและคำนวณ USD_Cover แบบสะสม
      let cumulativeSpend = 0
      let cumulativeRevenue = 0
      
      formattedData = data.map((row) => {
        const totalMessages = parseNumber(row.totalMessages)
        const messagesMeta = parseNumber(row.messagesMeta)
        const netMessages = parseNumber(row.netMessages)
        const spend = parseNumber(row.spend)
        const topUp = parseNumber(row.topUp)
        const newPlayerRevenue = parseNumber(row.newPlayerRevenueAdser)
        
        // สะสมค่า Spend และ Revenue
        cumulativeSpend += spend
        cumulativeRevenue += newPlayerRevenue
        
        // คำนวณ CPM = Spend / Total_Messages
        const cpm = totalMessages > 0 ? (spend / totalMessages).toFixed(2) : '0.00'
        
        // คำนวณ Cost_per_Message_(Meta) = Spend / Messages(Meta)
        const costPerMessageMeta = messagesMeta > 0 ? (spend / messagesMeta).toFixed(2) : '0.00'
        
        // คำนวณ Cost_per_Top_up_Pure = Spend / Top-up
        const costPerTopUpPure = topUp > 0 ? (spend / topUp).toFixed(2) : '0.00'
        
        // คำนวณ Messages_per_Top_up = (Top-up / Total_Messages) × 100
        const messagesPerTopUp = totalMessages > 0 ? ((topUp / totalMessages) * 100).toFixed(2) + '%' : '0.00%'
        
        // คำนวณ Quality_Messages_per_Top_up = (Top-up / Net_Messages) × 100
        const qualityMessagesPerTopUp = netMessages > 0 ? ((topUp / netMessages) * 100).toFixed(2) + '%' : '0.00%'
        
        // คำนวณ USD_Cover แบบสะสม = ยอดเล่นสะสม(฿) / (ค่าใช้จ่ายสะสม × อัตราแลกเปลี่ยน)
        const cumulativeSpendInTHB = cumulativeSpend * exchangeRate
        const usdCover = cumulativeSpendInTHB > 0 ? (cumulativeRevenue / cumulativeSpendInTHB).toFixed(2) : '0.00'
        
        // คำนวณ KPI_Budget_Used = (Total_Messages / (Spend / cpmTarget)) × 100
        const kpiBudgetUsed = cpmTarget > 0 ? ((totalMessages / (spend / cpmTarget)) * 100).toFixed(2) + '%' : '0.00%'
        
        return {
          Team: row.team,
          Adser: row.adser,
          Date: row.date,
          KPI_Budget_Used: kpiBudgetUsed,
          Planned_Messages: row.plannedMessages,
          Total_Messages: row.totalMessages,
          'Messages(Meta)': row.messagesMeta,
          Lost_Messages: row.lostMessages,
          Net_Messages: row.netMessages,
          'Planned_Spend/Day': '$' + parseNumber(row.plannedSpendPerDay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          Spend: '$' + spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          CPM: cpm,
          'Cost_per_Message_(Meta)': costPerMessageMeta,
          'Top-up': row.topUp,
          Messages_per_Top_up: messagesPerTopUp,
          Quality_Messages_per_Top_up: qualityMessagesPerTopUp,
          Cost_per_Top_up_Pure: costPerTopUpPure,
          'New Player Revenue (THB)': '฿' + parseNumber(row.newPlayerRevenueAdser).toFixed(2),
          USD_Cover: '$' + usdCover,
          Page_Blocks_7Days: row.pageBlocks7Days,
          Page_Blocks_30Days: row.pageBlocks30Days,
          Silent: row.silent,
          Duplicate: row.duplicate,
          Has_User: row.hasUser,
          Spam: row.spam,
          Blocked: row.blocked,
          Under_18: row.under18,
          Over_50: row.over50,
          Foreign: row.foreign,
        }
      })
    }

    // สร้าง headers
    const headers = formattedData.length > 0 ? Object.keys(formattedData[0]) : []

    return NextResponse.json({
      success: true,
      headers,
      data: formattedData,
      totalRows: formattedData.length,
      source: 'database',
      aggregated: !adser && !!team, // บอกว่าข้อมูลถูกรวมแล้วหรือไม่
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

// ฟังก์ชันแปลง dd/mm/yyyy เป็น Date object
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0) // return epoch if empty
  
  const parts = dateStr.split('/')
  if (parts.length !== 3) return new Date(0)
  
  const day = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1 // JavaScript month is 0-indexed
  const year = parseInt(parts[2])
  
  return new Date(year, month, day)
}

// ฟังก์ชันแปลงชื่อเดือนไทยเป็นเลข (ไม่มี leading zero เพราะ date เก็บเป็น 1/1/2024)
function getMonthNumber(monthName: string): string {
  const months: { [key: string]: string } = {
    'มกราคม': '1',
    'กุมภาพันธ์': '2',
    'มีนาคม': '3',
    'เมษายน': '4',
    'พฤษภาคม': '5',
    'มิถุนายน': '6',
    'กรกฎาคม': '7',
    'สิงหาคม': '8',
    'กันยายน': '9',
    'ตุลาคม': '10',
    'พฤศจิกายน': '11',
    'ธันวาคม': '12',
  }
  return months[monthName] || ''
}
