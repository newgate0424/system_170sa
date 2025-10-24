import { NextResponse } from 'next/server';

const FALLBACK_RATE = 36.5; // THB per USD

export async function GET() {
  try {
    // ลองดึงจาก ExchangeRate-API (ฟรี, ไม่ต้อง API key)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 } // Cache 1 ชั่วโมง
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch from primary API');
    }
    
    const data = await response.json();
    const rate = data.rates?.THB;
    
    if (!rate || typeof rate !== 'number') {
      throw new Error('Invalid rate data');
    }
    
    return NextResponse.json({
      rate: parseFloat(rate.toFixed(2)),
      isFallback: false,
      timestamp: new Date().toISOString(),
      source: 'exchangerate-api.com'
    });
    
  } catch (error) {
    console.error('Exchange rate error:', error);
    
    // ลอง API สำรอง (frankfurter.app - ฟรี, open source)
    try {
      const fallbackResponse = await fetch('https://api.frankfurter.app/latest?from=USD&to=THB');
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const rate = fallbackData.rates?.THB;
        
        if (rate && typeof rate === 'number') {
          return NextResponse.json({
            rate: parseFloat(rate.toFixed(2)),
            isFallback: false,
            timestamp: new Date().toISOString(),
            source: 'frankfurter.app'
          });
        }
      }
    } catch (fallbackError) {
      console.error('Fallback API error:', fallbackError);
    }
    
    // ถ้าทั้งสอง API ล้มเหลว ใช้ค่าคงที่
    return NextResponse.json({
      rate: FALLBACK_RATE,
      isFallback: true,
      timestamp: new Date().toISOString(),
      source: 'fallback',
      error: 'Using fallback rate'
    });
  }
}
