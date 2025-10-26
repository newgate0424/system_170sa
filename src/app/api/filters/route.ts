import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { fetchFilterOptions } from '@/lib/bigquery';

// Cache สำหรับ filter options (cache 5 นาที)
let filterCache: {
  data: { adsers: string[], statuses: string[], teams: string[] } | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 นาที

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ authentication จาก cookie
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // ตรวจสอบ cache
    const now = Date.now();
    let adsers, statuses, teams;

    if (filterCache.data && (now - filterCache.timestamp) < CACHE_DURATION) {
      console.log('📦 Using cached filter options');
      ({ adsers, statuses, teams } = filterCache.data);
    } else {
      console.log('🔄 Fetching fresh filter options from BigQuery');
      const result = await fetchFilterOptions();
      adsers = result.adsers;
      statuses = result.statuses;
      teams = result.teams;
      
      // บันทึกลง cache
      filterCache = {
        data: { adsers, statuses, teams },
        timestamp: now
      };
      console.log('✅ Filter options cached');
    }

    console.log('🔍 API /api/filters - decoded user:', decoded);
    console.log('🔍 API /api/filters - teams from BigQuery:', teams);

    // สร้าง team-advertiser mapping (ตาม config เดิม)
    const teamAdvertiserMapping: Record<string, string[]> = {
      'HCA': ['Boogey', 'Bubble'],
      'HCB': ['Lucifer', 'Risa'], 
      'HCC': ['Shazam', 'Vivien'],
      'HCD': ['Sim', 'Joanne'],
      'HSB': ['Cookie', 'Piea'],
      'HSA1': ['Irene'],
      'HSA2': ['Minho', 'Bailu'],
      'HZA': ['Thomas', 'IU', 'Nolan']
    };

    // ถ้าเป็น staff user, ต้อง filter ตาม teams ที่มีสิทธิ์
    let filteredTeams = teams;
    let filteredAdsers = adsers;
    let filteredMapping = teamAdvertiserMapping;

    console.log('🔍 API /api/filters - decoded.role:', decoded.role);
    console.log('🔍 API /api/filters - decoded.teams:', decoded.teams);

    if (decoded.role === 'EMPLOYEE' && decoded.teams && Array.isArray(decoded.teams)) {
      const userTeams = decoded.teams;
      
      // Filter teams
      filteredTeams = teams.filter(team => userTeams.includes(team));
      
      // Filter adsers ตาม teams ที่มีสิทธิ์
      const allowedAdsers = new Set<string>();
      filteredTeams.forEach(team => {
        if (teamAdvertiserMapping[team]) {
          teamAdvertiserMapping[team].forEach((adser: string) => allowedAdsers.add(adser));
        }
      });
      filteredAdsers = Array.from(allowedAdsers).sort();
      
      // Filter mapping
      filteredMapping = {};
      filteredTeams.forEach(team => {
        if (teamAdvertiserMapping[team]) {
          filteredMapping[team] = teamAdvertiserMapping[team];
        }
      });
    }

    console.log('📤 API /api/filters - Sending response:', {
      adsersCount: filteredAdsers.length,
      teamsCount: filteredTeams.length,
      statusesCount: statuses.length,
      teams: filteredTeams
    });

    return NextResponse.json({
      adsers: filteredAdsers,
      teams: filteredTeams,
      statuses: statuses,
      teamAdvertiserMapping: filteredMapping,
    });

  } catch (error) {
    console.error('Error fetching filters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
