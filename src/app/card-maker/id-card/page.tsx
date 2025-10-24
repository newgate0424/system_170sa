'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw, Upload, Sparkles } from "lucide-react";

interface IDCardData {
  fullName: string;
  englishName: string;
  idNumber: string;
  birthDate: string;
  issueDate: string;
  expiryDate: string;
  religion: string;
  address: string;
  photo?: string;
}

// Random data generators
const generateRandomIdNumber = (): string => {
  const digits = Array.from({ length: 13 }, () => Math.floor(Math.random() * 10));
  return digits.join('');
};

const generateRandomDate = (minAge: number = 18, maxAge: number = 80): string => {
  const today = new Date();
  const birthYear = today.getFullYear() - Math.floor(Math.random() * (maxAge - minAge + 1)) - minAge;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  
  return `${birthYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
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

export default function IDCardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [cardData, setCardData] = useState<IDCardData>({
    fullName: '',
    englishName: '',
    idNumber: '',
    birthDate: '',
    issueDate: '',
    expiryDate: '',
    religion: 'พุทธ',
    address: '',
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
        const templateImg = new Image();
        templateImg.onload = () => {
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
        };
        templateImg.src = '/card/th/idcard.png';
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
    const expiryYear = issueYear + 10;
    
    const issueDate = `${issueYear}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`;
    const expiryDate = `${expiryYear}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`;
    
    const religions = ['พุทธ', 'อิสลาม', 'คริสต์', 'ฮินดู', 'ซิกข์'];
    const addresses = [
      '123 หมู่ 1 ต.บางใหญ่ อ.บางใหญ่ จ.นนทบุรี 11140',
      '456 ซอยรามคำแหง 24 แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240',
      '789 หมู่ 5 ต.บ้านใหม่ อ.ปากเกร็ด จ.นนทบุรี 11120'
    ];
    
    let photo = cardData.photo;
    if (useAIPhoto) {
      setIsLoadingAI(true);
      const aiPhoto = await generateAIPhoto();
      if (aiPhoto) photo = aiPhoto;
      setIsLoadingAI(false);
    }
    
    setCardData({
      fullName,
      englishName,
      idNumber: generateRandomIdNumber(),
      issueDate,
      expiryDate,
      birthDate,
      religion: religions[Math.floor(Math.random() * religions.length)],
      address: addresses[Math.floor(Math.random() * addresses.length)],
      photo: cardData.photo
    });
  };

  const handleInputChange = (field: keyof IDCardData, value: string) => {
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
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = (date.getFullYear() + 543).toString();
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${day} ${thaiMonths[date.getMonth()]} ${year}`;
  };

  const generateCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);

    try {
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        templateImg.onload = resolve;
        templateImg.onerror = reject;
        templateImg.src = '/card/th/idcard.png';
      });

      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
      ctx.font = '22px "TH Sarabun PSK", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';

      // Draw photo
      if (cardData.photo) {
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve) => {
          userImg.onload = resolve;
          userImg.src = cardData.photo!;
        });

        const photoX = 70, photoY = 200, photoWidth = 140, photoHeight = 160;
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoX, photoY, photoWidth, photoHeight);
        ctx.clip();
        ctx.drawImage(userImg, photoX, photoY, photoWidth, photoHeight);
        ctx.restore();
      }

      // Draw text data
      if (cardData.idNumber) {
        ctx.font = 'bold 24px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillStyle = '#cc0000';
        ctx.fillText(cardData.idNumber, 280, 200);
        ctx.fillStyle = '#000000';
      }

      if (cardData.fullName) {
        ctx.font = 'bold 22px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.fullName, 280, 240);
      }

      if (cardData.englishName) {
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText(cardData.englishName, 280, 270);
      }

      if (cardData.birthDate) {
        ctx.font = '20px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(`เกิดวันที่: ${formatDateThai(cardData.birthDate)}`, 280, 310);
      }

      if (cardData.religion) {
        ctx.fillText(`ศาสนา: ${cardData.religion}`, 280, 340);
      }

      if (cardData.address) {
        ctx.fillText(`ที่อยู่: ${cardData.address}`, 70, 420);
      }

      const dateY = canvas.height - 80;
      if (cardData.issueDate) {
        ctx.font = '16px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(`วันออกบัตร: ${formatDateThai(cardData.issueDate)}`, 50, dateY);
      }

      if (cardData.expiryDate) {
        ctx.fillText(`วันหมดอายุ: ${formatDateThai(cardData.expiryDate)}`, 50, dateY + 25);
      }

    } catch (error) {
      console.error('Error generating ID card:', error);
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
    link.download = 'thai-id-card.png';
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div className="min-h-screen p-6">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ID Card Maker - เครื่องมือสร้างบัตรประชาชนไทย</CardTitle>
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
              <h3 className="text-lg font-semibold">ตัวอย่างบัตรประชาชน</h3>
              <canvas
                ref={canvasRef}
                width={1200}
                height={756}
                className="w-full h-auto rounded-lg shadow-lg bg-white border"
              />
              <Button onClick={downloadCard} className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                ดาวน์โหลดบัตร
              </Button>
            </div>

            {/* Right - Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">ข้อมูลบัตร</h3>
              
              <div className="space-y-3">
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
                  <Label htmlFor="birthDate">วันเกิด</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={cardData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="religion">ศาสนา</Label>
                  <select
                    id="religion"
                    value={cardData.religion}
                    onChange={(e) => handleInputChange('religion', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="พุทธ">พุทธ</option>
                    <option value="อิสลาม">อิสลาม</option>
                    <option value="คริสต์">คริสต์</option>
                    <option value="ฮินดู">ฮินดู</option>
                    <option value="ซิกข์">ซิกข์</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="address">ที่อยู่</Label>
                  <Input
                    id="address"
                    value={cardData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 หมู่ 1 ต.บางใหญ่ อ.บางใหญ่ จ.นนทบุรี 11140"
                  />
                </div>

                <div>
                  <Label htmlFor="issueDate">วันออกบัตร</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={cardData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="expiryDate">วันหมดอายุ</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={cardData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  />
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
                    {isGenerating ? 'กำลังสร้าง...' : 'สร้างบัตร'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
