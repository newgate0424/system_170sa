'use client';

import { useEffect, useState, memo, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adserTeamGroups, cpmThresholds, costPerDepositThresholds, depositsMonthlyTargets, calculateDailyTarget, calculateMonthlyTarget, coverTargets } from '@/lib/adser-config';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Label as RechartsLabel } from 'recharts';
import useSWR from 'swr';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Wifi, ChevronRight, ChevronLeft, TrendingUp, Settings, PlusCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.locale('th');

// --- Interfaces & Types ---
interface ColorRule {
  id?: string;
  team: string;
  columnName: string;
  conditionType: 'GREATER' | 'LESS' | 'BETWEEN';
  unitType: 'NUMBER' | 'PERCENT';
  value1: number;
  value2: number | null;
  color: string;
  textColor: string;
  isBold: boolean;
  priority: number;
  isActive: boolean;
}

interface DailyDataPoint {
    date: string;
    value: number;
}
interface TeamMetric {
    team_name: string;
    total_inquiries: number;
    planned_inquiries: number;
    actual_spend: number;
    planned_daily_spend: number;
    net_inquiries: number;
    wasted_inquiries: number;
    deposits_count: number;
    cpm_cost_per_inquiry: number;
    cost_per_deposit: number;
    new_player_value_thb: number;
    one_dollar_per_cover: number;
    cpm_cost_per_inquiry_daily: DailyDataPoint[];
    cost_per_deposit_daily: DailyDataPoint[];
    deposits_count_daily: DailyDataPoint[];
    one_dollar_per_cover_daily: DailyDataPoint[];
    silent_inquiries: number;
    repeat_inquiries: number;
    existing_user_inquiries: number;
    spam_inquiries: number;
    blocked_inquiries: number;
    under_18_inquiries: number;
    over_50_inquiries: number;
    foreigner_inquiries: number;
    actual_spend_daily: DailyDataPoint[];
    total_inquiries_daily: DailyDataPoint[];
    new_player_value_thb_daily: DailyDataPoint[];
}
interface TransformedChartData {
    date: string;
    [key: string]: any;
}

// --- Constants & Configs ---
const teamColors: { [key: string]: string } = {
    'Boogey': '#3b82f6', 'Bubble': '#16a34a', 'Lucifer': '#db2777', 'Risa': '#f78c00ff',
    'Shazam': '#5f6669ff', 'Vivien': '#dc266cff', 'Sim': '#f59e0b', 'Joanne': '#0181a1ff',
    'Cookie': '#3b82f6', 'Piea': '#16a34a', 'บาล้าน': '#db2777', 'หวยม้า': '#f78c00ff',
    'Thomas': '#5f6669ff', 'IU': '#dc266cff', 'Nolan': '#f59e0b', 'Minho': '#0181a1ff',
    'Bailu': '#3b82f6',
};
const groupYAxisMax: { [key: string]: { cpm: number; costPerDeposit: number; cover: number; } } = {
    'สาวอ้อย': { cpm: 2.5, costPerDeposit: 35, cover: 15 },
    'อลิน': { cpm: 2.5, costPerDeposit: 35, cover: 15 },
    'อัญญา C': { cpm: 2.5, costPerDeposit: 35, cover: 15 },
    'อัญญา D': { cpm: 2.5, costPerDeposit: 35, cover: 15 },
    'Spezbar': { cpm: 4.5, costPerDeposit: 80, cover: 10 },
    'Barlance': { cpm: 4.5, costPerDeposit: 80, cover: 10 },
    'Football Area': { cpm: 6.5, costPerDeposit: 120, cover: 8 },
    'Football Area(Haru)': { cpm: 6.5, costPerDeposit: 120, cover: 8 },
};
const filterFrameClass = "inline-flex items-center gap-1 rounded-md border border-input bg-muted/50 h-9 px-2 shadow-sm";
const allConfigurableFields = {
    net_inquiries: { name: 'ยอดทักสุทธิ', unit: null },
    wasted_inquiries: { name: 'ยอดเสีย', unit: '%' },
    cpm_cost_per_inquiry: { name: 'CPM', unit: '$' },
    deposits_count: { name: 'ยอดเติม', unit: null },
    cost_per_deposit: { name: 'ทุน/เติม', unit: '$' },
    new_player_value_thb: { name: 'ยอดเล่นใหม่', unit: '฿' },
    one_dollar_per_cover: { name: '1$/Cover', unit: '$' },
    silent_inquiries: { name: 'เงียบ', unit: '%' },
    repeat_inquiries: { name: 'ซ้ำ', unit: '%' },
    existing_user_inquiries: { name: 'มียูส', unit: '%' },
    spam_inquiries: { name: 'ก่อกวน', unit: '%' },
    blocked_inquiries: { name: 'บล็อก', unit: '%' },
    under_18_inquiries: { name: '<18', unit: '%' },
    over_50_inquiries: { name: '>50', unit: '%' },
    foreigner_inquiries: { name: 'ต่างชาติ', unit: '%' }
};

// Preset colors for quick selection
const presetColors = [
  { name: 'แดง', bg: '#ef4444', text: '#ffffff' },
  { name: 'ส้ม', bg: '#f97316', text: '#ffffff' },
  { name: 'เหลือง', bg: '#eab308', text: '#000000' },
  { name: 'เขียว', bg: '#22c55e', text: '#ffffff' },
  { name: 'ฟ้า', bg: '#3b82f6', text: '#ffffff' },
  { name: 'ม่วง', bg: '#a855f7', text: '#ffffff' },
  { name: 'เทา', bg: '#6b7280', text: '#ffffff' },
  { name: 'ชมพู', bg: '#ec4899', text: '#ffffff' },
];

// --- Helper Functions ---
const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch')));
const formatNumber = (value: number | string, options: Intl.NumberFormatOptions = {}): string => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toLocaleString('en-US', options);
};

