const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTeamTargets() {
  try {
    console.log('🔍 Checking all team targets...\n')
    
    const allTargets = await prisma.teamTargets.findMany()
    
    if (allTargets.length === 0) {
      console.log('❌ No team targets found in database!')
    } else {
      console.log(`✅ Found ${allTargets.length} team(s):\n`)
      allTargets.forEach(target => {
        console.log(`📋 Team: ${target.team}`)
        console.log(`   - Cover Target: ${target.coverTarget}`)
        console.log(`   - CPM Target: ${target.cpmTarget}`)
        console.log(`   - Cost Per Topup: ${target.costPerTopupTarget}`)
        console.log(`   - Exchange Rate: ${target.exchangeRate}`)
        console.log(`   - Updated: ${target.updatedAt}`)
        console.log('')
      })
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTeamTargets()
