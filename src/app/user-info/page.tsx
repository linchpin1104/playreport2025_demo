'use client';

import { User, Baby, Phone, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserInfo } from '@/types';

export default function UserInfoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userInfo, setUserInfo] = useState<Partial<UserInfo>>({
    caregiverName: '',
    phoneNumber: '',
    caregiverType: undefined,
    childAge: undefined,
    childName: '',
    childGender: undefined,
    additionalNotes: ''
  });

  const handleInputChange = (field: keyof UserInfo, value: string | number) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!userInfo.caregiverName?.trim()) {
      setError('양육자 이름을 입력해주세요.');
      return false;
    }
    if (!userInfo.phoneNumber?.trim()) {
      setError('전화번호를 입력해주세요.');
      return false;
    }
    if (!userInfo.caregiverType) {
      setError('양육자 타입을 선택해주세요.');
      return false;
    }
    if (!userInfo.childAge || userInfo.childAge < 0 || userInfo.childAge > 12) {
      setError('아이 연령을 올바르게 입력해주세요. (0-12세)');
      return false;
    }
    if (!userInfo.childName?.trim()) {
      setError('아이 이름을 입력해주세요.');
      return false;
    }
    if (!userInfo.childGender) {
      setError('아이 성별을 선택해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const completeUserInfo: UserInfo = {
        caregiverName: userInfo.caregiverName!.trim(),
        phoneNumber: userInfo.phoneNumber!.trim(),
        caregiverType: userInfo.caregiverType!,
        childAge: userInfo.childAge!,
        childName: userInfo.childName!.trim(),
        childGender: userInfo.childGender!,
        additionalNotes: userInfo.additionalNotes?.trim() || '',
        submittedAt: new Date().toISOString()
      };

      // 사용자 정보를 localStorage에 임시 저장
      localStorage.setItem('tempUserInfo', JSON.stringify(completeUserInfo));
      
      // 업로드 페이지로 이동
      router.push('/upload');

    } catch (err) {
      setError(err instanceof Error ? err.message : '정보 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            사용자 정보 입력
          </h1>
          <p className="text-gray-600">
            놀이영상 분석을 위해 양육자와 아이의 정보를 입력해주세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              기본 정보
            </CardTitle>
            <CardDescription>
              분석 결과에 표시될 정보입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 양육자 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caregiverName">양육자 이름 *</Label>
                <Input
                  id="caregiverName"
                  value={userInfo.caregiverName || ''}
                  onChange={(e) => handleInputChange('caregiverName', e.target.value)}
                  placeholder="예: 김영희"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">전화번호 *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    className="pl-10"
                    value={userInfo.phoneNumber || ''}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caregiverType">양육자 타입 *</Label>
              <Select
                value={userInfo.caregiverType}
                onValueChange={(value) => handleInputChange('caregiverType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="양육자 타입을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="엄마">엄마</SelectItem>
                  <SelectItem value="아빠">아빠</SelectItem>
                  <SelectItem value="조부모">조부모</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 아이 정보 */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Baby className="w-5 h-5" />
                아이 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="childName">아이 이름 *</Label>
                  <Input
                    id="childName"
                    value={userInfo.childName || ''}
                    onChange={(e) => handleInputChange('childName', e.target.value)}
                    placeholder="예: 민준"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="childAge">아이 연령 (만 나이) *</Label>
                  <Input
                    id="childAge"
                    type="number"
                    min="0"
                    max="12"
                    value={userInfo.childAge || ''}
                    onChange={(e) => handleInputChange('childAge', parseInt(e.target.value))}
                    placeholder="예: 3"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="childGender">아이 성별 *</Label>
                <Select
                  value={userInfo.childGender}
                  onValueChange={(value) => handleInputChange('childGender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="성별을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="남자">남자</SelectItem>
                    <SelectItem value="여자">여자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="additionalNotes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  추가 정보 (선택사항)
                </Label>
                <Textarea
                  id="additionalNotes"
                  value={userInfo.additionalNotes || ''}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  placeholder="특별히 관찰하고 싶은 부분이나 아이의 특성 등을 자유롭게 적어주세요"
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1"
              >
                이전
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? '저장 중...' : '다음 단계로'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            * 표시된 항목은 필수 입력 사항입니다
          </p>
        </div>
      </div>
    </div>
  );
} 