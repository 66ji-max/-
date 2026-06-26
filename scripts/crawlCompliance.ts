/**
 * Malaysia Compliance Data Crawler
 * 
 * Usage: npm run crawl:compliance
 */
import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

const prisma = new PrismaClient();

type ComplianceSourceConfig = {
  name: string;
  type: 'official' | 'news' | 'industry' | 'manual';
  country: string;
  url: string;
  category: string;
  language: string;
  priority: 'P0' | 'P1' | 'P2';
};

type CrawledArticle = {
  title: string;
  summary?: string;
  url: string;
  publishedAt?: Date | null;
  category?: string;
  language?: string;
};

const SOURCES: ComplianceSourceConfig[] = [
  {
    name: 'MATRADE Press Release',
    type: 'official',
    country: 'Malaysia',
    url: 'https://www.matrade.gov.my/en/about-matrade/press-release',
    category: 'ecommerce',
    language: 'en',
    priority: 'P0'
  },
  {
    name: 'MyIPO Official Portal',
    type: 'official',
    country: 'Malaysia',
    url: 'https://www.myipo.gov.my/en/',
    category: 'trademark',
    language: 'en',
    priority: 'P0'
  },
  {
    name: 'Royal Malaysian Customs',
    type: 'official',
    country: 'Malaysia',
    url: 'https://www.customs.gov.my/ms/',
    category: 'customs',
    language: 'ms',
    priority: 'P0'
  },
  {
    name: 'MITI Official Portal',
    type: 'official',
    country: 'Malaysia',
    url: 'https://www.miti.gov.my/',
    category: 'policy',
    language: 'en',
    priority: 'P1'
  },
  {
    name: 'MDEC Official Website',
    type: 'official',
    country: 'Malaysia',
    url: 'https://mdec.my/',
    category: 'ecommerce',
    language: 'en',
    priority: 'P1'
  }
];

