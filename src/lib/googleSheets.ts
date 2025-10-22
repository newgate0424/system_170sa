import { google } from 'googleapis'

// Cache สำหรับเก็บข้อมูล (ลด API calls)
interface CacheEntry {
  data: { headers: string[], data: any[][] }
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_DURATION = 10000 // 10 วินาที

// สร้าง Google Sheets client
export async function getGoogleSheetsData(sheetName: string = 'gateway_team', forceRefresh: boolean = false) {
  try {
    // ตรวจสอบ cache ก่อน (ถ้าไม่ใช่ force refresh)
    if (!forceRefresh) {
      const cached = cache.get(sheetName)
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log(`📦 Using cached data for ${sheetName}`)
        return cached.data
      }
    }

    console.log(`🌐 Fetching fresh data from ${sheetName}`)
    
    // ใช้ API Key แทน OAuth (ง่ายกว่าสำหรับ public sheets)
    const auth = process.env.GOOGLE_API_KEY || ''
    
    if (!auth) {
      throw new Error('GOOGLE_API_KEY is not set')
    }

    const sheets = google.sheets({ version: 'v4', auth })
    
    // Spreadsheet ID จาก URL
    const spreadsheetId = '1Hgcsr5vZXQZr0pcRBxsSC3eBxEzABkYBe6pn-RQQG8o'
    
    // ดึงข้อมูลจาก sheet ที่ระบุ
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:AZ`, // ดึงทุกคอลัมน์จาก A ถึง AZ (รองรับได้ถึง 52 คอลัมน์)
    })

    const rows = response.data.values
    
    if (!rows || rows.length === 0) {
      return { headers: [], data: [] }
    }

    // แถวแรกคือ headers
    const headers = rows[0]
    const data = rows.slice(1)

    const result = { headers, data }
    
    // เก็บลง cache
    cache.set(sheetName, {
      data: result,
      timestamp: Date.now()
    })

    return result
  } catch (error: any) {
    console.error('Error fetching Google Sheets data:', error)
    throw new Error(`Failed to fetch data from ${sheetName}: ${error.message}`)
  }
}

// ฟังก์ชันสำหรับแปลงข้อมูลเป็น object array
export function formatSheetData(headers: string[], data: any[][]) {
  return data.map((row) => {
    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = row[index] || ''
    })
    return obj
  })
}

// ฟังก์ชันล้าง cache (ใช้เมื่อต้องการ force refresh)
export function clearCache(sheetName?: string) {
  if (sheetName) {
    cache.delete(sheetName)
  } else {
    cache.clear()
  }
}
