const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkGatewayData() {
  try {
    console.log('🔍 Checking gateway data for "สาวอ้อย"...\n')
    
    const data = await prisma.gatewayData.findMany({
      where: {
        team: 'สาวอ้อย',
        date: {
          contains: '/10/2025'
        }
      },
      take: 5,
      orderBy: {
        date: 'asc'
      }
    })
    
    console.log(`✅ Found ${data.length} records for สาวอ้อย in October 2025`)
    
    if (data.length > 0) {
      console.log('\nSample records:')
      data.forEach(record => {
        console.log(`📅 ${record.date} - ${record.adser}`)
      })
    } else {
      console.log('❌ No data found!')
    }
    
    // Check all teams
    const allData = await prisma.gatewayData.findMany({
      where: {
        date: {
          contains: '/10/2025'
        }
      },
      select: {
        team: true
      },
      distinct: ['team']
    })
    
    console.log('\n📊 Teams with data in October 2025:')
    allData.forEach(item => {
      console.log(`   - ${item.team}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGatewayData()
