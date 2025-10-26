'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction, Wrench, Code } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export default function KpiAdserPage() {
  const { t, language } = useLanguage()

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Construction className="h-20 w-20 text-primary animate-pulse" />
              <Wrench className="h-8 w-8 text-primary/60 absolute -right-2 -bottom-1 animate-bounce" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            {language === 'th' ? 'กำลังพัฒนา' : 'Under Development'}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {language === 'th' 
              ? 'หน้า KPI Adser อยู่ระหว่างการพัฒนา' 
              : 'KPI Adser page is under development'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg">
            <Code className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">
                {language === 'th' ? 'คุณสมบัติที่กำลังพัฒนา' : 'Features in Development'}
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• {language === 'th' ? 'ติดตาม KPI ของแต่ละ Adser แบบเรียลไทม์' : 'Real-time KPI tracking for each Adser'}</li>
                <li>• {language === 'th' ? 'แดชบอร์ดแสดงประสิทธิภาพรายบุคคล' : 'Individual performance dashboard'}</li>
                <li>• {language === 'th' ? 'เปรียบเทียบ KPI กับเป้าหมาย' : 'KPI comparison with targets'}</li>
                <li>• {language === 'th' ? 'กราฟแสดงแนวโน้มและพัฒนาการ' : 'Trend and progress charts'}</li>
                <li>• {language === 'th' ? 'การแจ้งเตือนเมื่อ KPI ต่ำกว่าเป้า' : 'Alerts when KPI falls below targets'}</li>
                <li>• {language === 'th' ? 'รายงานสรุป KPI รายวัน รายเดือน' : 'Daily and monthly KPI summary reports'}</li>
              </ul>
            </div>
          </div>

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {language === 'th' 
                ? '🚀 เร็วๆ นี้! ขอบคุณสำหรับความอดทนของคุณ' 
                : '🚀 Coming Soon! Thank you for your patience'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
