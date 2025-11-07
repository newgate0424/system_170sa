'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw, Upload, Sparkles } from "lucide-react";

// โหลดฟ้อนต์ OCR B และ Texas Hero
if (typeof window !== 'undefined') {
  const fontFace = new FontFace('OCR-B', 'url(/font/OCR%20B%2010%20BT.ttf)');
  fontFace.load().then((loadedFace) => {
    document.fonts.add(loadedFace);
  }).catch((error) => {
    console.error('Error loading OCR-B font:', error);
  });

  const signatureFont = new FontFace('Texas-Hero', 'url(/font/Texas%20Hero%20Regular.ttf)');
  signatureFont.load().then((loadedFace) => {
    document.fonts.add(loadedFace);
  }).catch((error) => {
    console.error('Error loading Texas Hero font:', error);
  });
}

interface MalaysiaVisaData {
  passportNo: string;
  surname: string;
  givenNames: string;
  nationality: string;
  dateOfBirth: string;
  sex: string;
  placeOfBirth: string;
  placeOfIssue: string;
  codeOfIssuing: string;
  dateOfIssue: string;
  dateOfExpiry: string;
  visaType: string;
  duration: string;
  entries: string;
  signature: string;
  photo?: string;
}

const generateRandomPassportNo = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < 2; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 7; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
};

