import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

// ชื่อ sheets ที่ต้องการ sync (ตามทีม)
const TEAM_SHEETS = [
  'สาวอ้อย',
  'อลิน',
  'อัญญาC',
  'อัญญาD',
  'สเปชบาร์',
  'บาล้าน',
  'ฟุตบอลแอร์เรีย',
]

// Mapping คอลัมน์ตามที่กำหนด
const COLUMN_MAPPING = {
  A: 'team',
  B: null, // ว่าง
  C: 'adser',
  D: 'date',
  E: 'totalMessages',
  F: 'messagesMeta',
  G: 'lostMessages',
  H: 'netMessages',
  I: 'plannedSpendPerDay',
  J: 'spend',
  K: 'plannedMessages',
  L: null, // ว่าง
  M: 'topUp',
  N: null, // ว่าง
  O: 'newPlayerRevenueAdser',
  P: null, // ว่าง
  Q: 'newPlayerRevenueTeam',
  R: null, // ว่าง
  S: 'pageBlocks7Days',
  T: 'pageBlocks30Days',
  U: 'silent',
  V: 'duplicate',
  W: 'hasUser',
  X: 'spam',
  Y: 'blocked',
  Z: 'under18',
  AA: 'over50',
  AB: 'foreign',
}

// ฟังก์ชัน sync ข้อมูลจาก Google Sheets
async function syncSheetData(sheetName: string) {
  try {
    const auth = process.env.GOOGLE_API_KEY || ''
    if (!auth) {
      throw new Error('GOOGLE_API_KEY is not set')
    }

    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = '1Hgcsr5vZXQZr0pcRBxsSC3eBxEzABkYBe6pn-RQQG8o'

    // ดึงข้อมูลจาก Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:AB`, // A ถึง AB
    })

    const rows = response.data.values
    if (!rows || rows.length <= 1) {
      return { success: true, count: 0, message: `No data in ${sheetName}` }
    }

    // ข้ามแถวแรก (header)
    const dataRows = rows.slice(1)
    let syncedCount = 0
    let errorCount = 0

    // เตรียมข้อมูลทั้งหมดก่อน (batch)
    const batchData = []
    
    for (const row of dataRows) {
      try {
        // ดึงค่าจากแต่ละคอลัมน์
        const team = row[0] || '' // A
        const adser = row[2] || '' // C
        const date = row[3] || '' // D

        // ข้ามแถวที่ไม่มีข้อมูลสำคัญ
        if (!team || !adser || !date) {
          continue
        }

        // สร้าง object สำหรับบันทึก
        const gatewayData = {
          team,
          adser,
          date,
          totalMessages: row[4] || '',
          messagesMeta: row[5] || '',
          lostMessages: row[6] || '',
          netMessages: row[7] || '',
          plannedSpendPerDay: row[8] || '',
          spend: row[9] || '',
          plannedMessages: row[10] || '',
          topUp: row[12] || '',
          newPlayerRevenueAdser: row[14] || '',
          newPlayerRevenueTeam: row[16] || '',
          pageBlocks7Days: row[18] || '',
          pageBlocks30Days: row[19] || '',
          silent: row[20] || '',
          duplicate: row[21] || '',
          hasUser: row[22] || '',
          spam: row[23] || '',
          blocked: row[24] || '',
          under18: row[25] || '',
          over50: row[26] || '',
          foreign: row[27] || '',
          sheetName,
          syncedAt: new Date(),
        }

        batchData.push(gatewayData)
      } catch (err) {
        console.error(`Error preparing row in ${sheetName}:`, err)
        errorCount++
      }
    }

    if (batchData.length === 0) {
      return { success: true, count: 0, message: `No data in ${sheetName}` }
    }

    try {
      // Strategy: ลบข้อมูลเก่าของ sheet นี้ทั้งหมด แล้วเพิ่มใหม่
      // เร็วกว่า upsert ทีละแถวมาก!
      
      // 1. ลบข้อมูลเก่าของ sheet นี้
      await prisma.gatewayData.deleteMany({
        where: { sheetName }
      })
      
      // 2. เพิ่มข้อมูลใหม่ทั้งหมดพร้อมกัน (batch insert)
      const result = await prisma.gatewayData.createMany({
        data: batchData,
      })
      
      syncedCount = result.count
      
      console.log(`✅ ${sheetName}: Synced ${syncedCount} records in batch`)
    } catch (err: any) {
      console.error(`Error syncing batch in ${sheetName}:`, err)
      errorCount = batchData.length
    }

    return {
      success: true,
      sheet: sheetName,
      synced: syncedCount,
      errors: errorCount,
    }
  } catch (error: any) {
    console.error(`Error syncing sheet ${sheetName}:`, error)
    return {
      success: false,
      sheet: sheetName,
      error: error.message,
    }
  }
}

// API Route Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sheets } = body

    // ถ้าไม่ระบุ sheets ให้ sync ทั้งหมด
    const sheetsToSync = sheets && Array.isArray(sheets) ? sheets : TEAM_SHEETS

    console.log('🔄 Starting sync for sheets:', sheetsToSync)

    // Sync แต่ละ sheet แบบ parallel
    const results = await Promise.all(
      sheetsToSync.map((sheetName: string) => syncSheetData(sheetName))
    )

    // สรุปผลลัพธ์
    const summary = {
      totalSheets: results.length,
      successCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      totalSynced: results.reduce((sum, r) => sum + (r.synced || 0), 0),
      totalErrors: results.reduce((sum, r) => sum + (r.errors || 0), 0),
      details: results,
      syncedAt: new Date().toISOString(),
    }

    console.log('✅ Sync completed:', summary)

    return NextResponse.json(summary)
  } catch (error: any) {
    console.error('❌ Sync error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET: เรียก sync ด้วย GET method (สำหรับ cron job)
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ API key จาก query parameter (optional - เพิ่มความปลอดภัย)
    const searchParams = request.nextUrl.searchParams
    const apiKey = searchParams.get('key')
    
    // ถ้าต้องการใช้ API key ให้ uncomment บรรทัดนี้
    // if (apiKey !== process.env.SYNC_API_KEY) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('🔄 Starting auto-sync from cron job...')

    // Sync ทั้งหมด
    const results = await Promise.all(
      TEAM_SHEETS.map((sheetName: string) => syncSheetData(sheetName))
    )

    // สรุปผลลัพธ์
    const summary = {
      totalSheets: results.length,
      successCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      totalSynced: results.reduce((sum, r) => sum + (r.synced || 0), 0),
      totalErrors: results.reduce((sum, r) => sum + (r.errors || 0), 0),
      details: results,
      syncedAt: new Date().toISOString(),
      source: 'cron-job',
    }

    console.log('✅ Auto-sync completed:', summary)

    return NextResponse.json(summary)
  } catch (error: any) {
    console.error('❌ Auto-sync error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
