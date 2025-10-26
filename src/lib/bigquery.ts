import { BigQuery } from '@google-cloud/bigquery';
import path from 'path';

// Use the JSON key file directly
const keyFilePath = path.resolve(process.cwd(), 'credentials.json');

interface FetchParams {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  adser?: string;
  status?: string;
  team?: string;
  searchText?: string;
  userTeams?: string[];
}

export async function fetchMonitorData(params: FetchParams = {}) {
  try {
    console.log('Starting BigQuery connection...');
    console.log('Received parameters:', params);
    
  const {
    page = 1,
    limit = 100,
    dateFrom,
    dateTo,
    adser,
    status,
    team,
    searchText,
    userTeams
  } = params;

    // Build WHERE conditions
    const conditions: string[] = [];
    
    // Always limit to data from 2025 for performance
    conditions.push(`date >= '2025-01-01'`);
    
    if (dateFrom) {
      conditions.push(`date >= '${dateFrom}'`);
    }
    if (dateTo) {
      conditions.push(`date <= '${dateTo}'`);
    }
    if (adser && adser !== 'all') {
      conditions.push(`adser = '${adser}'`);
    }
    if (status) {
      conditions.push(`status = '${status}'`);
    }
    
    // Team filter logic
    if (userTeams && userTeams.length > 0) {
      const teamList = userTeams.map(t => `'${t}'`).join(', ');
      conditions.push(`team IN (${teamList})`);
    } else if (team && team !== 'all') {
      conditions.push(`team = '${team}'`);
    }
    
    // Team-adser mapping
    if (team && team !== 'all' && (!adser || adser === 'all')) {
      const teamAdserMapping: Record<string, string[]> = {
        'HCA': ['Boogey', 'Bubble'],
        'HCB': ['Lucifer', 'Risa'], 
        'HCC': ['Shazam', 'Vivien'],
        'HCD': ['Sim', 'Joanne'],
        'HSB': ['Cookie', 'Piea'],
        'HSA1': ['Irene'],
        'HSA2': ['Minho', 'Bailu'],
        'HZA': ['Thomas', 'IU', 'Nolan']
      };
      
      const teamAdsers = teamAdserMapping[team];
      if (teamAdsers && teamAdsers.length > 0) {
        const adserList = teamAdsers.map((a: string) => `'${a}'`).join(', ');
        conditions.push(`adser IN (${adserList})`);
      }
    }
    
    if (searchText) {
      const escapedSearch = searchText.replace(/'/g, "\\'");
      conditions.push(`(
        CAST(adid AS STRING) LIKE '%${escapedSearch}%' OR
        LOWER(adser) LIKE LOWER('%${escapedSearch}%') OR
        LOWER(page) LIKE LOWER('%${escapedSearch}%') OR
        LOWER(content) LIKE LOWER('%${escapedSearch}%') OR
        LOWER(note) LIKE LOWER('%${escapedSearch}%') OR
        CAST(pageid AS STRING) LIKE '%${escapedSearch}%'
      )`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * limit;
    
    console.log('Generated WHERE clause:', whereClause);

    // Check if date range is selected
    const shouldAggregate = dateFrom && dateTo;

    let query, countQuery;

    if (shouldAggregate) {
      // GROUP BY Ad ID (aggregate across dates)
      const groupFields = 'adser, adid, pageid, page, content, cookie, target, not_target, budget, note, status, start, off, captions, card, timezone, type_time, team';
      const selectFields = 'adser, adid, pageid, page, content, cookie, target, not_target, budget, note, status, start, off, captions, card, timezone, type_time, team';

      query = `
        SELECT 
          ${selectFields},
          SUM(SAFE_CAST(total_card AS INT64)) as total_card,
          SUM(SAFE_CAST(card_num AS INT64)) as card_num,
          SUM(SAFE_CAST(total_message AS INT64)) as total_message,
          SUM(SAFE_CAST(meta_message AS INT64)) as meta_message,
          SUM(SAFE_CAST(register AS INT64)) as register,
          SUM(SAFE_CAST(deposit AS INT64)) as deposit,
          SUM(SAFE_CAST(cost AS FLOAT64)) as cost,
          SUM(SAFE_CAST(turnover AS FLOAT64)) as turnover,
          SUM(SAFE_CAST(total_user AS INT64)) as total_user,
          SUM(SAFE_CAST(silent AS INT64)) as silent,
          SUM(SAFE_CAST(duplicate AS INT64)) as duplicate,
          SUM(SAFE_CAST(has_account AS INT64)) as has_account,
          SUM(SAFE_CAST(spammer AS INT64)) as spammer,
          SUM(SAFE_CAST(blocked AS INT64)) as blocked,
          SUM(SAFE_CAST(under_18 AS INT64)) as under_18,
          SUM(SAFE_CAST(over_50 AS INT64)) as over_50,
          SUM(SAFE_CAST(foreigner AS INT64)) as foreigner
        FROM \`sa-ads.Gateway_monitor.data_monitor\`
        ${whereClause}
        GROUP BY ${groupFields}
        ORDER BY adid
        LIMIT ${limit}
        OFFSET ${offset};
      `;

      countQuery = `
        SELECT COUNT(DISTINCT adid) as total
        FROM \`sa-ads.Gateway_monitor.data_monitor\`
        ${whereClause};
      `;
    } else {
      // Regular query with all fields
      query = `
        SELECT 
          date, adser, adid, pageid, page, content, cookie, target, not_target, budget, note, status, 
          start, off, captions, card, total_card, card_num, timezone, type_time, team, total_message, 
          meta_message, register, deposit, cost, turnover, total_user, silent, 
          duplicate, has_account, spammer, blocked, under_18, over_50, foreigner
        FROM \`sa-ads.Gateway_monitor.data_monitor\`
        ${whereClause}
        ORDER BY date DESC
        LIMIT ${limit}
        OFFSET ${offset};
      `;

      countQuery = `
        SELECT COUNT(*) as total
        FROM \`sa-ads.Gateway_monitor.data_monitor\`
        ${whereClause};
      `;
    }
    
    console.log('Executing queries...');
    console.log('Date range aggregation:', shouldAggregate);
    console.log('Query:', query);
    
    const bigquery = new BigQuery({
      keyFilename: keyFilePath,
      projectId: 'sa-ads'
    });

    const options = {
      location: 'asia-southeast1',
      timeoutMs: 60000,
    };

    // Execute both queries in parallel
    const [dataResult, countResult] = await Promise.all([
      bigquery.query({ ...options, query }),
      bigquery.query({ ...options, query: countQuery })
    ]);

    const [rows] = dataResult;
    const [countRows] = countResult;
    const total = countRows[0]?.total || 0;

    console.log(`Query returned ${rows.length} rows out of ${total} total`);

    // Convert dates to ISO string format
    const serializedData = rows.map((row: any) => ({
      ...row,
      date: row.date ? row.date.value || row.date : null,
      start: row.start ? row.start.value || row.start : null,
      off: row.off ? row.off.value || row.off : null,
    }));

    return {
      data: serializedData,
      total: parseInt(total.toString()),
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('BigQuery error:', error);
    throw new Error('Failed to fetch data from BigQuery');
  }
}

export async function fetchFilterOptions() {
  try {
    console.log('Fetching filter options...');
    const startTime = Date.now();
    
    const bigquery = new BigQuery({
      keyFilename: keyFilePath,
      projectId: 'sa-ads',
      location: 'asia-southeast1'
    });

    // Query ทั้งหมดในครั้งเดียวด้วย UNION ALL
    const [result] = await bigquery.query(`
      SELECT 'adser' as type, adser as value
      FROM \`sa-ads.Gateway_monitor.data_monitor\`
      WHERE adser IS NOT NULL AND adser != ''
      GROUP BY adser
      
      UNION ALL
      
      SELECT 'status' as type, status as value
      FROM \`sa-ads.Gateway_monitor.data_monitor\`
      WHERE status IS NOT NULL AND status != ''
      GROUP BY status
      
      UNION ALL
      
      SELECT 'team' as type, team as value
      FROM \`sa-ads.Gateway_monitor.data_monitor\`
      WHERE team IS NOT NULL AND team != ''
      GROUP BY team
      
      ORDER BY type, value;
    `);

    // แยกผลลัพธ์ตาม type
    const adsers: string[] = [];
    const statuses: string[] = [];
    const teams: string[] = [];

    result.forEach((row: any) => {
      if (row.type === 'adser') {
        adsers.push(row.value);
      } else if (row.type === 'status') {
        statuses.push(row.value);
      } else if (row.type === 'team') {
        teams.push(row.value);
      }
    });

    const duration = Date.now() - startTime;
    console.log(`Found ${adsers.length} adsers, ${statuses.length} statuses, ${teams.length} teams in ${duration}ms`);
    console.log('Teams:', teams);

    return { adsers, statuses, teams };
  } catch (error) {
    console.error('BigQuery error:', error);
    throw new Error('Failed to fetch filter options');
  }
}
