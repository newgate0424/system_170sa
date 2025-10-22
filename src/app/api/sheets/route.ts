import { NextRequest, NextResponse } from 'next/server'
import { getGoogleSheetsData, formatSheetData } from '@/lib/googleSheets'

export async function GET(request: NextRequest) {
  try {
    // ดึง query parameter สำหรับเลือก sheet และ force refresh
    const searchParams = request.nextUrl.searchParams
    const sheetName = searchParams.get('sheet') || 'gateway_team' // default เป็น gateway_team
    const forceRefresh = searchParams.get('refresh') === 'true' // force refresh ถ้ามี ?refresh=true
    
    // ดึงข้อมูลจาก Google Sheets (ไม่ต้อง authentication เพราะ sheet เป็น public)
    const { headers, data } = await getGoogleSheetsData(sheetName, forceRefresh)
    
    // แปลงเป็น format ที่ใช้งานง่าย
    const formattedData = formatSheetData(headers, data)

    return NextResponse.json({
      success: true,
      headers,
      data: formattedData,
      totalRows: data.length,
      sheetName,
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