function normalizeUrl(baseUrl: string, href: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

function createUrlHash(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex');
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function crawlMatrade(source: ComplianceSourceConfig, html: string): Promise<CrawledArticle[]> {
  const $ = cheerio.load(html);
  const articles: CrawledArticle[] = [];
  
  $('a').each((i, el) => {
    const $el = $(el);
    const text = cleanText($el.text());
    const href = $el.attr('href');
    
    if (href && text.length > 20 && !href.startsWith('#')) {
      articles.push({
        title: text,
        summary: text,
        url: normalizeUrl(source.url, href),
        category: source.category,
        language: source.language,
        publishedAt: new Date(),
      });
    }
  });
  
  const uniqueUrls = new Set();
  return articles.filter(a => {
      if (uniqueUrls.has(a.url)) return false;
      uniqueUrls.add(a.url);
      return true;
  });
}

function getCategoryFromText(text: string, defaultCategory: string): string {
    const t = text.toLowerCase();
    if (t.includes('patent') || t.includes('专利')) return 'patent';
    if (t.includes('copyright') || t.includes('版权')) return 'copyright';
    if (t.includes('trademark') || t.includes('商标')) return 'trademark';
    return defaultCategory;
}

async function crawlMyIPO(source: ComplianceSourceConfig, html: string): Promise<CrawledArticle[]> {
  const $ = cheerio.load(html);
  const articles: CrawledArticle[] = [];
  
  const keywords = ['trademark', 'patent', 'copyright', 'industrial design', 'geographical indication', 'announcement', 'news', '商标', '专利', '版权'];
  
  $('a').each((i, el) => {
    const $el = $(el);
    const text = cleanText($el.text());
    const href = $el.attr('href');
    
    if (href && text.length > 10 && !href.startsWith('#')) {
        const tLower = text.toLowerCase();
        if (keywords.some(k => tLower.includes(k))) {
            articles.push({
                title: text,
                summary: text,
                url: normalizeUrl(source.url, href),
                category: getCategoryFromText(tLower, source.category),
                language: source.language,
                publishedAt: new Date(),
            });
        }
    }
  });
  
  const uniqueUrls = new Set();
  return articles.filter(a => {
      if (uniqueUrls.has(a.url)) return false;
      uniqueUrls.add(a.url);
      return true;
  });
}

async function crawlGeneric(source: ComplianceSourceConfig, html: string): Promise<CrawledArticle[]> {
  const $ = cheerio.load(html);
  const articles: CrawledArticle[] = [];
  
  const keywords = [
    'customs', 'import', 'export', 'duty', 'tax', 'sst', 'excise', 'ecommerce', 
    'digital', 'trade', 'policy', 'compliance', 'regulation', 'guideline', 
    'announcement', 'press', 'kastam', 'cukai', 'import', 'eksport', 'dasar', 'garis panduan'
  ];
  
  const ignoreKeywords = ['login', 'contact', 'sitemap', 'privacy', 'terms', 'social media'];
  
  $('a').each((i, el) => {
    const $el = $(el);
    const text = cleanText($el.text());
    const href = $el.attr('href');
    
    if (href && text.length > 10 && !href.startsWith('#') && !href.toLowerCase().endsWith('.jpg') && !href.toLowerCase().endsWith('.pdf')) {
        const tLower = text.toLowerCase();
        
        if (ignoreKeywords.some(k => tLower.includes(k))) return;
        
        if (keywords.some(k => tLower.includes(k))) {
            articles.push({
                title: text,
                summary: text,
                url: normalizeUrl(source.url, href),
                category: source.category,
                language: source.language,
                publishedAt: new Date(),
            });
        }
    }
  });
  
  const uniqueUrls = new Set();
  return articles.filter(a => {
      if (uniqueUrls.has(a.url)) return false;
      uniqueUrls.add(a.url);
      return true;
  });
}

async function crawlSource(source: ComplianceSourceConfig): Promise<CrawledArticle[]> {
    try {
        const html = await fetchHtml(source.url);
        
        if (source.name.includes('MATRADE')) {
            return await crawlMatrade(source, html);
        } else if (source.name.includes('MyIPO')) {
            return await crawlMyIPO(source, html);
        } else {
            return await crawlGeneric(source, html);
        }
    } catch (err) {
        console.error(`Error fetching/crawling ${source.name}:`, err);
        return [];
    }
}

async function saveSourceAndArticles(source: ComplianceSourceConfig, articles: CrawledArticle[]) {
    // Upsert source
    let dbSource = await prisma.complianceSource.findFirst({
        where: { url: source.url }
    });
    
    if (dbSource) {
        dbSource = await prisma.complianceSource.update({
            where: { id: dbSource.id },
            data: {
                name: source.name,
                type: source.type,
                country: source.country,
                enabled: true
            }
        });
    } else {
        dbSource = await prisma.complianceSource.create({
            data: {
                name: source.name,
                type: source.type,
                country: source.country,
                url: source.url,
                enabled: true
            }
        });
    }

    let savedCount = 0;
    
    for (const article of articles) {
        const urlHash = createUrlHash(article.url);
        
        const existing = await prisma.complianceArticle.findUnique({
            where: { urlHash }
        });
        
        if (!existing) {
            await prisma.complianceArticle.create({
                data: {
                    sourceId: dbSource.id,
                    title: article.title,
                    summary: article.summary,
                    url: article.url,
                    urlHash,
                    country: source.country,
                    category: article.category,
                    language: article.language,
                    publishedAt: article.publishedAt,
                    status: 'draft',
                }
            });
            savedCount++;
            console.log(`Saved new article: ${article.title}`);
        } else {
            // Can update summary etc.
            await prisma.complianceArticle.update({
                where: { urlHash },
                data: {
                    summary: article.summary,
                    category: article.category
                }
            });
        }
    }
    
    return { foundCount: articles.length, savedCount };
}

async function main() {
  console.log('Starting Official Compliance Crawler...');

  for (const source of SOURCES) {
      const run = await prisma.complianceCrawlRun.create({
          data: {
              sourceName: source.name,
              status: 'started'
          }
      });
      
      try {
          console.log(`Crawling ${source.name}...`);
          const articles = await crawlSource(source);
          const stats = await saveSourceAndArticles(source, articles);
          
          await prisma.complianceCrawlRun.update({
              where: { id: run.id },
              data: {
                  status: 'success',
                  finishedAt: new Date(),
                  foundCount: stats.foundCount,
                  savedCount: stats.savedCount
              }
          });
          console.log(`Finished ${source.name}: Found ${stats.foundCount}, Saved ${stats.savedCount}`);
      } catch (err: any) {
          console.error(`Failed to crawl ${source.name}:`, err);
          await prisma.complianceCrawlRun.update({
              where: { id: run.id },
              data: {
                  status: 'failed',
                  errorMessage: err?.message || String(err),
                  finishedAt: new Date()
              }
          });
      }
  }

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
