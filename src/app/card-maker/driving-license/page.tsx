'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw, Upload, Sparkles } from "lucide-react";

interface DrivingLicenseData {
  fullName: string;
  englishName: string;
  idNumber: string;
  licenseNumber: string;
  birthDate: string;
  issueDate: string;
  expiryDate: string;
  photo?: string;
}

const generateRandomLicenseNo = (): string => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const generateRandomIdNumber = (): string => {
  const digits = Array.from({ length: 13 }, () => Math.floor(Math.random() * 10));
  return digits.join('');
};

const generateRandomDate = (minAge: number = 18, maxAge: number = 80): string => {
  const today = new Date();
  const birthYear = today.getFullYear() - Math.floor(Math.random() * (maxAge - minAge + 1)) - minAge;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${birthYear}`;
};

const generateRandomName = (): { fullName: string; englishName: string } => {
  const thaiTitles = ['นาย', 'นาง', 'นางสาว'];
  const thaiFirstNames = ['สมชาย', 'สมหญิง', 'วิชัย', 'วรรณา', 'ประเสริฐ', 'สุนีย์', 'อนุชา', 'รัตนา', 'เกียรติ', 'สุดา'];
  const thaiSurnames = ['ใจดี', 'รักดี', 'เจริญ', 'สุขใส', 'ดีงาม', 'มั่งมี', 'เฮงสุข', 'ทองคำ', 'สว่างใส', 'บุญมาก'];
  
  const engTitles = ['MR.', 'MS.', 'MRS.'];
  const engFirstNames = ['SOMCHAI', 'SOMYING', 'WICHAI', 'WANNA', 'PRASERT', 'SUNEE', 'ANUCHA', 'RATANA', 'KIAT', 'SUDA'];
  const engSurnames = ['JAIDEE', 'RAKDEE', 'CHAROEN', 'SUKJAI', 'DINGAM', 'MANGMEE', 'HENGSUK', 'THONGKHAM', 'SAWANGJAI', 'BUNMAK'];
  
  const thaiTitle = thaiTitles[Math.floor(Math.random() * thaiTitles.length)];
  const thaiFirstName = thaiFirstNames[Math.floor(Math.random() * thaiFirstNames.length)];
  const thaiSurname = thaiSurnames[Math.floor(Math.random() * thaiSurnames.length)];
  const fullName = `${thaiTitle}${thaiFirstName} ${thaiSurname}`;
  
  const engTitle = engTitles[Math.floor(Math.random() * engTitles.length)];
  const engFirstName = engFirstNames[Math.floor(Math.random() * engFirstNames.length)];
  const engSurname = engSurnames[Math.floor(Math.random() * engSurnames.length)];
  const englishName = `${engTitle} ${engFirstName} ${engSurname}`;
  
  return { fullName, englishName };
};

export default function DrivingLicensePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [cardData, setCardData] = useState<DrivingLicenseData>({
    fullName: '',
    englishName: '',
    idNumber: '',
    licenseNumber: '',
    birthDate: '',
    issueDate: '',
    expiryDate: '',
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
      return undefined;
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
        const templateImg = new Image();
        templateImg.onload = () => {
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
        };
        templateImg.src = '/card/th/driving.png';
      } catch (error) {
        console.error('Error loading template:', error);
      }
    };
    initializeCanvas();
  }, []);

  const generateRandomData = async () => {
    const { fullName, englishName } = generateRandomName();
    const birthDate = generateRandomDate();
    const today = new Date();
    const issueYear = today.getFullYear() - Math.floor(Math.random() * 5);
    const expiryYear = issueYear + 5;
    
    const issueDate = `${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}/${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}/${issueYear}`;
    const expiryDate = `${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}/${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}/${expiryYear}`;
    
    // ถ้าเลือกใช้รูป AI ให้สุ่มรูปด้วย
    let photo = cardData.photo;
    if (useAIPhoto) {
      setIsLoadingAI(true);
      photo = await generateAIPhoto();
      setIsLoadingAI(false);
    }
    
    setCardData({
      fullName,
      englishName,
      idNumber: generateRandomIdNumber(),
      licenseNumber: generateRandomLicenseNo(),
      birthDate,
      issueDate,
      expiryDate,
      photo
    });
  };

  const handleInputChange = (field: keyof DrivingLicenseData, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCardData(prev => ({ ...prev, photo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDateThai = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString;
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const monthIndex = parseInt(month) - 1;
    const thaiYear = parseInt(year) + 543;
    return `${parseInt(day)} ${thaiMonths[monthIndex]} ${thaiYear}`;
  };

  const formatDateEnglish = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString;
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const englishMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = parseInt(month) - 1;
    return `${parseInt(day)} ${englishMonths[monthIndex]} ${year}`;
  };

  const generateCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);

    // ตั้งค่าขนาด Canvas (ขนาดใหญ่สำหรับการดาวน์โหลด)
    const scale = 2.0;
    canvas.width = 2400;
    canvas.height = 1512;

    try {
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        templateImg.onload = resolve;
        templateImg.onerror = reject;
        templateImg.src = '/card/th/driving.png';
      });

      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

      // Draw photo
      if (cardData.photo) {
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve) => {
          userImg.onload = resolve;
          userImg.src = cardData.photo!;
        });

        const photoX = 60 * scale, photoY = 310 * scale, photoWidth = 240 * scale, photoHeight = 300 * scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoX, photoY, photoWidth, photoHeight);
        ctx.clip();
        ctx.drawImage(userImg, photoX, photoY, photoWidth, photoHeight);
        ctx.restore();
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';

      // License number (Thai)
      if (cardData.licenseNumber) {
        ctx.font = `bold ${40 * scale}px Arial, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(cardData.licenseNumber, 630 * scale, 184 * scale);
      }

      // License number (English)
      if (cardData.licenseNumber) {
        ctx.font = `bold ${40 * scale}px Arial, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(cardData.licenseNumber, 960 * scale, 186 * scale);
      }

      // Issue date (Thai)
      if (cardData.issueDate) {
        ctx.font = `bold ${27 * scale}px "TH Sarabun PSK", Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(formatDateThai(cardData.issueDate), 480 * scale, 235 * scale);
      }

      // Issue date (English)
      if (cardData.issueDate) {
        ctx.font = `bold ${27 * scale}px Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(formatDateEnglish(cardData.issueDate), 490 * scale, 262 * scale);
      }

      // Expiry date (Thai)
      if (cardData.expiryDate) {
        ctx.font = `bold ${27 * scale}px "TH Sarabun PSK", Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(formatDateThai(cardData.expiryDate), 880 * scale, 235 * scale);
      }

      // Expiry date (English)
      if (cardData.expiryDate) {
        ctx.font = `bold ${27 * scale}px Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(formatDateEnglish(cardData.expiryDate), 890 * scale, 260 * scale);
      }

      // Full name (Thai)
      if (cardData.fullName) {
        ctx.font = `bold ${38 * scale}px "TH Sarabun PSK", Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(cardData.fullName, 430 * scale, 380 * scale);
      }

      // English name
      if (cardData.englishName) {
        ctx.font = `bold ${30 * scale}px Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(cardData.englishName, 430 * scale, 430 * scale);
      }

      // Birth date (Thai)
      if (cardData.birthDate) {
        ctx.font = `bold ${26 * scale}px "TH Sarabun PSK", Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(formatDateThai(cardData.birthDate), 490 * scale, 520 * scale);
      }

      // Birth date (English)
      if (cardData.birthDate) {
        ctx.font = `bold ${26 * scale}px Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(formatDateEnglish(cardData.birthDate), 490 * scale, 560 * scale);
      }

      // ID Number
      if (cardData.idNumber) {
        ctx.font = `bold ${26 * scale}px Arial, sans-serif`;
        ctx.textAlign = 'left';
        const formattedId = `${cardData.idNumber.slice(0,1)} ${cardData.idNumber.slice(1,5)} ${cardData.idNumber.slice(5,10)} ${cardData.idNumber.slice(10,12)} ${cardData.idNumber.slice(12,13)}`;
        ctx.fillText(formattedId, 740 * scale, 600 * scale);
      }

      // วาด Hologram 6 จุด
      const hologramImg = new Image();
      hologramImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve) => {
        hologramImg.onload = resolve;
        hologramImg.onerror = () => resolve(null);
        hologramImg.src = '/card/th/hologram.png';
      });

      if (hologramImg.complete && hologramImg.naturalWidth > 0) {
        const hologramSize = 250 * scale;
        const hologramPositions = [
          { x: 150 * scale, y: 100 * scale, opacity: 0.35, brightness: 1.1, rotate: 0 },
          { x: 480 * scale, y: 100 * scale, opacity: 0.15, brightness: 0.85, rotate: 45 },
          { x: 880 * scale, y: 100 * scale, opacity: 0.18, brightness: 1.2, rotate: 90 },
          { x: 220 * scale, y: 460 * scale, opacity: 0.3, brightness: 0.6, rotate: 180 },
          { x: 600 * scale, y: 460 * scale, opacity: 0.20, brightness: 1.15, rotate: 270 },
          { x: 980 * scale, y: 460 * scale, opacity: 0.16, brightness: 0.95, rotate: 135 },
        ];

        hologramPositions.forEach(pos => {
          ctx.save();
          ctx.globalAlpha = pos.opacity;
          ctx.translate(pos.x + hologramSize / 2, pos.y + hologramSize / 2);
          ctx.rotate((pos.rotate * Math.PI) / 180);
          ctx.filter = `grayscale(30%) brightness(${pos.brightness})`;
          ctx.drawImage(hologramImg, -hologramSize / 2, -hologramSize / 2, hologramSize, hologramSize);
          ctx.restore();
        });
      }

      // เพิ่มเอฟเฟกต์ Film Grain / Noise
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 8;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
        
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
        const vignette = 1 - (distance / maxDistance) * 0.15;
        
        data[i] *= vignette;
        data[i + 1] *= vignette;
        data[i + 2] *= vignette;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // ปรับโทนสีให้ดูอบอุ่นขึ้น
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(255, 230, 200, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      
      // ลดความคมชัดเล็กน้อย
      ctx.filter = 'blur(0.3px)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';

    } catch (error) {
      console.error('Error generating driving license:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [cardData]);

  useEffect(() => {
    generateCard();
  }, [generateCard]);

  useEffect(() => {
    if (cardData.photo && cardData.fullName) {
      const timer = setTimeout(() => {
        generateCard();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [cardData.photo, cardData.fullName, generateCard]);

  const downloadCard = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'thai-driving-license.png';
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div className="min-h-screen p-6">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Driving License Maker - เครื่องมือสร้างใบขับขี่ไทย</CardTitle>
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
              <h3 className="text-lg font-semibold">ตัวอย่างใบขับขี่</h3>
              <canvas
                ref={canvasRef}
                width={1200}
                height={756}
                className="w-full h-auto rounded-lg shadow-lg bg-white border"
              />
              <Button onClick={downloadCard} className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                ดาวน์โหลดใบขับขี่
              </Button>
            </div>

            {/* Right - Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">ข้อมูลใบขับขี่</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fullName">ชื่อ-นามสกุล (ไทย)</Label>
                  <Input
                    id="fullName"
                    value={cardData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="นายสมชาย ใจดี"
                  />
                </div>

                <div>
                  <Label htmlFor="englishName">ชื่อ-นามสกุล (อังกฤษ)</Label>
                  <Input
                    id="englishName"
                    value={cardData.englishName}
                    onChange={(e) => handleInputChange('englishName', e.target.value)}
                    placeholder="MR. SOMCHAI JAIDEE"
                  />
                </div>

                <div>
                  <Label htmlFor="idNumber">เลขบัตรประชาชน</Label>
                  <Input
                    id="idNumber"
                    value={cardData.idNumber}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    placeholder="1234567890123"
                    maxLength={13}
                  />
                </div>

                <div>
                  <Label htmlFor="licenseNumber">เลขใบขับขี่</Label>
                  <Input
                    id="licenseNumber"
                    value={cardData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <Label htmlFor="birthDate">วันเกิด</Label>
                  <Input
                    id="birthDate"
                    value={cardData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    placeholder="19/02/1990"
                  />
                  <p className="text-xs text-gray-500 mt-1">รูปแบบ: DD/MM/YYYY</p>
                </div>

                <div>
                  <Label htmlFor="issueDate">วันออกบัตร</Label>
                  <Input
                    id="issueDate"
                    value={cardData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                    placeholder="01/01/2020"
                  />
                  <p className="text-xs text-gray-500 mt-1">รูปแบบ: DD/MM/YYYY</p>
                </div>

                <div>
                  <Label htmlFor="expiryDate">วันหมดอายุ</Label>
                  <Input
                    id="expiryDate"
                    value={cardData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    placeholder="01/01/2025"
                  />
                  <p className="text-xs text-gray-500 mt-1">รูปแบบ: DD/MM/YYYY</p>
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
                  {isGenerating ? 'กำลังสร้าง...' : 'สร้างใบขับขี่'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
