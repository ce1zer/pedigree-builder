import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

export const runtime = 'nodejs';

type ImportWarning = {
  code: string;
  message: string;
};

export type ImportedDogNode = {
  name: string;
  imageUrl?: string;
  profileUrl?: string;
  gender?: 'male' | 'female';
  father?: ImportedDogNode | null;
  mother?: ImportedDogNode | null;
};

export type ImportedPedigree = {
  source: 'bullydex';
  sourceUrl: string;
  fetchedAt: string;
  root: ImportedDogNode;
  warnings: ImportWarning[];
};

const BULLYDEX_HOST = 'www.bullydex.com';
const BULLYDEX_BASE = 'https://www.bullydex.com';

function proxyImageUrl(externalUrl?: string): string | undefined {
  if (!externalUrl) return undefined;
  return `/api/image-proxy?u=${encodeURIComponent(externalUrl)}`;
}

function absolutizeBullydexUrl(pathOrUrl?: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  if (pathOrUrl.startsWith('/')) return `${BULLYDEX_BASE}${pathOrUrl}`;
  return `${BULLYDEX_BASE}/${pathOrUrl}`;
}

function cleanText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function isAllowedBullydexPedigreeUrl(url: URL): boolean {
  if (url.protocol !== 'https:') return false;
  if (url.host !== BULLYDEX_HOST) return false;
  if (!url.pathname.startsWith('/pedigree/')) return false;
  return true;
}

function inferGenderFromCardClass(classAttr: string | undefined): 'male' | 'female' | undefined {
  if (!classAttr) return undefined;
  // In BullyDex markup, male cards include `bg-male`. Female cards often omit it.
  if (classAttr.split(/\s+/).includes('bg-male')) return 'male';
  return 'female';
}

function parseDogCard(
  $: cheerio.CheerioAPI,
  el: Element,
  titleSelector: string,
  warnings: ImportWarning[]
): Omit<ImportedDogNode, 'father' | 'mother'> | null {
  const name = cleanText($(el).find(titleSelector).first().text() || '');
  if (!name) return null;

  const imgSrc = $(el).find('img').first().attr('src') || undefined;
  const href = $(el).find('a').first().attr('href') || undefined;

  const classAttr = $(el).attr('class') || '';
  const gender = inferGenderFromCardClass(classAttr);

  const profileUrl = absolutizeBullydexUrl(href);
  const imageUrl = proxyImageUrl(imgSrc);

  if (imgSrc && !imageUrl) {
    warnings.push({ code: 'image_proxy_failed', message: `Could not proxy image URL for ${name}` });
  }

  return { name, imageUrl, profileUrl, gender };
}

