import { PrismaClient, Party } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const politicians = [
  // President / VP / Cabinet-level
  { name: 'Joe Biden', title: 'President', party: 'DEM' as Party, state: 'DE', bio: 'Former 46th President of the United States.' },
  { name: 'Kamala Harris', title: 'Vice President', party: 'DEM' as Party, state: 'CA', bio: 'First woman to serve as Vice President.' },
  { name: 'Donald Trump', title: 'President', party: 'REP' as Party, state: 'FL', bio: '45th and 47th President of the United States.' },
  { name: 'J.D. Vance', title: 'Vice President', party: 'REP' as Party, state: 'OH', bio: 'Author of Hillbilly Elegy, now Vice President.' },

  // Senate – Democrats
  { name: 'Chuck Schumer', title: 'Senator', party: 'DEM' as Party, state: 'NY', bio: 'Senate Minority Leader.' },
  { name: 'Bernie Sanders', title: 'Senator', party: 'IND' as Party, state: 'VT', bio: 'Progressive independent senator.' },
  { name: 'Elizabeth Warren', title: 'Senator', party: 'DEM' as Party, state: 'MA', bio: 'Consumer protection advocate and senator.' },
  { name: 'Amy Klobuchar', title: 'Senator', party: 'DEM' as Party, state: 'MN', bio: 'Bipartisan dealmaker from Minnesota.' },
  { name: 'Cory Booker', title: 'Senator', party: 'DEM' as Party, state: 'NJ', bio: 'Former mayor of Newark, NJ.' },
  { name: 'Mark Warner', title: 'Senator', party: 'DEM' as Party, state: 'VA', bio: 'Tech entrepreneur turned senator.' },
  { name: 'Raphael Warnock', title: 'Senator', party: 'DEM' as Party, state: 'GA', bio: 'Pastor and senator from Georgia.' },
  { name: 'Jon Ossoff', title: 'Senator', party: 'DEM' as Party, state: 'GA', bio: 'Investigative journalist turned senator.' },
  { name: 'Patty Murray', title: 'Senator', party: 'DEM' as Party, state: 'WA', bio: 'President pro tempore emerita.' },
  { name: 'Tammy Baldwin', title: 'Senator', party: 'DEM' as Party, state: 'WI', bio: 'First openly gay senator.' },
  { name: 'Alex Padilla', title: 'Senator', party: 'DEM' as Party, state: 'CA', bio: 'Former California Secretary of State.' },

  // Senate – Republicans
  { name: 'Mitch McConnell', title: 'Senator', party: 'REP' as Party, state: 'KY', bio: 'Former Senate Majority Leader.' },
  { name: 'John Cornyn', title: 'Senator', party: 'REP' as Party, state: 'TX', bio: 'Senior Texas senator.' },
  { name: 'Ted Cruz', title: 'Senator', party: 'REP' as Party, state: 'TX', bio: 'Conservative firebrand from Texas.' },
  { name: 'Marco Rubio', title: 'Senator', party: 'REP' as Party, state: 'FL', bio: 'Former presidential candidate and senator.' },
  { name: 'Tom Cotton', title: 'Senator', party: 'REP' as Party, state: 'AR', bio: 'Hawkish senator and Army veteran.' },
  { name: 'Josh Hawley', title: 'Senator', party: 'REP' as Party, state: 'MO', bio: 'Populist conservative senator.' },
  { name: 'Ron Johnson', title: 'Senator', party: 'REP' as Party, state: 'WI', bio: 'Business-focused senator from Wisconsin.' },
  { name: 'Rand Paul', title: 'Senator', party: 'REP' as Party, state: 'KY', bio: 'Libertarian-leaning senator and doctor.' },
  { name: 'Lisa Murkowski', title: 'Senator', party: 'REP' as Party, state: 'AK', bio: 'Moderate Republican from Alaska.' },
  { name: 'Susan Collins', title: 'Senator', party: 'REP' as Party, state: 'ME', bio: 'Key moderate Republican vote.' },

  // House – Democrats
  { name: 'Hakeem Jeffries', title: 'Representative', party: 'DEM' as Party, state: 'NY', bio: 'House Minority Leader.' },
  { name: 'Alexandria Ocasio-Cortez', title: 'Representative', party: 'DEM' as Party, state: 'NY', bio: 'Progressive congresswoman and activist.' },
  { name: 'Ilhan Omar', title: 'Representative', party: 'DEM' as Party, state: 'MN', bio: 'First Somali-American in Congress.' },
  { name: 'Rashida Tlaib', title: 'Representative', party: 'DEM' as Party, state: 'MI', bio: 'First Palestinian-American in Congress.' },
  { name: 'Ayanna Pressley', title: 'Representative', party: 'DEM' as Party, state: 'MA', bio: 'Member of The Squad.' },
  { name: 'Adam Schiff', title: 'Senator', party: 'DEM' as Party, state: 'CA', bio: 'Former House Intelligence Committee chair.' },
  { name: 'Jamie Raskin', title: 'Representative', party: 'DEM' as Party, state: 'MD', bio: 'Constitutional law professor and congressman.' },
  { name: 'Katie Porter', title: 'Senator', party: 'DEM' as Party, state: 'CA', bio: 'Known for her whiteboard questioning style.' },
  { name: 'Ro Khanna', title: 'Representative', party: 'DEM' as Party, state: 'CA', bio: 'Tech-focused progressive congressman.' },

  // House – Republicans
  { name: 'Mike Johnson', title: 'Speaker of the House', party: 'REP' as Party, state: 'LA', bio: 'Speaker of the House of Representatives.' },
  { name: 'Steve Scalise', title: 'Representative', party: 'REP' as Party, state: 'LA', bio: 'House Majority Leader.' },
  { name: 'Jim Jordan', title: 'Representative', party: 'REP' as Party, state: 'OH', bio: 'Chairman of the House Judiciary Committee.' },
  { name: 'Matt Gaetz', title: 'Representative', party: 'REP' as Party, state: 'FL', bio: 'MAGA firebrand congressman.' },
  { name: 'Marjorie Taylor Greene', title: 'Representative', party: 'REP' as Party, state: 'GA', bio: 'Controversial MAGA congresswoman.' },
  { name: 'Lauren Boebert', title: 'Representative', party: 'REP' as Party, state: 'CO', bio: 'Gun-rights focused congresswoman.' },
  { name: 'Kevin McCarthy', title: 'Representative', party: 'REP' as Party, state: 'CA', bio: 'Former Speaker of the House.' },
  { name: 'Elise Stefanik', title: 'Representative', party: 'REP' as Party, state: 'NY', bio: 'House Republican Conference Chair.' },
  { name: 'Dan Crenshaw', title: 'Representative', party: 'REP' as Party, state: 'TX', bio: 'Navy SEAL veteran and congressman.' },

  // Governors
  { name: 'Gavin Newsom', title: 'Governor', party: 'DEM' as Party, state: 'CA', bio: 'Governor of California.' },
  { name: 'Ron DeSantis', title: 'Governor', party: 'REP' as Party, state: 'FL', bio: 'Governor of Florida.' },
  { name: 'Greg Abbott', title: 'Governor', party: 'REP' as Party, state: 'TX', bio: 'Governor of Texas.' },
  { name: 'Gretchen Whitmer', title: 'Governor', party: 'DEM' as Party, state: 'MI', bio: 'Governor of Michigan.' },
  { name: 'Wes Moore', title: 'Governor', party: 'DEM' as Party, state: 'MD', bio: 'First Black governor of Maryland.' },
  { name: 'Josh Shapiro', title: 'Governor', party: 'DEM' as Party, state: 'PA', bio: 'Governor of Pennsylvania.' },
  { name: 'Glenn Youngkin', title: 'Governor', party: 'REP' as Party, state: 'VA', bio: 'Former private equity exec turned governor.' },
  { name: 'Kathy Hochul', title: 'Governor', party: 'DEM' as Party, state: 'NY', bio: 'Governor of New York.' },
];

async function main() {
  console.log('Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@fantasypolitics.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`Admin user: ${admin.email}`);

  for (const p of politicians) {
    await prisma.politician.upsert({
      where: { id: p.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: p.name.toLowerCase().replace(/\s+/g, '-'),
        ...p,
      },
    });
  }

  console.log(`Seeded ${politicians.length} politicians`);

  const existingLeague = await prisma.league.findFirst({ where: { name: 'Beta League' } });

  if (!existingLeague) {
    const league = await prisma.league.create({
      data: {
        name: 'Beta League',
        inviteCode: 'BETA01',
        members: {
          create: {
            userId: admin.id,
            teamName: 'The Admins',
            isCommissioner: true,
          },
        },
      },
    });
    console.log(`Sample league: ${league.name} (invite: ${league.inviteCode})`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
