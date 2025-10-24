'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw, Upload, Sparkles } from "lucide-react";

interface PassportData {
  surname: string;
  title: string;
  firstName: string;
  nameInThai: string;
  sex: string;
  height: string;
  dateOfIssue: string;
  dateOfExpiry: string;
  dateOfBirth: string;
  placeOfBirth: string;
  identificationNo: string;
  passportNo: string;
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

const generateRandomIdNumber = (): string => {
  const digits = Array.from({ length: 13 }, () => Math.floor(Math.random() * 10));
  return digits.join('');
};

const generateRandomDate = (minAge: number = 18, maxAge: number = 80): string => {
  const today = new Date();
  const birthYear = today.getFullYear() - Math.floor(Math.random() * (maxAge - minAge + 1)) - minAge;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${day.toString().padStart(2, '0')} ${months[month - 1]} ${birthYear}`;
};

const generateRandomName = (): { title: string; firstName: string; surname: string; nameInThai: string } => {
  const titles = ['MR.', 'MS.', 'MRS.'];
  const firstNames = ['ALEXANDER', 'BENJAMIN', 'CHRISTOPHER', 'DANIEL', 'EDWARD', 'ISABELLA', 'JENNIFER', 'KATHERINE', 'LILLIAN', 'MARGARET'];
  const surnames = ['ANDERSON', 'BROWN', 'CLARK', 'DAVIS', 'EVANS', 'GARCIA', 'HARRIS', 'JACKSON', 'JOHNSON', 'SMITH'];
  
  const thaiTitles = ['นาย', 'นาง', 'นางสาว'];
  const thaiFirstNames = ['สมชาย', 'สมหญิง', 'วิชัย', 'วรรณา', 'ประเสริฐ', 'สุนีย์', 'อนุชา', 'รัตนา', 'เกียรติ', 'สุดา'];
  const thaiSurnames = ['ใจดี', 'รักดี', 'เจริญ', 'สุขใส', 'ดีงาม', 'มั่งมี', 'เฮงสุข', 'ทองคำ', 'สว่างใส', 'บุญมาก'];
  
  const title = titles[Math.floor(Math.random() * titles.length)];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  
  const thaiTitle = thaiTitles[Math.floor(Math.random() * thaiTitles.length)];
  const thaiFirstName = thaiFirstNames[Math.floor(Math.random() * thaiFirstNames.length)];
  const thaiSurname = thaiSurnames[Math.floor(Math.random() * thaiSurnames.length)];
  const nameInThai = `${thaiTitle}${thaiFirstName} ${thaiSurname}`;
  
  return { title, firstName, surname, nameInThai };
};

const generateRandomPlace = (): string => {
  const places = ['BANGKOK', 'NONTHABURI', 'CHIANG MAI', 'CHIANG RAI', 'PHUKET', 'KRABI', 'NAKHON RATCHASIMA', 'KHON KAEN', 'RAYONG', 'CHANTHABURI'];
  return places[Math.floor(Math.random() * places.length)];
};

export default function PassportPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [cardData, setCardData] = useState<PassportData>({
    surname: '',
    title: '',
    firstName: '',
    nameInThai: '',
    sex: '',
    height: '',
    dateOfIssue: '',
    dateOfExpiry: '',
    dateOfBirth: '',
    placeOfBirth: '',
    identificationNo: '',
    passportNo: '',
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
        bgImage.src = '/card/th/th-id.png';
      } catch (error) {
        console.error('Error loading template:', error);
      }
    };
    initializeCanvas();
  }, []);

  const generateRandomData = async () => {
    const { title, firstName, surname, nameInThai } = generateRandomName();
    const birthDate = generateRandomDate();
    const issueYear = new Date().getFullYear() - Math.floor(Math.random() * 5);
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

    setCardData({
      photo,
      surname,
      title,
      firstName,
      nameInThai,
      sex: Math.random() > 0.5 ? 'M' : 'F',
      height: (Math.floor(Math.random() * 40) + 150).toString() + ' CM',
      dateOfIssue: `${issueDay.toString().padStart(2, '0')} ${issueMonth} ${issueYear}`,
      dateOfExpiry: `${expiryDay.toString().padStart(2, '0')} ${expiryMonth} ${expiryYear}`,
      dateOfBirth: birthDate,
      placeOfBirth: generateRandomPlace(),
      identificationNo: generateRandomIdNumber(),
      passportNo: generateRandomPassportNo()
    });
  };

  const handleInputChange = (field: keyof PassportData, value: string) => {
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

      canvas.width = 1800;
      canvas.height = 1200;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cardTemplate = new Image();
      cardTemplate.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        cardTemplate.onload = () => resolve();
        cardTemplate.onerror = () => reject(new Error('Failed to load template'));
        cardTemplate.src = '/card/th/th-id.png';
      });

      ctx.drawImage(cardTemplate, 0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';

      // Passport Number
      if (cardData.passportNo) {
        ctx.font = 'bold 31px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.passportNo, 1162, 222);
      }

      // Surname
      if (cardData.surname) {
        ctx.font = 'bold 31px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.surname, 554, 292);
      }

      // Title + First Name
      if (cardData.title && cardData.firstName) {
        ctx.font = 'bold 31px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(`${cardData.title} ${cardData.firstName}`, 554, 366);
      }

      // Thai Name
      if (cardData.nameInThai) {
        ctx.font = 'bold 34px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.nameInThai, 554, 443);
      }

      // Sex
      if (cardData.sex) {
        ctx.font = 'bold 31px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.sex, 554, 591);
      }

      // Height
      if (cardData.height) {
        ctx.font = 'bold 31px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.height, 554, 664);
      }

      // Date of Issue
      if (cardData.dateOfIssue) {
        ctx.font = 'bold 31px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.dateOfIssue, 554, 737);
      }

      // Date of Expiry
      if (cardData.dateOfExpiry) {
        ctx.font = 'bold 31px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.dateOfExpiry, 554, 806);
      }

      // Date of Birth
      if (cardData.dateOfBirth) {
        ctx.font = 'bold 31px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.dateOfBirth, 827, 520);
      }

      // Place of Birth
      if (cardData.placeOfBirth) {
        ctx.font = 'bold 31px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.placeOfBirth, 827, 590);
      }

      // ID Number
      if (cardData.identificationNo) {
        ctx.font = 'bold 31px "TH Sarabun PSK", Arial, sans-serif';
        ctx.fillText(cardData.identificationNo, 1170, 521);
      }

      // Photo
      if (cardData.photo && cardData.photo.startsWith('data:')) {
        try {
          const photo = new Image();
          await new Promise<void>((resolve, reject) => {
            photo.onload = () => resolve();
            photo.onerror = () => reject(new Error('Failed to load photo'));
            photo.src = cardData.photo!;
          });

          const mainX = 125, mainY = 375, mainW = 390, mainH = 445;
          ctx.save();
          ctx.beginPath();
          ctx.rect(mainX, mainY, mainW, mainH);
          ctx.clip();
          ctx.drawImage(photo, mainX, mainY, mainW, mainH);
          ctx.restore();

          const smallX = 944, smallY = 646, smallW = 156, smallH = 167;
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.drawImage(photo, smallX, smallY, smallW, smallH);
          ctx.restore();
        } catch (error) {
          console.error('Photo loading failed:', error);
        }
      }

    } catch (error) {
      console.error('Error generating passport:', error);
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
    link.download = 'thai-passport.png';
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div className="min-h-screen p-6">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Passport Maker - เครื่องมือสร้างหนังสือเดินทางไทย</CardTitle>
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
              <h3 className="text-lg font-semibold">ตัวอย่างหนังสือเดินทาง</h3>
              <canvas
                ref={canvasRef}
                width={1800}
                height={1200}
                className="w-full h-auto rounded-lg shadow-lg bg-white border"
                style={{ maxWidth: '700px', aspectRatio: '1800/1200' }}
              />
              <Button onClick={downloadCard} className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                ดาวน์โหลดหนังสือเดินทาง
              </Button>
            </div>

            {/* Right - Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">ข้อมูลหนังสือเดินทาง</h3>
              
              <div className="grid grid-cols-2 gap-3">
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
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={cardData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Mr./Ms./Mrs."
                  />
                </div>

                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={cardData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="ชื่อ (อังกฤษ)"
                  />
                </div>

                <div>
                  <Label htmlFor="nameInThai">Name in Thai</Label>
                  <Input
                    id="nameInThai"
                    value={cardData.nameInThai}
                    onChange={(e) => handleInputChange('nameInThai', e.target.value)}
                    placeholder="ชื่อ-นามสกุล (ไทย)"
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
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={cardData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    placeholder="170 CM"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfIssue">Date of Issue</Label>
                  <Input
                    id="dateOfIssue"
                    value={cardData.dateOfIssue}
                    onChange={(e) => handleInputChange('dateOfIssue', e.target.value)}
                    placeholder="01 JAN 2020"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfExpiry">Date of Expiry</Label>
                  <Input
                    id="dateOfExpiry"
                    value={cardData.dateOfExpiry}
                    onChange={(e) => handleInputChange('dateOfExpiry', e.target.value)}
                    placeholder="01 JAN 2030"
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
                  <Label htmlFor="placeOfBirth">Place of Birth</Label>
                  <Input
                    id="placeOfBirth"
                    value={cardData.placeOfBirth}
                    onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                    placeholder="Bangkok"
                  />
                </div>

                <div>
                  <Label htmlFor="identificationNo">ID No. (13 หลัก)</Label>
                  <Input
                    id="identificationNo"
                    value={cardData.identificationNo}
                    onChange={(e) => handleInputChange('identificationNo', e.target.value)}
                    placeholder="1234567890123"
                    maxLength={13}
                  />
                </div>

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
                  {isGenerating ? 'กำลังสร้าง...' : 'สร้างหนังสือเดินทาง'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