function parseBullydexPedigree(html: string, sourceUrl: string): ImportedPedigree {
  const warnings: ImportWarning[] = [];
  const $ = cheerio.load(html);

  const rootName = cleanText($('.title-dog').first().text() || '');
  const rootImg = $('.imgdogprofile img').first().attr('src') || undefined;

  if (!rootName) {
    warnings.push({ code: 'root_name_missing', message: 'Could not find the root dog name on the page.' });
  }

  // Find the 2 pedigree rows inside the tree section (father branch row, then mother branch row)
  const pedigreeRows = $('.bg-arbor .container > .row').filter((_, row) => {
    const r = $(row);
    return r.find('.generation-container.gen1, .generation-container.gen2, .generation-container.gen3').length > 0;
  });

  if (pedigreeRows.length < 2) {
    warnings.push({
      code: 'pedigree_rows_missing',
      message: 'Could not find the expected pedigree rows (father/mother branches). The page template may have changed.',
    });
  }

  const fatherRow = pedigreeRows.eq(0);
  const motherRow = pedigreeRows.eq(1);

  const extractRow = (row: cheerio.Cheerio<Element>) => {
    const gen1 = row
      .find('.gen1 .boxed-gen1')
      .toArray()
      .map(el => parseDogCard($, el, '.titlu-dog-gen1', warnings))
      .filter(Boolean) as Array<Omit<ImportedDogNode, 'father' | 'mother'>>;

    const gen2 = row
      .find('.gen2 .boxed-gen2')
      .toArray()
      .map(el => parseDogCard($, el, '.titlu-dog-gen2', warnings))
      .filter(Boolean) as Array<Omit<ImportedDogNode, 'father' | 'mother'>>;

    const gen3 = row
      .find('.gen3 .boxed-gen3')
      .toArray()
      .map(el => parseDogCard($, el, '.titlu-dog-gen3', warnings))
      .filter(Boolean) as Array<Omit<ImportedDogNode, 'father' | 'mother'>>;

    return { gen1, gen2, gen3 };
  };

  const F = extractRow(fatherRow);
  const M = extractRow(motherRow);

  // Build a 3-generation tree:
  // root -> (father, mother) -> grandparents -> great-grandparents
  const father: ImportedDogNode | null = F.gen1[0] ? { ...F.gen1[0], father: null, mother: null } : null;
  const mother: ImportedDogNode | null = M.gen1[0] ? { ...M.gen1[0], father: null, mother: null } : null;

  const ff: ImportedDogNode | null = F.gen2[0] ? { ...F.gen2[0], father: null, mother: null } : null;
  const fm: ImportedDogNode | null = F.gen2[1] ? { ...F.gen2[1], father: null, mother: null } : null;
  const mf: ImportedDogNode | null = M.gen2[0] ? { ...M.gen2[0], father: null, mother: null } : null;
  const mm: ImportedDogNode | null = M.gen2[1] ? { ...M.gen2[1], father: null, mother: null } : null;

  if (father) {
    father.father = ff;
    father.mother = fm;
  }
  if (mother) {
    mother.father = mf;
    mother.mother = mm;
  }

  // Great-grandparents ordering:
  // fatherRow gen3: [ff.father, ff.mother, fm.father, fm.mother]
  const fff: ImportedDogNode | null = F.gen3[0] ? { ...F.gen3[0], father: null, mother: null } : null;
  const ffm: ImportedDogNode | null = F.gen3[1] ? { ...F.gen3[1], father: null, mother: null } : null;
  const fmf: ImportedDogNode | null = F.gen3[2] ? { ...F.gen3[2], father: null, mother: null } : null;
  const fmm: ImportedDogNode | null = F.gen3[3] ? { ...F.gen3[3], father: null, mother: null } : null;

  if (ff) {
    ff.father = fff;
    ff.mother = ffm;
  }
  if (fm) {
    fm.father = fmf;
    fm.mother = fmm;
  }

  // motherRow gen3: [mf.father, mf.mother, mm.father, mm.mother]
  const mff: ImportedDogNode | null = M.gen3[0] ? { ...M.gen3[0], father: null, mother: null } : null;
  const mfm: ImportedDogNode | null = M.gen3[1] ? { ...M.gen3[1], father: null, mother: null } : null;
  const mmf: ImportedDogNode | null = M.gen3[2] ? { ...M.gen3[2], father: null, mother: null } : null;
  const mmm: ImportedDogNode | null = M.gen3[3] ? { ...M.gen3[3], father: null, mother: null } : null;

  if (mf) {
    mf.father = mff;
    mf.mother = mfm;
  }
  if (mm) {
    mm.father = mmf;
    mm.mother = mmm;
  }

  // Validate counts to warn (non-fatal)
  if (F.gen1.length && F.gen1.length !== 1) {
    warnings.push({ code: 'unexpected_father_gen1_count', message: `Expected 1 father, found ${F.gen1.length}.` });
  }
  if (M.gen1.length && M.gen1.length !== 1) {
    warnings.push({ code: 'unexpected_mother_gen1_count', message: `Expected 1 mother, found ${M.gen1.length}.` });
  }
  if (F.gen2.length && F.gen2.length !== 2) {
    warnings.push({ code: 'unexpected_father_gen2_count', message: `Expected 2 father grandparents, found ${F.gen2.length}.` });
  }
  if (M.gen2.length && M.gen2.length !== 2) {
    warnings.push({ code: 'unexpected_mother_gen2_count', message: `Expected 2 mother grandparents, found ${M.gen2.length}.` });
  }
  if (F.gen3.length && F.gen3.length !== 4) {
    warnings.push({ code: 'unexpected_father_gen3_count', message: `Expected 4 father great-grandparents, found ${F.gen3.length}.` });
  }
  if (M.gen3.length && M.gen3.length !== 4) {
    warnings.push({ code: 'unexpected_mother_gen3_count', message: `Expected 4 mother great-grandparents, found ${M.gen3.length}.` });
  }

  const root: ImportedDogNode = {
    name: rootName || 'UNKNOWN',
    imageUrl: proxyImageUrl(rootImg),
    profileUrl: sourceUrl,
    father,
    mother,
  };

  return {
    source: 'bullydex',
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    root,
    warnings,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const urlString = body?.url;
    const htmlString = body?.html;

    if (htmlString && typeof htmlString === 'string' && htmlString.trim().length > 0) {
      const sourceUrlForHtml = typeof urlString === 'string' && urlString.trim() ? urlString.trim() : 'about:blank';
      const data = parseBullydexPedigree(htmlString, sourceUrlForHtml);
      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    if (!urlString || typeof urlString !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing "url" in request body (or provide "html" to import from pasted source)' },
        { status: 400 }
      );
    }

    let url: URL;
    try {
      url = new URL(urlString);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
    }

    if (!isAllowedBullydexPedigreeUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Only BullyDex pedigree URLs are supported for now.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        // Basic UA helps avoid simplistic bot blocks.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      if (res.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error:
              'BullyDex blocked this server request (HTTP 403 / bot protection). Use "Paste HTML source" mode to import, or try again later.',
          },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Failed to fetch page (HTTP ${res.status})` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const data = parseBullydexPedigree(html, url.toString());

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    const message = error?.name === 'AbortError' ? 'Timed out fetching URL' : error?.message || 'Unexpected error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


