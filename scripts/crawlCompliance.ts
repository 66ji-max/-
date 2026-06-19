/**
 * Malaysia Compliance Data Crawler (Seed/Mock)
 * 
 * Usage: npm run crawl:compliance
 * 
 * This script serves as a foundation for scraping official sources, news, and
 * policy updates related to Malaysia e-commerce compliance.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Compliance Crawler...');

  // 1. Ensure a basic source exists
  let source = await prisma.complianceSource.findFirst({
    where: { name: 'Malaysia Official Policy Mock Source' }
  });

  if (!source) {
    source = await prisma.complianceSource.create({
      data: {
        name: 'Malaysia Official Policy Mock Source',
        type: 'official',
        country: 'Malaysia',
        url: 'https://example.com/malaysia-policy'
      }
    });
    console.log(`Created new source: ${source.name}`);
  }

  // 2. Mock articles to crawl
  const mockArticles = [
    {
      title: '2026 Malaysia Digital Tax Update',
      summary: 'Malaysia introduces a new digital tax framework for cross-border e-commerce sellers starting Q3 2026.',
      content: 'Under the new framework, all cross-border transactions involving digital platforms must be registered. This applies to both B2B and B2C models...',
      url: 'https://example.com/my/digital-tax-2026',
      country: 'Malaysia',
      category: 'tax',
      language: 'en',
    },
    {
      title: 'Shopee MY: New Packaging Regulations',
      summary: 'Shopee Malaysia announces stricter packaging regulations to comply with environmental standards.',
      content: 'Effective next month, sellers on Shopee MY must use biodegradable packaging for certain categories. Failure to comply may lead to listing suppression.',
      url: 'https://example.com/my/shopee-packaging-2026',
      country: 'Malaysia',
      category: 'platform',
      language: 'en',
    },
    {
      title: 'Malaysia Customs Import Duty Guide 2026',
      summary: 'Updated import duty thresholds and prohibited items for e-commerce shipments into Malaysia.',
      content: 'The de minimis threshold remains at RM500. However, specific categories like electronics and cosmetics face new clearance processes.',
      url: 'https://example.com/my/customs-guide-2026',
      country: 'Malaysia',
      category: 'customs',
      language: 'en',
    }
  ];

  const run = await prisma.complianceCrawlRun.create({
    data: {
      sourceName: source.name,
      status: 'started'
    }
  });

  let savedCount = 0;

  for (const article of mockArticles) {
    const urlHash = Buffer.from(article.url).toString('base64');
    
    // Check if exists
    const existing = await prisma.complianceArticle.findUnique({
      where: { urlHash }
    });

    if (!existing) {
      await prisma.complianceArticle.create({
        data: {
          ...article,
          sourceId: source.id,
          urlHash,
          publishedAt: new Date(),
          status: 'draft' // Waiting for admin review
        }
      });
      savedCount++;
      console.log(`Saved article: ${article.title}`);
    } else {
      console.log(`Skipped existing article: ${article.title}`);
    }
  }

  await prisma.complianceCrawlRun.update({
    where: { id: run.id },
    data: {
      status: 'success',
      finishedAt: new Date(),
      foundCount: mockArticles.length,
      savedCount
    }
  });

  console.log('Compliance Crawler Finished Successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