// --- UI Components ---
const RealTimeStatus = memo(({ lastUpdate }: { lastUpdate: Date | null }) => {
    const [timeAgo, setTimeAgo] = useState('');
    useEffect(() => {
        const update = () => lastUpdate && setTimeAgo(dayjs(lastUpdate).fromNow());
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [lastUpdate]);
    return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
            <Wifi className="h-3 w-3 text-green-500" />
            <span className="text-green-600">อัพเดท: {timeAgo}</span>
        </div>
    );
});
RealTimeStatus.displayName = 'RealTimeStatus';

const ExchangeRateSmall = memo(({ rate, isLoading, isFallback }: { rate: number | null, isLoading: boolean, isFallback: boolean }) => {
    if (isLoading) return <Skeleton className="h-6 w-16" />;
    return (
        <div className={cn("rounded px-2 py-1 text-xs font-medium", isFallback ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700")}>
            {isFallback && "⚠️ "}฿{rate ? formatNumber(rate, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
        </div>
    );
});
ExchangeRateSmall.displayName = 'ExchangeRateSmall';

const ProgressCell = memo(({ value, total, isCurrency = false }: { value: number; total: number; isCurrency?: boolean }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const progressBarColor = isCurrency ? (percentage > 150 ? 'bg-red-500/80' : percentage > 100 ? 'bg-yellow-400/80' : 'bg-green-500/80') : (percentage >= 100 ? 'bg-green-500/80' : percentage >= 80 ? 'bg-yellow-400/80' : 'bg-red-500/80');
    return (
        <div className="flex flex-col w-36">
            <div className="flex justify-between items-baseline text-sm">
                <span className="font-medium">{isCurrency ? '$' : ''}{formatNumber(value, { maximumFractionDigits: 0 })}</span>
                <span className="text-xs text-muted-foreground">/ {formatNumber(total)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full', progressBarColor)} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
                <span className="text-sm font-medium text-primary w-12 text-right">{percentage.toFixed(1)}%</span>
            </div>
        </div>
    );
});
ProgressCell.displayName = 'ProgressCell';

const FinancialMetric = memo(({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) => (
    <div className="text-sm font-medium">
        {prefix}{formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
    </div>
));
FinancialMetric.displayName = 'FinancialMetric';

const BreakdownCell = memo(({ value, total }: { value: number, total: number }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="text-center w-[60px] flex-shrink-0 mx-auto">
            <div className="text-sm font-medium leading-tight">{formatNumber(value)}</div>
            <div className="text-xs text-muted-foreground leading-tight">({percentage.toFixed(1)}%)</div>
        </div>
    );
});

const GroupedChart = memo(({ title, data, yAxisLabel, loading, teamsToShow, chartType, dateForTarget, yAxisDomainMax, groupName, graphView }: { title: string; data: TransformedChartData[]; yAxisLabel: string; loading: boolean; teamsToShow: string[]; chartType: 'cpm' | 'costPerDeposit' | 'deposits' | 'cover'; dateForTarget?: Date; yAxisDomainMax?: number; groupName?: string; graphView: 'daily' | 'monthly'; }) => {
    const previousDataRef = useRef<TransformedChartData[]>([]);
    const displayData = useMemo(() => {
        if (loading && previousDataRef.current.length > 0) return previousDataRef.current;
        if (!loading && data.length > 0) previousDataRef.current = data;
        return data;
    }, [data, loading]);
    const formatYAxis = (tickItem: number) => `${yAxisLabel}${tickItem.toFixed(1)}`;
    const tickFormatter = (date: string) => graphView === 'monthly' ? dayjs(date).format('MMM') : dayjs(date).format('DD');
    const targets = useMemo(() => {
        const targetMap = new Map<string, number>();
        teamsToShow.forEach(teamName => {
            if (chartType === 'cpm') targetMap.set(teamName, cpmThresholds[teamName] || 0);
            else if (chartType === 'costPerDeposit') targetMap.set(teamName, costPerDepositThresholds[teamName] || 0);
            else if (chartType === 'deposits' && dateForTarget) {
                const monthlyTarget = depositsMonthlyTargets[teamName] || 0;
                const teamSize = teamsToShow.length;
                targetMap.set(teamName, graphView === 'monthly' ? calculateMonthlyTarget(monthlyTarget, teamSize) : calculateDailyTarget(monthlyTarget, dayjs(dateForTarget).format('YYYY-MM-DD'), teamSize));
            } else if (chartType === 'cover' && groupName && coverTargets[groupName]) {
                targetMap.set(teamName, coverTargets[groupName]);
            }
        });
        return targetMap;
    }, [chartType, dateForTarget, teamsToShow, groupName, graphView]);

    if (loading && displayData.length === 0) return <Skeleton className="w-full h-[250px]" />;

    return (
        <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-4">
            <div className="pb-3">
                <h3 className="text-base flex items-center justify-between">
                    {title}
                    {loading && displayData.length > 0 && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                </h3>
            </div>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayData} margin={{ top: 5, right: 30, left: -10, bottom: 20 }} key={`${title}-${graphView}`}>
                        <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10 }} domain={[0, yAxisDomainMax || 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} formatter={(value: number, name: string) => [`${yAxisLabel}${formatNumber(value, { maximumFractionDigits: 2 })}`, name]} labelFormatter={(label) => dayjs(label).format('D MMMM YY')} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        {teamsToShow.map(teamName => <Line key={teamName} type="monotone" dataKey={teamName} stroke={teamColors[teamName] || '#8884d8'} strokeWidth={1.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />)}
                        {chartType === 'cover' && groupName && coverTargets[groupName] && <ReferenceLine y={coverTargets[groupName]} stroke="#ef4444" strokeDasharray="6 6" strokeWidth={1}><RechartsLabel value={`${coverTargets[groupName]}`} position="right" fill="#ef4444" fontSize={11} fontWeight="normal" /></ReferenceLine>}
                        {chartType !== 'cover' && Array.from(targets.entries()).map(([teamName, targetValue]) => targetValue > 0 ? <ReferenceLine key={`${teamName}-target`} y={targetValue} stroke={teamColors[teamName] || '#8884d8'} strokeDasharray="4 4" strokeWidth={1}><RechartsLabel value={formatNumber(targetValue, { maximumFractionDigits: 2 })} position="right" fill={teamColors[teamName] || '#8884d8'} fontSize={10} /></ReferenceLine> : null)}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
});

// Color Settings Popover Component - ใช้ระบบเดียวกับ /overview
const ColorSettingsPopover = memo(({ groupName, teamNames, colorRules, onRefresh }: { 
  groupName: string; 
  teamNames: string[]; 
  colorRules: ColorRule[];
  onRefresh: () => void;
}) => {
    const [open, setOpen] = useState(false);
    const [editingRules, setEditingRules] = useState<Record<string, Partial<ColorRule>>>({});
    const representativeTeam = teamNames[0] || '';

    const updateRuleField = (ruleId: string, field: keyof ColorRule, value: any) => {
        setEditingRules(prev => ({
            ...prev,
            [ruleId]: { ...prev[ruleId], [field]: value }
        }));
    };

    const hasChanges = (ruleId: string): boolean => {
        return editingRules[ruleId] !== undefined && Object.keys(editingRules[ruleId]).length > 0;
    };

    const saveRuleChanges = async (ruleId: string) => {
        const changes = editingRules[ruleId];
        if (!changes) return;

        // หา rule ที่กำลังแก้
        const currentRule = colorRules.find(r => r.id === ruleId);
        if (!currentRule) return;

        try {
            // อัพเดททุกคนในทีมที่มี columnName เดียวกันและ priority เดียวกัน
            const promises = teamNames.map(async (teamName) => {
                const matchingRule = colorRules.find(
                    r => r.team === teamName && 
                         r.columnName === currentRule.columnName && 
                         r.priority === currentRule.priority &&
                         r.isActive
                );
                if (matchingRule && matchingRule.id) {
                    return fetch(`/api/color-rules/${matchingRule.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(changes)
                    });
                }
            });

            await Promise.all(promises.filter(Boolean));
            toast.success(`บันทึกการเปลี่ยนแปลงสำหรับ ${teamNames.length} คนสำเร็จ`);
            setEditingRules(prev => {
                const newState = { ...prev };
                delete newState[ruleId];
                return newState;
            });
            onRefresh();
        } catch (err) {
            console.error('Error saving rules:', err);
            toast.error('เกิดข้อผิดพลาด');
        }
    };

    const colorableColumns = Object.keys(allConfigurableFields);

    return (
        <>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent hover:text-accent-foreground" onClick={() => setOpen(true)}>
                <Settings className="h-4 w-4" />
            </Button>
            
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative bg-background border rounded-lg shadow-lg w-[700px] max-w-[90vw] max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex-shrink-0">
                            <h4 className="font-medium text-lg">ตั้งค่าสีสำหรับกลุ่ม: {groupName}</h4>
                            <p className="text-sm text-muted-foreground">การตั้งค่านี้จะใช้กับทีมทั้งหมดในกลุ่ม: {teamNames.join(', ')}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-3">
                                {colorableColumns.map((column) => {
                                    const rulesForColumn = colorRules.filter(
                                        rule => rule.team === representativeTeam && rule.columnName === column && rule.isActive
                                    ).sort((a, b) => a.priority - b.priority);

                                    return (
                                        <div key={column} className="space-y-2 p-3 border rounded-lg bg-muted/50">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-bold">{allConfigurableFields[column as keyof typeof allConfigurableFields]?.name || column}</Label>
                                                <Button size="sm" variant="ghost" onClick={async (e) => {
                                                    e.preventDefault();
                                                    // สร้างกฎสำหรับทุกคนในทีม
                                                    const promises = teamNames.map(async (teamName) => {
                                                        const rulesForThisTeam = colorRules.filter(
                                                            rule => rule.team === teamName && rule.columnName === column && rule.isActive
                                                        );
                                                        const newRule = {
                                                            team: teamName,
                                                            columnName: column,
                                                            conditionType: 'GREATER',
                                                            unitType: 'NUMBER',
                                                            value1: 0,
                                                            value2: null,
                                                            color: '#ef4444',
                                                            textColor: '#ffffff',
                                                            isBold: false,
                                                            priority: rulesForThisTeam.length,
                                                            isActive: true
                                                        };
                                                        return fetch('/api/color-rules', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify(newRule)
                                                        });
                                                    });
                                                    try {
                                                        await Promise.all(promises);
                                                        toast.success(`เพิ่มกฎสำหรับ ${teamNames.length} คนสำเร็จ`);
                                                        onRefresh();
                                                    } catch (err) {
                                                        console.error('Error adding rules:', err);
                                                        toast.error('ไม่สามารถเพิ่มกฎได้');
                                                    }
                                                }} className="h-6 text-xs hover:bg-primary hover:text-primary-foreground">
                                                    + เพิ่มกฎ
                                                </Button>
                                            </div>
                                            {rulesForColumn.length === 0 && (
                                                <p className="text-xs text-muted-foreground italic">ยังไม่มีกฎ (คลิก + เพิ่มกฎ)</p>
                                            )}
                                            {rulesForColumn.map((rule, index) => {
                                                const currentRule = editingRules[rule.id!] ? { ...rule, ...editingRules[rule.id!] } : rule;
                                                return (
                                                    <div key={rule.id} className="space-y-2 p-2 border rounded bg-background">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] text-muted-foreground">กฎ #{index + 1}</Label>
                                                            <div className="flex gap-1">
                                                                {hasChanges(rule.id!) && (
                                                                    <Button size="sm" variant="default" onClick={() => saveRuleChanges(rule.id!)} className="h-5 px-2 text-xs">💾 บันทึก</Button>
                                                                )}
                                                                <Button size="sm" variant="ghost" onClick={async () => {
                                                                    if (confirm(`ลบกฎนี้สำหรับทุกคนในกลุ่ม (${teamNames.length} คน)?`)) {
                                                                        try {
                                                                            // ลบทุกคนในทีมที่มี columnName และ priority เดียวกัน
                                                                            const promises = teamNames.map(async (teamName) => {
                                                                                const matchingRule = colorRules.find(
                                                                                    r => r.team === teamName && 
                                                                                         r.columnName === rule.columnName && 
                                                                                         r.priority === rule.priority &&
                                                                                         r.isActive
                                                                                );
                                                                                if (matchingRule && matchingRule.id) {
                                                                                    return fetch(`/api/color-rules/${matchingRule.id}`, { method: 'DELETE' });
                                                                                }
                                                                            });
                                                                            await Promise.all(promises.filter(Boolean));
                                                                            toast.success(`ลบกฎสำหรับ ${teamNames.length} คนสำเร็จ`);
                                                                            onRefresh();
                                                                        } catch (err) {
                                                                            console.error('Error deleting rules:', err);
                                                                            toast.error('ไม่สามารถลบกฎได้');
                                                                        }
                                                                    }
                                                                }} className="h-5 px-2 text-xs text-destructive">ลบ</Button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] text-muted-foreground">เงื่อนไข</Label>
                                                                <Select value={currentRule.conditionType} onValueChange={(value: 'GREATER' | 'LESS' | 'BETWEEN') => updateRuleField(rule.id!, 'conditionType', value)}>
                                                                    <SelectTrigger className="h-6 text-xs"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="GREATER">มากกว่า ≥</SelectItem>
                                                                        <SelectItem value="LESS">น้อยกว่า ≤</SelectItem>
                                                                        <SelectItem value="BETWEEN">ระหว่าง</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] text-muted-foreground">หน่วย</Label>
                                                                <Select value={currentRule.unitType} onValueChange={(value: 'NUMBER' | 'PERCENT') => updateRuleField(rule.id!, 'unitType', value)}>
                                                                    <SelectTrigger className="h-6 text-xs"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="NUMBER">จำนวน</SelectItem>
                                                                        <SelectItem value="PERCENT">%</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <div className={`grid ${currentRule.conditionType === 'BETWEEN' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] text-muted-foreground">{currentRule.conditionType === 'BETWEEN' ? 'ค่าต่ำสุด' : 'ค่า'}</Label>
                                                                <Input type="number" value={currentRule.value1} onChange={(e) => updateRuleField(rule.id!, 'value1', parseFloat(e.target.value) || 0)} className="h-6 text-xs" />
                                                            </div>
                                                            {currentRule.conditionType === 'BETWEEN' && (
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] text-muted-foreground">ค่าสูงสุด</Label>
                                                                    <Input type="number" value={currentRule.value2 || 0} onChange={(e) => updateRuleField(rule.id!, 'value2', parseFloat(e.target.value) || 0)} className="h-6 text-xs" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="space-y-1">
                                                                <Label className="text-[9px] text-muted-foreground">สีแนะนำ</Label>
                                                                <div className="flex gap-1">
                                                                    {presetColors.map((preset) => (
                                                                        <button key={preset.name} onClick={() => {
                                                                            updateRuleField(rule.id!, 'color', preset.bg);
                                                                            updateRuleField(rule.id!, 'textColor', preset.text);
                                                                        }} className="w-8 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors" style={{ backgroundColor: preset.bg, color: preset.text }} title={preset.name}>
                                                                            <span className="text-[10px] font-bold">A</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] text-muted-foreground">สีพื้น</Label>
                                                                    <Input type="color" value={currentRule.color} onChange={(e) => updateRuleField(rule.id!, 'color', e.target.value)} className="h-6" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] text-muted-foreground">สีตัวอักษร</Label>
                                                                    <Input type="color" value={currentRule.textColor} onChange={(e) => updateRuleField(rule.id!, 'textColor', e.target.value)} className="h-6" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[9px] text-muted-foreground">ตัวหนา</Label>
                                                                    <Button variant={currentRule.isBold ? "default" : "outline"} size="sm" onClick={() => updateRuleField(rule.id!, 'isBold', !currentRule.isBold)} className="h-6 w-full text-xs">
                                                                        {currentRule.isBold ? 'เปิด' : 'ปิด'}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 border-t flex-shrink-0 bg-background">
                            <Button onClick={() => setOpen(false)} className="w-full">ปิด</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

// --- Main Page Component ---
export default function AdserPage() {
    const { theme, resolvedTheme } = useTheme();
    const effectiveTheme = resolvedTheme || 'light';
    const [isClient, setIsClient] = useState(false);
    const [tableDateRange, setTableDateRange] = useState<DateRange | undefined>(undefined);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [colorRules, setColorRules] = useState<ColorRule[]>([]);
    const [chartData, setChartData] = useState<{ cpm: TransformedChartData[], costPerDeposit: TransformedChartData[], deposits: TransformedChartData[], cover: TransformedChartData[] }>({ cpm: [], costPerDeposit: [], deposits: [], cover: [] });
    const [graphView, setGraphView] = useState<'daily' | 'monthly'>('daily');
    const [graphYear, setGraphYear] = useState(dayjs().year());
    const [graphMonth, setGraphMonth] = useState(dayjs().month());
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Color rules functions - โหลดจาก API /api/color-rules
    const fetchColorRules = async () => {
        try {
            const response = await fetch('/api/color-rules');
            if (response.ok) {
                const rules: ColorRule[] = await response.json();
                setColorRules(rules);
            }
        } catch (error) {
            console.error('Error loading color rules:', error);
        }
    };
    
    const getTextColorForBackground = (hexColor: string): string => {
        if (!hexColor || hexColor.length < 7) return '#000000';
        const r = parseInt(hexColor.slice(1, 3), 16), g = parseInt(hexColor.slice(3, 5), 16), b = parseInt(hexColor.slice(5, 7), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) > 128 ? '#000000' : '#FFFFFF';
    };

    const getCellStyle = (teamName: string, fieldName: keyof typeof allConfigurableFields, value: number, totalForPercentage: number | null = null): React.CSSProperties => {
        const rulesForField = colorRules.filter(
            rule => rule.team === teamName && rule.columnName === fieldName && rule.isActive
        ).sort((a, b) => a.priority - b.priority);

        if (rulesForField.length === 0) return {};

        const numericValue = Number(value);
        if (isNaN(numericValue)) return {};

        // Find matching rule
        for (const rule of rulesForField) {
            let comparisonValue = numericValue;
            
            // If rule uses PERCENT, calculate percentage
            if (rule.unitType === 'PERCENT' && totalForPercentage && totalForPercentage > 0) {
                comparisonValue = (numericValue / totalForPercentage) * 100;
            }

            let matches = false;
            if (rule.conditionType === 'GREATER') {
                matches = comparisonValue >= rule.value1;
            } else if (rule.conditionType === 'LESS') {
                matches = comparisonValue <= rule.value1;
            } else if (rule.conditionType === 'BETWEEN' && rule.value2 !== null) {
                matches = comparisonValue >= rule.value1 && comparisonValue <= rule.value2;
            }

            if (matches) {
                return {
                    backgroundColor: rule.color,
                    color: rule.textColor,
                    fontWeight: rule.isBold ? 'bold' : 'normal'
                };
            }
        }

        return {};
    };

    useEffect(() => {
        setIsClient(true);
        fetchColorRules(); // โหลดการตั้งค่าสี
        try {
            const savedTableDate = localStorage.getItem('adserTableDateRange');
            if (savedTableDate) { const parsed = JSON.parse(savedTableDate); if (parsed.from && parsed.to) setTableDateRange({ from: dayjs(parsed.from).toDate(), to: dayjs(parsed.to).toDate() }); else setTableDateRange({ from: dayjs().startOf('month').toDate(), to: dayjs().endOf('day').toDate() }); } else setTableDateRange({ from: dayjs().startOf('month').toDate(), to: dayjs().endOf('day').toDate() });
        } catch (error) { console.error("Failed to parse table date range from localStorage", error); setTableDateRange({ from: dayjs().startOf('month').toDate(), to: dayjs().endOf('day').toDate() }); }
        try {
            const savedGraphView = localStorage.getItem('adserGraphView');
            if (savedGraphView === 'daily' || savedGraphView === 'monthly') setGraphView(savedGraphView);
            const savedGraphYear = localStorage.getItem('adserGraphYear');
            if (savedGraphYear) setGraphYear(parseInt(savedGraphYear, 10));
            const savedGraphMonth = localStorage.getItem('adserGraphMonth');
            if (savedGraphMonth) setGraphMonth(parseInt(savedGraphMonth, 10));
        } catch (error) { console.error("Failed to parse graph settings from localStorage", error); }
        try { const savedShowBreakdown = localStorage.getItem('adserShowBreakdown'); if (savedShowBreakdown) setShowBreakdown(JSON.parse(savedShowBreakdown)); } catch (error) { console.error("Failed to parse show breakdown from localStorage", error); }
        try { const savedExpandedGroups = localStorage.getItem('adserExpandedGroups'); if (savedExpandedGroups) { const parsed = JSON.parse(savedExpandedGroups); setExpandedGroups(new Set(parsed)); } } catch (error) { console.error("Failed to parse expanded groups from localStorage", error); }
    }, []);

    useEffect(() => { if (isClient && tableDateRange) localStorage.setItem('adserTableDateRange', JSON.stringify(tableDateRange)); }, [tableDateRange, isClient]);
    useEffect(() => { if (isClient) localStorage.setItem('adserGraphView', graphView); }, [graphView, isClient]);
    useEffect(() => { if (isClient) localStorage.setItem('adserGraphYear', graphYear.toString()); }, [graphYear, isClient]);
    useEffect(() => { if (isClient) localStorage.setItem('adserGraphMonth', graphMonth.toString()); }, [graphMonth, isClient]);
    useEffect(() => { if (isClient) localStorage.setItem('adserShowBreakdown', JSON.stringify(showBreakdown)); }, [showBreakdown, isClient]);
    useEffect(() => { if (isClient) localStorage.setItem('adserExpandedGroups', JSON.stringify(Array.from(expandedGroups))); }, [expandedGroups, isClient]);
    
    const toggleGroup = (groupName: string) => setExpandedGroups(prev => { const newSet = new Set(prev); newSet.has(groupName) ? newSet.delete(groupName) : newSet.add(groupName); return newSet; });
    const { data: exchangeRateData, isLoading: isRateLoading } = useSWR('/api/exchange-rate', fetcher, { refreshInterval: 300000, onSuccess: () => { setLastUpdate(new Date()); setConnectionError(null); }, onError: () => setConnectionError('Failed to fetch rate'), revalidateOnFocus: false });
    const exchangeRate = exchangeRateData?.rate ?? 36.5;
    const isRateFallback = exchangeRateData?.isFallback ?? true;
    const graphDateRange = useMemo(() => { const date = dayjs().year(graphYear).month(graphMonth); return graphView === 'daily' ? { from: date.startOf('month').toDate(), to: date.endOf('month').toDate() } : { from: dayjs().year(graphYear).startOf('year').toDate(), to: dayjs().year(graphYear).endOf('year').toDate() }; }, [graphView, graphYear, graphMonth]);
    const apiUrl = (range: DateRange | undefined) => range?.from && range?.to && exchangeRate ? `/api/adser?startDate=${dayjs(range.from).format('YYYY-MM-DD')}&endDate=${dayjs(range.to).format('YYYY-MM-DD')}&exchangeRate=${exchangeRate}` : null;
    
    const { data: tableData, error: tableError, isLoading: loadingTable } = useSWR<TeamMetric[]>(apiUrl(tableDateRange), fetcher, { refreshInterval: 30000, onSuccess: () => { setLastUpdate(new Date()); setConnectionError(null); }, onError: () => setConnectionError('Failed to fetch table data'), revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: true, refreshWhenHidden: true, refreshWhenOffline: false, dedupingInterval: 10000 });
    const { data: graphRawData, error: graphError, isLoading: loadingGraph } = useSWR<TeamMetric[]>(apiUrl(graphDateRange), fetcher, { refreshInterval: 30000, onSuccess: () => { setLastUpdate(new Date()); setConnectionError(null); }, onError: () => setConnectionError('Failed to fetch graph data'), revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: true, refreshWhenHidden: true, refreshWhenOffline: false, dedupingInterval: 15000 });
    
    useEffect(() => {
        if (!graphRawData || graphRawData.length === 0) { setChartData({ cpm: [], costPerDeposit: [], deposits: [], cover: [] }); return; }
        const aggregateMonthly = (dailyData: DailyDataPoint[], aggType: 'sum' | 'last') => { const monthly = new Map<string, { total: number, last: number }>(); [...dailyData].sort((a, b) => dayjs(a.date).diff(dayjs(b.date))).forEach(d => { const key = dayjs(d.date).format('YYYY-MM-01'); if (!monthly.has(key)) monthly.set(key, { total: 0, last: 0 }); const month = monthly.get(key)!; month.total += d.value; month.last = d.value; }); return Array.from(monthly.entries()).map(([date, values]) => ({ date, value: aggType === 'sum' ? values.total : values.last })); };
        const transformData = (dataKey: keyof TeamMetric, agg: 'sum' | 'last') => { const map = new Map<string, TransformedChartData>(); graphRawData.forEach(team => { let data = team[dataKey] as DailyDataPoint[] || []; if (graphView === 'monthly') data = aggregateMonthly(data, agg); data.forEach(d => { if (!map.has(d.date)) map.set(d.date, { date: d.date }); map.get(d.date)![team.team_name] = d.value; }); }); return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).filter(d => !dayjs(d.date).isAfter(dayjs(), 'day')); };
        const monthlyRatio = (numKey: keyof TeamMetric, denKey: keyof TeamMetric) => { const map = new Map<string, TransformedChartData>(); graphRawData.forEach(team => { const monthly = new Map<string, { num: number, den: number }>(); (team[numKey] as DailyDataPoint[] || []).forEach(d => { const key = dayjs(d.date).format('YYYY-MM-01'); if (!monthly.has(key)) monthly.set(key, { num: 0, den: 0 }); monthly.get(key)!.num += d.value; }); (team[denKey] as DailyDataPoint[] || []).forEach(d => { const key = dayjs(d.date).format('YYYY-MM-01'); if (!monthly.has(key)) monthly.set(key, { num: 0, den: 0 }); monthly.get(key)!.den += d.value; }); monthly.forEach((totals, key) => { if (!map.has(key)) map.set(key, { date: key }); map.get(key)![team.team_name] = totals.den > 0 ? totals.num / totals.den : 0; }); }); return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).filter(d => !dayjs(d.date).isAfter(dayjs(), 'day')); };
        setChartData(graphView === 'monthly' ? { cpm: monthlyRatio('actual_spend_daily', 'total_inquiries_daily'), costPerDeposit: monthlyRatio('actual_spend_daily', 'deposits_count_daily'), deposits: transformData('deposits_count_daily', 'sum'), cover: transformData('one_dollar_per_cover_daily', 'last'), } : { cpm: transformData('cpm_cost_per_inquiry_daily', 'sum'), costPerDeposit: transformData('cost_per_deposit_daily', 'sum'), deposits: transformData('deposits_count_daily', 'sum'), cover: transformData('one_dollar_per_cover_daily', 'last'), });
    }, [graphRawData, graphView]);

    const error = tableError || graphError;
    if (error) return <div className="p-6 text-center text-red-500">Error: {error instanceof Error ? error.message : 'Unknown error'}</div>;

    const monthOptions = Array.from({ length: 12 }, (_, i) => ({ label: dayjs().month(i).locale('th').format('MMMM'), value: i }));
    const yearOptions = Array.from({ length: 5 }, (_, i) => dayjs().year() - i);

    return (
        <div 
            className={cn(
                "h-screen transition-colors duration-200",
                effectiveTheme === 'dark' 
                    ? "text-slate-100" 
                    : "text-slate-900"
            )}
            data-page="adser"
        >
            <div className="h-full overflow-y-auto p-4 sm:p-6">
                <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <h1 className={cn(
                                    "text-2xl tracking-tight transition-colors duration-200",
                                    effectiveTheme === 'dark' ? "text-slate-100" : "text-slate-900"
                                )}>ภาพรวม Adser</h1>
                                {connectionError && <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">{connectionError}</div>}
                            </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1 text-center sm:text-left">ข้อมูลตาราง</p>
                                {isClient ? <DateRangePicker date={tableDateRange} onDateChange={setTableDateRange} /> : <Skeleton className="h-9 w-[260px]" />}
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-xs text-muted-foreground mb-1">ข้อมูลกราฟ</p>
                                {isClient ? (
                                    <div className={filterFrameClass}>
                                        {graphView === 'daily' && <Select value={String(graphMonth)} onValueChange={v => setGraphMonth(Number(v))}><SelectTrigger className="h-9 border-0 shadow-none focus:ring-0 w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{monthOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}</SelectContent></Select>}
                                        <Select value={String(graphYear)} onValueChange={v => setGraphYear(Number(v))}><SelectTrigger className="h-9 border-0 shadow-none focus:ring-0 w-[90px]"><SelectValue /></SelectTrigger><SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
                                        <div className="h-6 w-px bg-border" />
                                        <ToggleGroup type="single" value={graphView} onValueChange={v => { if (v) setGraphView(v as 'daily' | 'monthly'); }}>
                                            <ToggleGroupItem value="daily" className="h-9 px-2.5 text-xs">รายวัน</ToggleGroupItem>
                                            <ToggleGroupItem value="monthly" className="h-9 px-2.5 text-xs">รายเดือน</ToggleGroupItem>
                                        </ToggleGroup>
                                    </div>
                                ) : <Skeleton className="h-9 w-[300px]" />}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                {Object.entries(adserTeamGroups).map(([groupName, teamNames]) => {
                    const teamsInGroup = tableData ? tableData.filter(team => teamNames.includes(team.team_name)) : [];
                    if (loadingTable && !isClient) return <Skeleton key={groupName} className="h-96 w-full" />;
                    if (!teamsInGroup.length) return <div key={groupName} className="p-6"><h2 className="text-2xl mb-4">{groupName}</h2><p className="text-muted-foreground">ไม่มีข้อมูลสำหรับกลุ่มนี้</p></div>;
                    return (
                        <div key={groupName} className="space-y-4">
                            <div className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
                                <h2 className="text-xl">{groupName}</h2>
                                <div className="flex items-center gap-2">
                                    {groupName === 'สาวอ้อย' && <ExchangeRateSmall rate={exchangeRate} isLoading={isRateLoading} isFallback={isRateFallback} />}
                                    {groupName === 'สาวอ้อย' && <RealTimeStatus lastUpdate={lastUpdate} />}
                                    <ColorSettingsPopover groupName={groupName} teamNames={teamNames} colorRules={colorRules} onRefresh={fetchColorRules} />
                                    <Button variant="outline" size="sm" onClick={() => setShowBreakdown(!showBreakdown)} className="h-8">{showBreakdown ? <ChevronLeft className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}{showBreakdown ? 'ซ่อน' : 'ละเอียด'}</Button>
                                </div>
                            </div>
                            <div className="px-0 pb-0">
                                <div className="overflow-x-auto rounded-lg border border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md">
                                    {/* เปลี่ยนจาก table-fixed เป็น w-full เพื่อให้ minWidth ทำงาน */}
                                    <Table className="text-sm [&_tr]:border-0 bg-transparent w-full">
                                    <TableHeader className="[&_tr]:border-0 bg-transparent">
                                            <TableRow className="border-0 hover:bg-transparent">
                                                {/* ปรับ width ของแต่ละคอลัมน์ได้ที่นี่ (ใช้ % หรือ px) */}
                                                <TableHead className="text-left" style={{ width: '10%', minWidth: '80px' }}>ทีม</TableHead>
                                                {/* ยอดทัก/แผน - min-width 100px */}
                                                <TableHead className="text-center" style={{ width: '9%', minWidth: '100px' }}>ยอดทัก/แผน</TableHead>
                                                {/* ใช้จ่าย/แผน - min-width 100px */}
                                                <TableHead className="text-center" style={{ width: '9%', minWidth: '100px' }}>ใช้จ่าย/แผน</TableHead>
                                                <TableHead className="text-center" style={{ width: '8%' }}>ยอดทักสุทธิ</TableHead>
                                                <TableHead className="text-center" style={{ width: '7%' }}>ยอดเสีย</TableHead>
                                                <TableHead className="text-center" style={{ width: '7%' }}>CPM</TableHead>
                                                <TableHead className="text-center" style={{ width: '7%' }}>ยอดเติม</TableHead>
                                                <TableHead className="text-center" style={{ width: '8%' }}>ทุน/เติม</TableHead>
                                                <TableHead className="text-right" style={{ width: '10%' }}>ยอดเล่นใหม่</TableHead>
                                                <TableHead className="text-right" style={{ width: '8%' }}>1$/Cover</TableHead>
                                                {showBreakdown && <>
                                                    <TableHead className="text-center" style={{ width: '5%' }}>เงียบ</TableHead>
                                                    <TableHead className="text-center" style={{ width: '5%' }}>ซ้ำ</TableHead>
                                                    <TableHead className="text-center" style={{ width: '5%' }}>มียูส</TableHead>
                                                    <TableHead className="text-center" style={{ width: '5%' }}>ก่อกวน</TableHead>
                                                    <TableHead className="text-center" style={{ width: '5%' }}>บล็อก</TableHead>
                                                    <TableHead className="text-center" style={{ width: '5%' }}>เด็ก</TableHead>
                                                    <TableHead className="text-center" style={{ width: '6%' }}>อายุเกิน 50</TableHead>
                                                    <TableHead className="text-center" style={{ width: '6%' }}>ต่างชาติ</TableHead>
                                                </>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="bg-transparent">
                                            {teamsInGroup.sort((a, b) => teamNames.indexOf(a.team_name) - teamNames.indexOf(b.team_name)).map(team => (
                                                <TableRow key={team.team_name} className="table-row-transition border-0 hover:bg-white/10 dark:hover:bg-slate-700/20 bg-transparent h-12">
                                                    <TableCell className="text-left" style={{ width: '10%', minWidth: '80px' }}>
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={cn(
                                                                    'w-2.5 h-2.5 rounded-full flex-shrink-0 status-indicator',
                                                                    Number(team.actual_spend ?? 0) <= Number(team.planned_daily_spend ?? 0) ? 'bg-green-500' : 'bg-red-500'
                                                                )}
                                                            />
                                                            <span className="">{team.team_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    {/* ยอดทัก/แผน - min-width 100px */}
                                                    <TableCell className="text-center" style={{ width: '9%', minWidth: '100px' }}><ProgressCell value={team.total_inquiries ?? 0} total={team.planned_inquiries ?? 0} /></TableCell>
                                                    {/* ใช้จ่าย/แผน - min-width 100px */}
                                                    <TableCell className="text-center" style={{ width: '9%', minWidth: '100px' }}><ProgressCell value={team.actual_spend ?? 0} total={team.planned_daily_spend ?? 0} isCurrency /></TableCell>
                                                    <TableCell className="text-center" style={{ width: '8%' }}><span style={getCellStyle(team.team_name, 'net_inquiries', team.net_inquiries ?? 0, team.total_inquiries ?? 0)} className="text-sm inline-block rounded px-1.5 py-0.5"><BreakdownCell value={team.net_inquiries ?? 0} total={team.total_inquiries ?? 0} /></span></TableCell>
                                                    <TableCell className="text-center" style={{ width: '7%' }}><span style={getCellStyle(team.team_name, 'wasted_inquiries', team.wasted_inquiries ?? 0, team.total_inquiries ?? 0)} className="text-sm inline-block rounded px-1.5 py-0.5"><BreakdownCell value={team.wasted_inquiries ?? 0} total={team.total_inquiries ?? 0} /></span></TableCell>
                                                    <TableCell className="text-center" style={{ width: '7%' }}><span style={getCellStyle(team.team_name, 'cpm_cost_per_inquiry', team.cpm_cost_per_inquiry ?? 0)} className="text-sm inline-block rounded px-1.5 py-0.5"><FinancialMetric value={team.cpm_cost_per_inquiry ?? 0} prefix="$" /></span></TableCell>
                                                    <TableCell className="text-center" style={{ width: '7%' }}><span style={getCellStyle(team.team_name, 'deposits_count', team.deposits_count ?? 0)} className="text-sm number-transition inline-block rounded px-1.5 py-0.5">{formatNumber(team.deposits_count ?? 0)}</span></TableCell>
                                                    <TableCell className="text-center" style={{ width: '8%' }}><span style={getCellStyle(team.team_name, 'cost_per_deposit', team.cost_per_deposit ?? 0)} className="text-sm inline-block rounded px-1.5 py-0.5"><FinancialMetric value={team.cost_per_deposit ?? 0} prefix="$" /></span></TableCell>
                                                    <TableCell className="text-right" style={{ width: '10%' }}><span style={getCellStyle(team.team_name, 'new_player_value_thb', team.new_player_value_thb ?? 0)} className="text-sm inline-block rounded px-1.5 py-0.5"><FinancialMetric value={team.new_player_value_thb ?? 0} prefix="฿" /></span></TableCell>
                                                    <TableCell className="text-right" style={{ width: '8%' }}><span style={getCellStyle(team.team_name, 'one_dollar_per_cover', team.one_dollar_per_cover ?? 0)} className="text-sm inline-block rounded px-1.5 py-0.5"><FinancialMetric value={team.one_dollar_per_cover ?? 0} prefix="$" /></span></TableCell>
                                                    {showBreakdown && <>
                                                        {(Object.keys(allConfigurableFields) as Array<keyof typeof allConfigurableFields>)
                                                            .filter(key => allConfigurableFields[key].unit === '%' && !['wasted_inquiries', 'net_inquiries'].includes(key))
                                                            .map(key => {
                                                                const typedKey = key as keyof TeamMetric;
                                                                const value = team[typedKey] as number | undefined;
                                                                const width = ['over_50_inquiries', 'foreigner_inquiries'].includes(key) ? '6%' : '5%';
                                                                return (
                                                                    <TableCell key={key} className="text-center" style={{ width }}>
                                                                        <span style={getCellStyle(team.team_name, key, value ?? 0, team.total_inquiries)} className="text-sm inline-block rounded px-1.5 py-0.5">
                                                                            <BreakdownCell value={value ?? 0} total={team.total_inquiries} />
                                                                        </span>
                                                                    </TableCell>
                                                                )
                                                            })
                                                        }
                                                    </>}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Collapsible open={expandedGroups.has(groupName)} onOpenChange={() => toggleGroup(groupName)}>
                                    <CollapsibleContent className="px-4 pb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                            <GroupedChart title="ต้นทุนทัก (CPM)" data={chartData.cpm} yAxisLabel="$" loading={loadingGraph} teamsToShow={teamNames} chartType="cpm" yAxisDomainMax={groupYAxisMax[groupName]?.cpm} graphView={graphView} />
                                            <GroupedChart title="ต้นทุนต่อเติม" data={chartData.costPerDeposit} yAxisLabel="$" loading={loadingGraph} teamsToShow={teamNames} chartType="costPerDeposit" yAxisDomainMax={groupYAxisMax[groupName]?.costPerDeposit} graphView={graphView} />
                                            <GroupedChart title="เป้ายอดเติม" data={chartData.deposits} yAxisLabel="" loading={loadingGraph} teamsToShow={teamNames} chartType="deposits" dateForTarget={graphDateRange?.from} graphView={graphView} />
                                            <GroupedChart title="1$ / Cover" data={chartData.cover} yAxisLabel="$" loading={loadingGraph} teamsToShow={teamNames} chartType="cover" groupName={groupName} yAxisDomainMax={groupYAxisMax[groupName]?.cover} graphView={graphView} />
                                        </div>
                                    </CollapsibleContent>
                                    <div className="flex justify-center border-t bg-muted/30 p-3">
                                        <CollapsibleTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-xs text-muted-foreground w-full max-w-xs">
                                            <TrendingUp className="h-4 w-4 mr-1" />
                                            {expandedGroups.has(groupName) ? 'ซ่อนกราฟ' : 'แสดงกราฟ'}
                                        </CollapsibleTrigger>
                                    </div>
                                </Collapsible>
                            </div>
                        </div>
                    );
                })}
                    </div>
                </div>
            </div>
        </div>
    );
}