const generateRandomDate = (minAge: number = 18, maxAge: number = 80): string => {
  const today = new Date();
  const birthYear = today.getFullYear() - Math.floor(Math.random() * (maxAge - minAge + 1)) - minAge;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${day.toString().padStart(2, '0')} ${months[month - 1]} ${birthYear}`;
};

const generateRandomName = (): { givenNames: string; surname: string } => {
  // ชื่อที่ใช้บ่อยในออสเตรเลีย
  const givenNames = [
    'JAMES', 'OLIVER', 'WILLIAM', 'JACK', 'NOAH', 'THOMAS', 'LUCAS', 'HENRY', 'ALEXANDER', 'BENJAMIN',
    'CHARLOTTE', 'AMELIA', 'OLIVIA', 'MIA', 'AVA', 'ISLA', 'EMILY', 'HARPER', 'ELLA', 'SOPHIE'
  ];
  const surnames = [
    'SMITH', 'JONES', 'WILLIAMS', 'BROWN', 'WILSON', 'TAYLOR', 'JOHNSON', 'WHITE', 'MARTIN', 'ANDERSON',
    'THOMPSON', 'NGUYEN', 'THOMAS', 'WALKER', 'HARRIS', 'LEE', 'RYAN', 'ROBINSON', 'KELLY', 'KING'
  ];
  
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  
  return { givenNames: givenName, surname };
};

const generateRandomPlace = (): string => {
  // เมืองหลักในออสเตรเลีย
  const places = ['SYDNEY', 'MELBOURNE', 'BRISBANE', 'PERTH', 'ADELAIDE', 'CANBERRA', 'HOBART', 'DARWIN'];
  return places[Math.floor(Math.random() * places.length)];
};

export default function MalaysiaVisaPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [cardData, setCardData] = useState<MalaysiaVisaData>({
    passportNo: '',
    surname: '',
    givenNames: '',
    nationality: 'AUSTRALIAN',
    dateOfBirth: '',
    sex: '',
    placeOfBirth: '',
    placeOfIssue: 'AUSTRALIA',
    codeOfIssuing: 'AUS',
    dateOfIssue: '',
    dateOfExpiry: '',
    visaType: 'SOCIAL VISIT',
    duration: '30 DAYS',
    entries: 'SINGLE',
    signature: '',
    photo: undefined
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [useAIPhoto, setUseAIPhoto] = useState(false);

  const generateAIPhoto = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/ai-photo?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI photo');
      }
      
      const blob = await response.blob();
      
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error generating AI photo:', error);
      return null;
    }
  };

  const handleGenerateAIPhoto = async () => {
    setIsLoadingAI(true);
    try {
      const aiPhoto = await generateAIPhoto();
      if (aiPhoto) {
        setCardData(prev => ({ ...prev, photo: aiPhoto }));
      }
    } catch (error) {
      console.error('Error loading AI photo:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  useEffect(() => {
    const initializeCanvas = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        const bgImage = new Image();
        bgImage.onload = () => {
          ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        };
        bgImage.src = '/card/my/Malaysia visa.png';
      } catch (error) {
        console.error('Error loading template:', error);
      }
    };
    initializeCanvas();
  }, []);

  const generateRandomData = async () => {
    const { givenNames, surname } = generateRandomName();
    const birthDate = generateRandomDate();
    const issueYear = new Date().getFullYear();
    const expiryYear = issueYear + 10;
    
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const issueMonth = months[Math.floor(Math.random() * 12)];
    const expiryMonth = months[Math.floor(Math.random() * 12)];
    const issueDay = Math.floor(Math.random() * 28) + 1;
    const expiryDay = Math.floor(Math.random() * 28) + 1;

    let photo = cardData.photo;
    if (useAIPhoto) {
      setIsLoadingAI(true);
      const aiPhoto = await generateAIPhoto();
      if (aiPhoto) photo = aiPhoto;
      setIsLoadingAI(false);
    }

    // ข้อมูลวีซ่ามาเลเซียที่ใช้จริง
    const visaTypes = ['SOCIAL VISIT', 'BUSINESS VISA', 'EMPLOYMENT PASS', 'STUDENT PASS', 'TRANSIT'];
    const durations = ['30 DAYS', '90 DAYS', '180 DAYS', '1 YEAR'];
    const entriesOptions = ['SINGLE ENTRY', 'MULTIPLE ENTRY'];

    setCardData({
      photo,
      passportNo: generateRandomPassportNo(),
      surname,
      givenNames,
      nationality: 'AUSTRALIAN',
      dateOfBirth: birthDate,
      sex: Math.random() > 0.5 ? 'M' : 'F',
      placeOfBirth: generateRandomPlace(),
      placeOfIssue: 'AUSTRALIA',
      codeOfIssuing: 'AUS',
      dateOfIssue: `${issueDay.toString().padStart(2, '0')} ${issueMonth} ${issueYear}`,
      dateOfExpiry: `${expiryDay.toString().padStart(2, '0')} ${expiryMonth} ${expiryYear}`,
      visaType: visaTypes[Math.floor(Math.random() * visaTypes.length)],
      duration: durations[Math.floor(Math.random() * durations.length)],
      entries: entriesOptions[Math.floor(Math.random() * entriesOptions.length)],
      signature: givenNames
    });
  };

  const handleInputChange = (field: keyof MalaysiaVisaData, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCardData(prev => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCard = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      // ใช้ขนาดที่ใหญ่ขึ้นเพื่อความชัดเจน
      canvas.width = 3543;
      canvas.height = 2362;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cardTemplate = new Image();
      cardTemplate.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        cardTemplate.onload = () => resolve();
        cardTemplate.onerror = () => reject(new Error('Failed to load template'));
        cardTemplate.src = '/card/my/Malaysia visa.png';
      });

      ctx.drawImage(cardTemplate, 0, 0, canvas.width, canvas.height);

      // เพิ่มเอฟเฟกต์การสแกนที่สมจริง (subtle noise/grain)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // เพิ่ม subtle grain (±2 ในแต่ละ channel)
        const noise = (Math.random() - 0.5) * 2;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));     // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // B
      }
      ctx.putImageData(imageData, 0, 0);

      // รอให้ฟ้อนต์โหลดเสร็จ
      await document.fonts.ready;

      // ใช้ฟ้อนต์ OCR-B ที่โหลดมาจาก public/font
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      
      const baseFont = '"OCR-B", "Courier New", monospace';
      
      // สร้าง micro-variations สำหรับความสมจริง (±0.5px)
      const microShift = () => (Math.random() - 0.5) * 0.8;

      // ========================================
      // Photo - รูปถ่าย (ด้านซ้ายบน)
      // ตำแหน่ง X, Y: (140, 280)
      // ขนาด Width, Height: (620, 770)
      // หมายเหตุ: รูปจะถูก scale ให้เต็มกรอบอัตโนมัติ พร้อมเอฟเฟกต์ภาพถ่าย
      // ========================================
      if (cardData.photo && cardData.photo.startsWith('data:')) {
        try {
          const photo = new Image();
          await new Promise<void>((resolve, reject) => {
            photo.onload = () => resolve();
            photo.onerror = () => reject(new Error('Failed to load photo'));
            photo.src = cardData.photo!;
          });

          // ปรับตำแหน่งและขนาดรูปตามเทมเพลต
          const photoX = 320, photoY = 700, photoW = 720, photoH = 970;
          ctx.save();
          ctx.beginPath();
          ctx.rect(photoX, photoY, photoW, photoH);
          ctx.clip();
          
          // สร้างเอฟเฟกต์ภาพถ่ายที่สมจริง
          // 1. ตั้งค่าความโปร่งของรูป
          ctx.globalAlpha = 0.78;
          
          // 2. เพิ่ม subtle blur เพื่อให้ดูเหมือนสแกน
          ctx.filter = 'blur(0.3px) contrast(1.05) brightness(0.98)';
          
          // คำนวณให้รูปเต็มกรอบ
          const scale = Math.max(photoW / photo.width, photoH / photo.height);
          const scaledW = photo.width * scale;
          const scaledH = photo.height * scale;
          const offsetX = photoX + (photoW - scaledW) / 2;
          const offsetY = photoY + (photoH - scaledH) / 2;
          
          ctx.drawImage(photo, offsetX, offsetY, scaledW, scaledH);
          
          // 3. เพิ่มเลเยอร์โปร่งบางๆ เพื่อความสมจริง
          ctx.globalAlpha = 0.03;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(photoX, photoY, photoW, photoH);
          
          // คืนค่ากลับ
          ctx.filter = 'none';
          ctx.globalAlpha = 1.0;
          ctx.restore();
        } catch (error) {
          console.error('Photo loading failed:', error);
        }
      }

      // ========================================
      // กำหนดฟ้อนต์และสีพื้นฐาน พร้อมเอฟเฟกต์สมจริง
      // ========================================
      // เพิ่ม subtle shadow เพื่อความลึก
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 0.5;
      ctx.shadowOffsetX = 0.3;
      ctx.shadowOffsetY = 0.3;
      
      // สีหมึกที่ดูเหมือนพิมพ์จริง
      ctx.fillStyle = '#0a0a0a';
      
      // ========================================
      // Type (P) - ตัว P มุมบนซ้าย
      // ตำแหน่ง X, Y: (690, 240)
      // ขนาดฟ้อนต์: 90px
      // น้ำหนัก: 500 (medium), ลองเปลี่ยนเป็น 400 (normal) หรือ 600 (semi-bold) ได้
      // ========================================
      ctx.font = `575 110px ${baseFont}`;
      ctx.fillText('P', 1168 + microShift(), 510 + microShift());

      // ========================================
      // Document Number - เลขเอกสาร มุมบนขวา
      // ตำแหน่ง X, Y: (2880, 240)
      // ขนาดฟ้อนต์: 65px
      // น้ำหนัก: 600 (semi-bold)
      // ========================================
      if (cardData.passportNo) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.passportNo, 2600 + microShift(), 490 + microShift());
      }

      // ========================================
      // Code of Issuing - รหัสประเทศที่ออก (ตำแหน่งที่ 1 - ด้านบน)
      // ตำแหน่ง X, Y: (1700, 500)
      // ขนาดฟ้อนต์: 110px
      // น้ำหนัก: 575
      // ========================================
      if (cardData.codeOfIssuing) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.codeOfIssuing.toUpperCase(), 1750 + microShift(), 500 + microShift());
      }

      // ========================================
      // Surname - นามสกุล (แถวที่ 1 ด้านซ้าย)
      // ตำแหน่ง X, Y: (690, 395)
      // ขนาดฟ้อนต์: 72px
      // น้ำหนัก: 600 (semi-bold)
      // ========================================
      if (cardData.surname) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.surname.toUpperCase(), 1168 + microShift(), 780 + microShift());
      }

      // ========================================
      // Given Names - ชื่อ (แถวที่ 2 ด้านซ้าย)
      // ตำแหน่ง X, Y: (690, 540)
      // ขนาดฟ้อนต์: 72px
      // น้ำหนัก: 600 (semi-bold)
      // ========================================
      if (cardData.givenNames) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.givenNames.toUpperCase(), 1168 + microShift(), 670 + microShift());
      }

      // ========================================
      // Nationality - สัญชาติ (แถวที่ 3 ด้านซ้าย)
      // ตำแหน่ง X, Y: (690, 685)
      // ขนาดฟ้อนต์: 72px
      // น้ำหนัก: 600 (semi-bold)
      // ========================================
      if (cardData.nationality) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.nationality.toUpperCase(), 1168 + microShift(), 940 + microShift());
      }

      // ========================================
      // Date of Birth - วันเกิด (แถวที่ 4 ด้านซ้าย)
      // ตำแหน่ง X, Y: (690, 830)
      // ขนาดฟ้อนต์: 72px
      // น้ำหนัก: 600 (semi-bold)
      // ========================================
      if (cardData.dateOfBirth) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.dateOfBirth, 1168 + microShift(), 1100 + microShift());
      }

      // ========================================
      // Sex - เพศ (แถวที่ 5 ด้านซ้าย)
      // ตำแหน่ง X, Y: (690, 975)
      // ขนาดฟ้อนต์: 72px
      // น้ำหนัก: 600 (semi-bold)
      // ========================================
      if (cardData.sex) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.sex.toUpperCase(), 1168 + microShift(), 1250 + microShift());
      }

      // ========================================
      // Place of Birth - สถานที่เกิด (ด้านขวา)
      // ตำแหน่ง X, Y: (2330, 830)
      // ขนาดฟ้อนต์: 68px
      // น้ำหนัก: 600 (semi-bold)
      // ========================================
      if (cardData.placeOfBirth) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.placeOfBirth.toUpperCase(), 2330 + microShift(), 1250 + microShift());
      }

      // ========================================
      // Date of Issue - วันที่ออก (แถวที่ 6 ด้านซ้าย)
      // ตำแหน่ง X, Y: (690, 1120)
      // ขนาดฟ้อนต์: 72px
      // น้ำหนัก: 600 (semi-bold)
      // ========================================
      if (cardData.dateOfIssue) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.dateOfIssue, 1168 + microShift(), 1420 + microShift());
      }

      // ========================================
      // Date of Expiry - วันหมดอายุ (แถวที่ 7 ด้านซ้าย)
      // ตำแหน่ง X, Y: (690, 1265)
      // ขนาดฟ้อนต์: 72px
      // น้ำหนัก: 600 (semi-bold)
      // ========================================
      if (cardData.dateOfExpiry) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.dateOfExpiry, 1168 + microShift(), 1565 + microShift());
      }

      // ========================================
      // Authority / Place of Issue - หน่วยงานออก (แถวที่ 8 ด้านซ้าย)
      // ตำแหน่ง X, Y: (690, 1410)
      // ขนาดฟ้อนต์: 72px
      // น้ำหนัก: 600 (semi-bold)
      // ========================================
      if (cardData.placeOfIssue) {
        ctx.font = `575 110px ${baseFont}`;
        ctx.fillText(cardData.placeOfIssue.toUpperCase(), 1168 + microShift(), 1710 + microShift());
      }

      // ========================================
      // MRZ Lines - Machine Readable Zone (ด้านล่างสุด)
      // บรรทัดที่ 1 ตำแหน่ง X, Y: (150, 1650)
      // บรรทัดที่ 2 ตำแหน่ง X, Y: (150, 1760)
      // ขนาดฟ้อนต์: 55px
      // น้ำหนัก: 600 (semi-bold)
      // หมายเหตุ: ข้อมูล MRZ จะถูกแปลงเป็นรูปแบบมาตรฐาน
      // ========================================
      ctx.font = `575 110px ${baseFont}`;
      ctx.fillStyle = '#000000';
      
      // MRZ Line 1
      const mrzLine1 = `P<AUS${cardData.surname.toUpperCase().replace(/\s/g, '')}<<${cardData.givenNames.toUpperCase().replace(/\s/g, '')}${'<'.repeat(44)}`.substring(0, 44);
      ctx.fillText(mrzLine1, 310 + microShift(), 2000 + microShift());
      
      // MRZ Line 2
      const docNo = cardData.passportNo.padEnd(9, '<');
      const nationality = 'AUS';
      
      // แปลงวันที่จาก "DD MMM YYYY" เป็น "YYMMDD"
      const parseDOB = (dateStr: string) => {
        if (!dateStr) return '000000';
        const months: {[key: string]: string} = {
          'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
          'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
        };
        const parts = dateStr.split(' ');
        if (parts.length !== 3) return '000000';
        const day = parts[0].padStart(2, '0');
        const month = months[parts[1]] || '01';
        const year = parts[2].slice(-2);
        return year + month + day;
      };
      
      const dob = parseDOB(cardData.dateOfBirth);
      const sex = cardData.sex.toUpperCase() || 'M';
      const expiry = parseDOB(cardData.dateOfExpiry);
      
      // MRZ Line 2: PassportNo(9) + Checksum(1) + Nationality(3) + DOB(6) + Checksum(1) + Sex(1) + Expiry(6) + Checksum(1) + Optional(14) + Checksum(1) = 44
      const optional = '<<<<<<<<<<<<<<';
      const mrzLine2 = `${docNo}0${nationality}${dob}0${sex}${expiry}0${optional}0`;
      ctx.fillText(mrzLine2, 310 + microShift(), 2156 + microShift());

      // ========================================
      // Signature - ลายเซ็น (ใช้ฟ้อนต์ Texas Hero)
      // ตำแหน่ง X, Y: (2300, 1850)
      // ขนาดฟ้อนต์: 120px
      // หมายเหตุ: ใช้ฟ้อนต์แบบสคริปต์สำหรับลายเซ็น พร้อมเอฟเฟกต์ปากกาจริง
      // ========================================
      if (cardData.signature) {
        // บันทึกสถานะ canvas
        ctx.save();
        
        // ปรับเงาให้บางลง
        ctx.shadowColor = 'rgba(0, 0, 128, 0.12)';
        ctx.shadowBlur = 0.4;
        ctx.shadowOffsetX = 0.1;
        ctx.shadowOffsetY = 0.1;
        
        ctx.font = `120px "Texas-Hero", cursive`;
        ctx.fillStyle = '#1a1a5a'; // สีน้ำเงินเข้มของปากกา
        
        // ย้ายจุดศูนย์กลางไปที่ตำแหน่งลายเซ็น
        const sigX = 2300;
        const sigY = 1500;
        ctx.translate(sigX, sigY);
        
        // หมุนเอียงขึ้นเล็กน้อย (ประมาณ -5 องศา)
        ctx.rotate(-0.09); // -0.09 radians ≈ -5 องศา
        
        // วาดลายเซ็นที่ตำแหน่ง 0,0 (เพราะเราย้าย translate แล้ว)
        ctx.globalAlpha = 0.95;
        ctx.fillText(cardData.signature, 0, 0);
        ctx.globalAlpha = 1.0;
        
        // คืนค่าสถานะ canvas (รวมทั้งรีเซ็ตเงาและการหมุน)
        ctx.restore();
      }

      // ========================================
      // ปรับแต่งสุดท้ายเพื่อความสมจริง
      // ========================================
      // เพิ่ม subtle color shift และ aging effect
      const finalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const finalData = finalImageData.data;
      for (let i = 0; i < finalData.length; i += 4) {
        // เพิ่มสี warm tone เล็กน้อย (เหมือนกระดาษเก่า)
        finalData[i] = Math.min(255, finalData[i] + 1);     // R +1
        finalData[i + 1] = Math.min(255, finalData[i + 1] + 0.5); // G +0.5
        // B ไม่เปลี่ยน
      }
      ctx.putImageData(finalImageData, 0, 0);

    } catch (error) {
      console.error('Error generating visa:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [cardData]);

  useEffect(() => {
    generateCard();
  }, [generateCard]);

  useEffect(() => {
    if (cardData.photo && cardData.surname) {
      const timer = setTimeout(() => {
        generateCard();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [cardData.photo, cardData.surname, generateCard]);

  const downloadCard = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'malaysia-visa.png';
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div className="min-h-screen p-6">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Malaysia Visa Maker - เครื่องมือสร้างวีซ่ามาเลเซีย</CardTitle>
            <Link href="/card-maker">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                กลับ
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left - Canvas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">ตัวอย่างวีซ่ามาเลเซีย</h3>
              <canvas
                ref={canvasRef}
                width={3543}
                height={2362}
                className="w-full h-auto rounded-lg shadow-lg bg-white border"
                style={{ maxWidth: '700px', aspectRatio: '3543/2362' }}
              />
              <Button onClick={downloadCard} className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                ดาวน์โหลดวีซ่า
              </Button>
            </div>

            {/* Right - Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">ข้อมูลวีซ่า</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="passportNo">Passport No.</Label>
                  <Input
                    id="passportNo"
                    value={cardData.passportNo}
                    onChange={(e) => handleInputChange('passportNo', e.target.value)}
                    placeholder="AB1234567"
                    maxLength={9}
                  />
                </div>

                <div>
                  <Label htmlFor="surname">Surname</Label>
                  <Input
                    id="surname"
                    value={cardData.surname}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    placeholder="นามสกุล (อังกฤษ)"
                  />
                </div>

                <div>
                  <Label htmlFor="givenNames">Given Names</Label>
                  <Input
                    id="givenNames"
                    value={cardData.givenNames}
                    onChange={(e) => handleInputChange('givenNames', e.target.value)}
                    placeholder="ชื่อ (อังกฤษ)"
                  />
                </div>

                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={cardData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    placeholder="AUSTRALIAN"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    value={cardData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    placeholder="01 JAN 1990"
                  />
                </div>

                <div>
                  <Label htmlFor="sex">Sex</Label>
                  <Input
                    id="sex"
                    value={cardData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    placeholder="M/F"
                    maxLength={1}
                  />
                </div>

                <div>
                  <Label htmlFor="placeOfBirth">Place of Birth</Label>
                  <Input
                    id="placeOfBirth"
                    value={cardData.placeOfBirth}
                    onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                    placeholder="BANGKOK"
                  />
                </div>

                <div>
                  <Label htmlFor="placeOfIssue">Place of Issue</Label>
                  <Input
                    id="placeOfIssue"
                    value={cardData.placeOfIssue}
                    onChange={(e) => handleInputChange('placeOfIssue', e.target.value)}
                    placeholder="KUALA LUMPUR"
                  />
                </div>

                <div>
                  <Label htmlFor="codeOfIssuing">Code of Issuing</Label>
                  <Input
                    id="codeOfIssuing"
                    value={cardData.codeOfIssuing}
                    onChange={(e) => handleInputChange('codeOfIssuing', e.target.value)}
                    placeholder="AUS"
                    maxLength={3}
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfIssue">Date of Issue</Label>
                  <Input
                    id="dateOfIssue"
                    value={cardData.dateOfIssue}
                    onChange={(e) => handleInputChange('dateOfIssue', e.target.value)}
                    placeholder="01 JAN 2024"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfExpiry">Date of Expiry</Label>
                  <Input
                    id="dateOfExpiry"
                    value={cardData.dateOfExpiry}
                    onChange={(e) => handleInputChange('dateOfExpiry', e.target.value)}
                    placeholder="01 JAN 2025"
                  />
                </div>

                <div>
                  <Label htmlFor="visaType">Visa Type</Label>
                  <Input
                    id="visaType"
                    value={cardData.visaType}
                    onChange={(e) => handleInputChange('visaType', e.target.value)}
                    placeholder="SOCIAL VISIT"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={cardData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="30 DAYS"
                  />
                </div>

                <div>
                  <Label htmlFor="entries">Entries</Label>
                  <Input
                    id="entries"
                    value={cardData.entries}
                    onChange={(e) => handleInputChange('entries', e.target.value)}
                    placeholder="SINGLE"
                  />
                </div>

                <div>
                  <Label htmlFor="signature">Signature (ลายเซ็น)</Label>
                  <Input
                    id="signature"
                    value={cardData.signature}
                    onChange={(e) => handleInputChange('signature', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="photo">รูปถ่าย</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    ref={fileInputRef}
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="flex-1"
                    disabled={useAIPhoto}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    title="อัปโหลดรูป"
                    disabled={useAIPhoto}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateAIPhoto}
                    disabled={isLoadingAI}
                    title="สุ่มรูป AI"
                  >
                    {isLoadingAI ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useAIPhoto"
                    checked={useAIPhoto}
                    onChange={(e) => setUseAIPhoto(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="useAIPhoto" className="cursor-pointer text-sm">
                    ใช้รูป AI (สุ่มอัตโนมัติเมื่อสุ่มข้อมูล)
                  </Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={generateRandomData} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  สุ่มข้อมูล
                </Button>
                <Button onClick={generateCard} disabled={isGenerating} className="flex-1">
                  {isGenerating ? 'กำลังสร้าง...' : 'สร้างวีซ่า'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
