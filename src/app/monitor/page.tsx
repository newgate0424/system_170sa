'use client';

import { useLanguage } from '@/contexts/language-context'
import { Suspense } from "react";
import DataTable from '@/components/DataTable'

// Loading component
function LoadingDataTable() {
  const { language } = useLanguage()
  
  return (
    <div className="space-y-4 p-6">
      <div className="mb-6 flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
        <div className="flex flex-col">
          <div className="h-5 bg-muted-foreground/20 rounded w-20 mb-1"></div>
          <div className="h-10 bg-muted-foreground/20 rounded w-64"></div>
        </div>
        <div className="flex flex-col">
          <div className="h-5 bg-muted-foreground/20 rounded w-16 mb-1"></div>
          <div className="h-10 bg-muted-foreground/20 rounded w-32"></div>
        </div>
        <div className="flex flex-col">
          <div className="h-5 bg-muted-foreground/20 rounded w-16 mb-1"></div>
          <div className="h-10 bg-muted-foreground/20 rounded w-32"></div>
        </div>
      </div>
      
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg text-muted-foreground">
          {language === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading data...'}
        </p>
        <p className="text-sm text-muted-foreground">
          {language === 'th' 
            ? 'ใช้ Client-side loading เพื่อประสิทธิภาพที่ดีขึ้น' 
            : 'Using Client-side loading for better performance'}
        </p>
      </div>
    </div>
  );
}

// Wrap DataTable in Suspense for useSearchParams
function SuspendedDataTable() {
  return (
    <Suspense fallback={<LoadingDataTable />}>
      <DataTable />
    </Suspense>
  );
}

export default function MonitorPage() {
  return (
    <div className="h-full w-full pl-1 pr-4 py-2" data-page="monitor">
      <SuspendedDataTable />
    </div>
  );
}