// lib/config.ts
import dayjs from 'dayjs';

export const fontSizes = [
    { name: 'เล็ก', size: '14px' },
    { name: 'ปกติ', size: '16px' },
    { name: 'ใหญ่', size: '18px' },
];

export const backgroundStyles = {
    'Classic': [
        { name: 'Default', class: 'bg-gradient-default', previewClass: 'preview-gradient-default' },
        { name: 'Ocean', class: 'bg-gradient-ocean', previewClass: 'preview-gradient-ocean' },
        { name: 'Sunset', class: 'bg-gradient-sunset', previewClass: 'preview-gradient-sunset' },
        { name: 'Forest', class: 'bg-gradient-forest', previewClass: 'preview-gradient-forest' },
    ],
    'Vivid': [
        { name: 'Mango', class: 'bg-gradient-mango', previewClass: 'preview-gradient-mango' },
        { name: 'Lavender', class: 'bg-gradient-lavender', previewClass: 'preview-gradient-lavender' },
        { name: 'Emerald', class: 'bg-gradient-emerald', previewClass: 'preview-gradient-emerald' },
        { name: 'Crimson', class: 'bg-gradient-crimson', previewClass: 'preview-gradient-crimson' },
    ],
    'Monochrome': [
        { name: 'Gray', class: 'bg-gradient-gray', previewClass: 'preview-gradient-gray' },
        { name: 'Silver', class: 'bg-gradient-silver', previewClass: 'preview-gradient-silver' },
    ],
    'Premium': [
        { name: 'Blue Theme', class: 'bg-gradient-blue-theme', previewClass: 'preview-gradient-blue-theme' },
        { name: 'Deep Blue', class: 'bg-gradient-deep-blue', previewClass: 'preview-gradient-deep-blue' },
        { name: 'Gold', class: 'bg-gradient-premium', previewClass: 'preview-gradient-premium' },
    ]
};

export const teamGroups = {
    'Lotto': ['สาวอ้อย', 'อลิน', 'อัญญาC', 'อัญญาD'],
    'Bacarat': ['สเปชบาร์', 'บาล้าน'],
    'Football': ['ฟุตบอลแอร์เรีย', 'ฟุตบอลแอร์เรีย(ฮารุ)']
};

export const cpmThresholds: { [key: string]: number } = {
    'สาวอ้อย': 2.0,
    'อลิน': 2.0,
    'อัญญาC': 2.0,
    'อัญญาD': 1.8,
    'สเปชบาร์': 4.0,
    'บาล้าน': 4.0,
    'ฟุตบอลแอร์เรีย': 5.0,
    'ฟุตบอลแอร์เรีย(ฮารุ)': 5.0,
};

export const cpmYAxisMax: { [key: string]: number } = {
    'สาวอ้อย': 2.5,
    'อลิน': 2.5,
    'อัญญาC': 2.5,
    'อัญญาD': 2.5,
    'สเปชบาร์': 6,
    'บาล้าน': 6,
    'ฟุตบอลแอร์เรีย': 6,
    'ฟุตบอลแอร์เรีย(ฮารุ)': 6,
};

export const costPerDepositThresholds: { [key: string]: number } = {
    'สาวอ้อย': 25,
    'อลิน': 25,
    'อัญญาC': 25,
    'อัญญาD': 25,
    'สเปชบาร์': 55,
    'บาล้าน': 55,
    'ฟุตบอลแอร์เรีย': 65,
    'ฟุตบอลแอร์เรีย(ฮารุ)': 65,
};

export const costPerDepositYAxisMax: { [key: string]: number } = {
    'สาวอ้อย': 30,
    'อลิน': 30,
    'อัญญาC': 30,
    'อัญญาD': 30,
    'สเปชบาร์': 65,
    'บาล้าน': 65,
    'ฟุตบอลแอร์เรีย': 80,
    'ฟุตบอลแอร์เรีย(ฮารุ)': 80,
};

export const depositsMonthlyTargets: { [key: string]: number } = {
    'สาวอ้อย': 1400,
    'อลิน': 1400,
    'อัญญาC': 1400,
    'อัญญาD': 1400,
    'สเปชบาร์': 1200,
    'บาล้าน': 1200,
    'ฟุตบอลแอร์เรีย': 900,
    'ฟุตบอลแอร์เรีย(ฮารุ)': 450,

};

// เพิ่มบรรทัดนี้ในไฟล์ lib/config.ts
export const coverTargets: { [key: string]: number } = {
    'Lotto': 70,
    'Bacarat': 25,
    'Football': 25,
};


export const calculateDailyTarget = (monthlyTarget: number, dateString: string): number => {
    const totalDaysInMonth = dayjs(dateString).daysInMonth();
    return Math.round(monthlyTarget / totalDaysInMonth);
};


export const filterButtons = [
    { label: 'วันนี้', value: 'today' },
    { label: 'เมื่อวาน', value: 'yesterday' },
    { label: 'เดือนนี้', value: 'this_month' },
    { label: 'เดือนที่แล้ว', value: 'last_month' },
];