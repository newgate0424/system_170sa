import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Helper to get userId from JWT token
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Helper to parse JSON safely
function tryParseJSON(jsonString: string | null): any {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}

// GET - Fetch user preferences
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId
        }
      });
    }

    // Parse JSON strings back to objects
    const parsedPreferences = {
      ...preferences,
      sidebarSettings: tryParseJSON(preferences.sidebarSettings),
      themeSettings: tryParseJSON(preferences.themeSettings),
      filterSettings: tryParseJSON(preferences.filterSettings),
      columnVisibility: tryParseJSON(preferences.columnVisibility),
      columnWidths: tryParseJSON(preferences.columnWidths),
      colorConfiguration: tryParseJSON(preferences.colorConfiguration),
      tableSettings: tryParseJSON(preferences.tableSettings),
    };

    return NextResponse.json(parsedPreferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST/PUT - Save or update preferences
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      sidebarSettings,
      themeSettings,
      filterSettings, 
      columnVisibility,
      columnWidths,
      colorConfiguration, 
      tableSettings 
    } = body;

    // Convert objects to JSON strings for database storage
    const updateData: any = {};
    const createData: any = { userId };

    if (sidebarSettings !== undefined) {
      updateData.sidebarSettings = JSON.stringify(sidebarSettings);
      createData.sidebarSettings = JSON.stringify(sidebarSettings);
    }
    if (themeSettings !== undefined) {
      updateData.themeSettings = JSON.stringify(themeSettings);
      createData.themeSettings = JSON.stringify(themeSettings);
    }
    if (filterSettings !== undefined) {
      updateData.filterSettings = JSON.stringify(filterSettings);
      createData.filterSettings = JSON.stringify(filterSettings);
    }
    if (columnVisibility !== undefined) {
      updateData.columnVisibility = JSON.stringify(columnVisibility);
      createData.columnVisibility = JSON.stringify(columnVisibility);
    }
    if (columnWidths !== undefined) {
      updateData.columnWidths = JSON.stringify(columnWidths);
      createData.columnWidths = JSON.stringify(columnWidths);
    }
    if (colorConfiguration !== undefined) {
      updateData.colorConfiguration = JSON.stringify(colorConfiguration);
      createData.colorConfiguration = JSON.stringify(colorConfiguration);
    }
    if (tableSettings !== undefined) {
      updateData.tableSettings = JSON.stringify(tableSettings);
      createData.tableSettings = JSON.stringify(tableSettings);
    }

    // Use upsert to create or update
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: updateData,
      create: createData
    });

    // Parse the saved preferences back to objects for the response
    const parsedPreferences = {
      ...preferences,
      sidebarSettings: tryParseJSON(preferences.sidebarSettings),
      themeSettings: tryParseJSON(preferences.themeSettings),
      filterSettings: tryParseJSON(preferences.filterSettings),
      columnVisibility: tryParseJSON(preferences.columnVisibility),
      columnWidths: tryParseJSON(preferences.columnWidths),
      colorConfiguration: tryParseJSON(preferences.colorConfiguration),
      tableSettings: tryParseJSON(preferences.tableSettings),
    };

    return NextResponse.json(parsedPreferences);
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update specific preference section
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 });
    }

    // Convert data to JSON string for database storage
    const jsonData = JSON.stringify(data);

    const updateData: Record<string, string> = {};
    const createData: any = { userId };

    switch (type) {
      case 'sidebar':
        updateData.sidebarSettings = jsonData;
        createData.sidebarSettings = jsonData;
        break;
      case 'theme':
        updateData.themeSettings = jsonData;
        createData.themeSettings = jsonData;
        break;
      case 'filter':
        updateData.filterSettings = jsonData;
        createData.filterSettings = jsonData;
        break;
      case 'columns':
        updateData.columnVisibility = jsonData;
        createData.columnVisibility = jsonData;
        break;
      case 'widths':
        updateData.columnWidths = jsonData;
        createData.columnWidths = jsonData;
        break;
      case 'colors':
        updateData.colorConfiguration = jsonData;
        createData.colorConfiguration = jsonData;
        break;
      case 'table':
        updateData.tableSettings = jsonData;
        createData.tableSettings = jsonData;
        break;
      default:
        return NextResponse.json({ error: 'Invalid preference type' }, { status: 400 });
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: updateData,
      create: createData
    });

    // Parse the updated preferences back to objects for the response
    const parsedPreferences = {
      ...preferences,
      sidebarSettings: tryParseJSON(preferences.sidebarSettings),
      themeSettings: tryParseJSON(preferences.themeSettings),
      filterSettings: tryParseJSON(preferences.filterSettings),
      columnVisibility: tryParseJSON(preferences.columnVisibility),
      columnWidths: tryParseJSON(preferences.columnWidths),
      colorConfiguration: tryParseJSON(preferences.colorConfiguration),
      tableSettings: tryParseJSON(preferences.tableSettings),
    };

    return NextResponse.json(parsedPreferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
