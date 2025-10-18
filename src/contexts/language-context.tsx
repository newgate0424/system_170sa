'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'th' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  th: {
    // Navigation
    'nav.dashboard': 'แดชบอร์ด',
    'nav.users': 'จัดการผู้ใช้',
    'nav.sessions': 'ผู้ใช้ออนไลน์',
    'nav.activity': 'บันทึกกิจกรรม',
    'nav.settings': 'ตั้งค่า',
    
    // Header
    'header.toggle.open': 'เปิด Sidebar',
    'header.toggle.close': 'ปิด Sidebar',
    'header.theme.light': 'โหมดสว่าง',
    'header.theme.dark': 'โหมดมืด',
    
    // User Menu
    'user.menu.title': 'บัญชีของฉัน',
    'user.menu.settings': 'ตั้งค่า',
    'user.menu.logout': 'ออกจากระบบ',
    'user.role.admin': 'ผู้ดูแลระบบ',
    'user.role.staff': 'พนักงาน',
    
    // Settings Page
    'settings.title': 'ตั้งค่า',
    'settings.appearance': 'รูปลักษณ์',
    'settings.appearance.desc': 'ปรับแต่งธีม สี และฟอนต์ตามความชอบ',
    'settings.theme': 'โหมดธีม',
    'settings.theme.light': 'โหมดสว่าง',
    'settings.theme.dark': 'โหมดมืด',
    'settings.theme.system': 'ตามระบบ',
    'settings.primaryColor': 'สีหลัก',
    'settings.primaryColor.selected': 'สีที่เลือก',
    'settings.primaryColor.custom': 'สีกำหนดเอง',
    'settings.primaryColor.selectColor': 'เลือกสี',
    'settings.background': 'พื้นหลังแบบกราเดี้ยน',
    'settings.background.selected': 'พื้นหลังที่เลือก',
    'settings.background.custom': 'กำหนดกราเดี้ยนเอง',
    'settings.background.startColor': 'สีเริ่มต้น',
    'settings.background.endColor': 'สีสิ้นสุด',
    'settings.background.customGradient': 'กราเดี้ยนกำหนดเอง',
    'settings.font': 'แบบอักษร',
    'settings.font.thai': 'ฟอนต์ภาษาไทย',
    'settings.font.international': 'ฟอนต์สากล',
    'settings.font.selected': 'ฟอนต์ที่เลือก',
    'settings.font.count': 'แบบ',
    'settings.fontSize': 'ขนาดตัวอักษร',
    'settings.fontSize.small': 'เล็ก',
    'settings.fontSize.medium': 'ปานกลาง',
    'settings.fontSize.large': 'ใหญ่',
    'settings.fontSize.selected': 'ขนาดที่เลือก',
    'settings.language': 'ภาษา',
    'settings.language.th': 'ไทย',
    'settings.language.en': 'English',
    'settings.language.selected': 'ภาษาที่เลือก',
    'settings.preview': 'ตัวอย่างข้อความ',
    'settings.preview.title': 'ระบบจัดการผู้ใช้งาน',
    'settings.preview.subtitle': 'การจัดการระบบผู้ใช้งานและสิทธิ์การเข้าถึง',
    'settings.autoSave': 'การตั้งค่าจะถูกบันทึกอัตโนมัติทันทีที่เปลี่ยนแปลง',
    'settings.password': 'เปลี่ยนรหัสผ่าน',
    'settings.password.desc': 'เปลี่ยนรหัสผ่านของคุณเพื่อความปลอดภัย',
    'settings.password.current': 'รหัสผ่านปัจจุบัน',
    'settings.password.new': 'รหัสผ่านใหม่',
    'settings.password.confirm': 'ยืนยันรหัสผ่านใหม่',
    'settings.password.button': 'เปลี่ยนรหัสผ่าน',
    
    // Logo
    'logo.subtitle': 'Admin Panel',
    
    // Common
    'common.loading': 'กำลังโหลด...',
    'common.error': 'เกิดข้อผิดพลาด',
    'common.success': 'สำเร็จ',
    'common.cancel': 'ยกเลิก',
    'common.confirm': 'ยืนยัน',
    'common.save': 'บันทึก',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.users': 'User Management',
    'nav.sessions': 'Online Users',
    'nav.activity': 'Activity Logs',
    'nav.settings': 'Settings',
    
    // Header
    'header.toggle.open': 'Open Sidebar',
    'header.toggle.close': 'Close Sidebar',
    'header.theme.light': 'Light Mode',
    'header.theme.dark': 'Dark Mode',
    
    // User Menu
    'user.menu.title': 'My Account',
    'user.menu.settings': 'Settings',
    'user.menu.logout': 'Logout',
    'user.role.admin': 'Administrator',
    'user.role.staff': 'Staff',
    
    // Settings Page
    'settings.title': 'Settings',
    'settings.appearance': 'Appearance',
    'settings.appearance.desc': 'Customize theme, colors and fonts',
    'settings.theme': 'Theme Mode',
    'settings.theme.light': 'Light Mode',
    'settings.theme.dark': 'Dark Mode',
    'settings.theme.system': 'System',
    'settings.primaryColor': 'Primary Color',
    'settings.primaryColor.selected': 'Selected color',
    'settings.primaryColor.custom': 'Custom color',
    'settings.primaryColor.selectColor': 'Select color',
    'settings.background': 'Gradient Background',
    'settings.background.selected': 'Selected background',
    'settings.background.custom': 'Custom gradient',
    'settings.background.startColor': 'Start color',
    'settings.background.endColor': 'End color',
    'settings.background.customGradient': 'Custom gradient',
    'settings.font': 'Font Family',
    'settings.font.thai': 'Thai Fonts',
    'settings.font.international': 'International Fonts',
    'settings.font.selected': 'Selected font',
    'settings.font.count': 'fonts',
    'settings.fontSize': 'Font Size',
    'settings.fontSize.small': 'Small',
    'settings.fontSize.medium': 'Medium',
    'settings.fontSize.large': 'Large',
    'settings.fontSize.selected': 'Selected size',
    'settings.language': 'Language',
    'settings.language.th': 'ไทย',
    'settings.language.en': 'English',
    'settings.language.selected': 'Selected language',
    'settings.preview': 'Preview Text',
    'settings.preview.title': 'User Management System',
    'settings.preview.subtitle': 'User management and access control system',
    'settings.autoSave': 'Settings are saved automatically when changed',
    'settings.password': 'Change Password',
    'settings.password.desc': 'Change your password for security',
    'settings.password.current': 'Current Password',
    'settings.password.new': 'New Password',
    'settings.password.confirm': 'Confirm New Password',
    'settings.password.button': 'Change Password',
    
    // Logo
    'logo.subtitle': 'Admin Panel',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('th')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'th' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage)
    }
    setMounted(true)
    
    // Listen for language changes from other components
    const handleLanguageChange = (event: CustomEvent) => {
      if (event.detail && (event.detail === 'th' || event.detail === 'en')) {
        setLanguageState(event.detail)
      }
    }
    
    window.addEventListener('languageChanged', handleLanguageChange as EventListener)
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    // Broadcast change to all components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }))
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
