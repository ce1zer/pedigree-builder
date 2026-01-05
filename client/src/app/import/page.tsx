'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { Download, Link2 } from 'lucide-react';

type ImportWarning = {
  code: string;
  message: string;
};

type ImportedDogNode = {
  name: string;
  imageUrl?: string;
  profileUrl?: string;
  gender?: 'male' | 'female';
  father?: ImportedDogNode | null;
  mother?: ImportedDogNode | null;
};

type ImportedPedigree = {
  source: 'bullydex';
  sourceUrl: string;
  fetchedAt: string;
  root: ImportedDogNode;
  warnings: ImportWarning[];
};

type Champion =
  | 'none'
  | 'ch'
  | 'dual_ch'
  | 'gr_ch'
  | 'dual_gr_ch'
  | 'nw_gr_ch'
  | 'inw_gr_ch';

function championPrefixFromValue(champion: Champion): string {
  switch (champion) {
    case 'ch':
      return 'Ch. ';
    case 'dual_ch':
      return 'Dual Ch. ';
    case 'gr_ch':
      return 'Gr. Ch. ';
    case 'dual_gr_ch':
      return 'Dual Gr. Ch. ';
    case 'nw_gr_ch':
      return 'NW. Gr. Ch. ';
    case 'inw_gr_ch':
      return 'INW. Gr. Ch. ';
    default:
      return '';
  }
}

function splitBullyName(raw: string): { champion: Champion; kennel: string; dogName: string; rawName: string } {
  const rawName = (raw || '').replace(/\s+/g, ' ').trim();
  if (!rawName) return { champion: 'none', kennel: '', dogName: '', rawName: '' };

  let s = rawName.replace(/’/g, "'").replace(/\.+/g, '.').trim();

  // Champion parse (start-only; allow common compressed forms like GRCH)
  const championRules: Array<{ re: RegExp; value: Champion }> = [
    { re: /^(inw\.?\s*gr\.?\s*ch\.?\s+)/i, value: 'inw_gr_ch' },
    { re: /^(nw\.?\s*gr\.?\s*ch\.?\s+)/i, value: 'nw_gr_ch' },
    { re: /^(dual\.?\s*gr\.?\s*ch\.?\s+)/i, value: 'dual_gr_ch' },
    { re: /^(gr\.?\s*ch\.?\s+|grch\s+)/i, value: 'gr_ch' },
    { re: /^(dual\.?\s*ch\.?\s+)/i, value: 'dual_ch' },
    // Optional registry marker: treat as champion prefix but keep as `ch` in your enum
    { re: /^(abkc\s*ch\.?\s+)/i, value: 'ch' },
    { re: /^(ch\.?\s+)/i, value: 'ch' },
  ];

  let champion: Champion = 'none';
  for (const rule of championRules) {
    const m = s.match(rule.re);
    if (m) {
      champion = rule.value;
      s = s.slice(m[0].length).trim();
      break;
    }
  }

  const words = s.split(' ').filter(Boolean);
  if (words.length <= 1) return { champion, kennel: '', dogName: s, rawName };

  const kennelMarkers = [
    'kennel',
    'kennels',
    'bully',
    'bullies',
    'camp',
    'house',
    'line',
    'lines',
    'family',
    'k9',
  ];

  const isKennelMarkerToken = (w: string) => {
    const lower = w.toLowerCase();
    if (kennelMarkers.includes(lower)) return true;
    // Handle concatenated tokens like CHAVEZBULLYZCAMP.COM or SHORTYLINE
    return kennelMarkers.some(m => lower.includes(m)) || lower.includes('.com');
  };

  // A) possessive early: "Eminent's Boss" => kennel "Eminent's", name "Boss"
  const possIdx = words.findIndex(w => /'s$/i.test(w) || /'s/i.test(w));
  if (possIdx >= 0 && possIdx <= 3) {
    const kennel = words.slice(0, possIdx + 1).join(' ');
    const dogName = words.slice(possIdx + 1).join(' ');
    return { champion, kennel, dogName, rawName };
  }

  // B) marker appears early (or as substring in a token): "City Of Bullies Rocko-Mania"
  const markerIdx = words.findIndex(isKennelMarkerToken);
  if (markerIdx >= 0 && markerIdx <= 4) {
    const kennel = words.slice(0, markerIdx + 1).join(' ');
    const dogName = words.slice(markerIdx + 1).join(' ');
    return { champion, kennel, dogName, rawName };
  }

  // C) fallback: keep full remainder as dog name
  return { champion, kennel: '', dogName: s, rawName };
}

const PlaceholderSVG: React.FC<{ className?: string }> = ({ className = 'w-3/4 h-3/4 object-contain opacity-60' }) => {
  return (
    <svg viewBox="0 0 156.5 131" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M116.51.46c-.03,1.6-.25,3.52.97,4.76.23.23,5.5,3.02,5.83,3.07,1.4.23,5.23-.81,7.08-.44.71-2.49,2.47-4.43,4.56-5.9-1.1,6.77,3.18,6.02,6.31,9.14,1.55,1.55,2.39,4.14,3.91,5.81,1.16,1.27,3.95,2.38,3.69,4.11l-1.44,2.59c2.9,1.79,5.99.86,7.91,4.56.96,1.85-.03,10.35-.82,12.51-.55,1.52-1.81,2.16-2.32,3.16-.98,1.9-.03,3.04-2.42,4.55-5.35,3.38-8.95,1.11-14.03,1.92-1.78.28-3.51,1.85-5.74,2.24-4.96.86-6.91-2.31-5.78,4.73s5.48,8.82,1.71,17.1c-1.35,2.95-6.66,7.61-6.83,8.12-.88,2.56-.85,6.54-2.07,9.89-2.89,7.94-9.34,13.69-7.94,23.36.66,4.57,4.58,3.71,6.66,6.79,4.91,7.3-8.06,5.94-11.97,4.49-4.49-1.67-3.03-4.95-3.92-8.53-.65-2.63-2.71-3.19-1.55-6.96.26-.86,2.26-3.17,2.26-3.71v-10.71c-3.45,1.68-7.45,2.19-11.24,2.01-2.7-.12-8.58-2.15-9.93-2.02-1.26.12-4.49,4.71-4.99,5.99-1.07,2.75-1.28,15.49-.14,18.06,1.27,2.83,5.42,4.5,4.3,8.27-3.18.61-13.87,2.36-15.83-.23-.56-.75-1.46-4.46-1.45-5.44.02-1.85,2.12-5.04,1.86-5.9-.19-.61-1.39-.91-1.9-1.63-1.11-1.57-2.43-6.99-3.61-9.35s-5.91-8.3-5.78-10.44c.08-1.3,1.42-3.1.85-4.8-1.7-.17-.88,2.08-2.2,3.02-2.63,1.87-6.88-.79-8.51-3.02-5.27,7.71-15.67,5.23-20.59,12.78-.96,1.47-1.47,3.58-2.57,4.9-1.91,2.29-7.58,4.64-5.73,8.7.89,1.96,3.64,1.75,4.96,5,2.39,5.9-3.52,4.77-7.96,4.47-5.02-.34-8.04-.39-9-5.95-1.6-9.26,3.04-9.68,6.2-16.28,1.44-3.02,1.69-6.83,3.28-9.68.77-1.38,2.12-2.18,2.64-3.34.91-2.03,1.04-6.75,1.88-9.58,1.98-6.71,6.48-13.19,12.05-17.35,1.4-1.05,3.62-1.74,4.68-2.79,1.41-1.4,2.06-4.63,3.96-6.5,2.43-2.38,4.72-1.28,4.45-5.91-.39-6.59-7.66-6.63-10.66-11.3-1.12-1.74-1.9-4.03-.29-5.72.83-.72,1,.15,1.42.6,1.29,1.37,2.24,2.94,3.9,4.07,5.17,3.5,13.72,2.55,13.63,11.04,5.45-1.51,12.88-.72,17.94-3.23,2.81-1.4,5.54-6.33,8.5-8.44,2.13-1.52,6.38-2.16,7.31-2.91s3.59-5.38,4.86-6.84c5.52-6.34,12.11-12.03,20.23-14.65L116.01.46h.5Z"
        fill="#717179"
      />
    </svg>
  );
};

const ImportedPedigreeNode: React.FC<{ dog: ImportedDogNode | null; size: 'large' | 'medium' | 'small' }> = ({
  dog,
  size,
}) => {
  const sizeClasses = {
    large: 'w-full h-full',
    medium: 'w-full h-full',
    small: 'w-full h-full',
  };

  const imageSizeClasses = {
    large: 'w-2/3 aspect-[4/3]',
    medium: 'w-[35%] aspect-[4/3]',
    small: 'w-1/4 aspect-[4/3]',
  };

  const textSizeClasses = {
    large: { kennel: 'text-[16.5pt]', name: 'text-[19.5pt]' },
    medium: { kennel: 'text-[14pt]', name: 'text-[15.5pt]' },
    small: { kennel: 'text-[10.75pt]', name: 'text-[13pt]' },
  };

  const isUnknown = !dog;
  const split = dog ? splitBullyName(dog.name) : null;
  const championPrefix = split ? championPrefixFromValue(split.champion) : '';
  const kennelName = split?.kennel || '';
  const dogName = split?.dogName || dog?.name || '';
  const kennelDisplay = isUnknown
    ? 'UNKNOWN'
    : kennelName
      ? championPrefix + kennelName
      : (championPrefix ? championPrefix.trimEnd() : '');

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (dog?.profileUrl) {
      return (
        <a href={dog.profileUrl} target="_blank" rel="noreferrer" className="block">
          {children}
        </a>
      );
    }
    return <>{children}</>;
  };

  return (
    <div className={`${sizeClasses[size]} flex ${size === 'large' ? 'flex-col items-center justify-center' : 'items-center'} ${size === 'large' ? 'gap-[5px]' : 'gap-3'}`}>
      <Wrapper>
        <div className={`${imageSizeClasses[size]} overflow-hidden border-white border-2 flex-shrink-0`}>
          {dog?.imageUrl ? (
            <img src={dog.imageUrl} alt={dog.name} className="w-full h-full object-cover aspect-[4/3]" />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center aspect-[4/3]">
              <PlaceholderSVG />
            </div>
          )}
        </div>
      </Wrapper>

      <div className={`${size === 'large' ? 'w-full' : 'flex-1'} min-w-0 flex flex-col ${size === 'large' ? 'items-center text-center' : 'justify-center'}`}>
        {/* Reserve kennel line height so nodes don't shift when kennel is empty (matches dog page layout stability). */}
        <p className={`${textSizeClasses[size].kennel} min-h-[1em] text-[#717179] uppercase tracking-wider leading-tight font-bebas-neue`}>
          {kennelDisplay}
        </p>
        {dog ? (
          <Wrapper>
            <div
              className={`${textSizeClasses[size].name} text-white uppercase tracking-wide leading-tight hover:text-[color:var(--ring-color)] hover:underline block truncate mt-[2px] font-bebas-neue`}
              title={split?.rawName || dog.name}
            >
              {dogName}
            </div>
          </Wrapper>
        ) : (
          <p className={`${textSizeClasses[size].name} text-white uppercase tracking-wide leading-tight mt-[2px] font-bebas-neue`}>
            UNKNOWN
          </p>
        )}
      </div>
    </div>
  );
};

function buildGenerations(root: ImportedDogNode) {
  const father = root.father ?? null;
  const mother = root.mother ?? null;

  const fatherFather = father?.father ?? null;
  const fatherMother = father?.mother ?? null;
  const motherFather = mother?.father ?? null;
  const motherMother = mother?.mother ?? null;

  const ffFather = fatherFather?.father ?? null;
  const ffMother = fatherFather?.mother ?? null;
  const fmFather = fatherMother?.father ?? null;
  const fmMother = fatherMother?.mother ?? null;
  const mfFather = motherFather?.father ?? null;
  const mfMother = motherFather?.mother ?? null;
  const mmFather = motherMother?.father ?? null;
  const mmMother = motherMother?.mother ?? null;

  return {
    parents: [father, mother] as const,
    grandparents: [fatherFather, fatherMother, motherFather, motherMother] as const,
    greatGrandparents: [ffFather, ffMother, fmFather, fmMother, mfFather, mfMother, mmFather, mmMother] as const,
  };
}

async function waitForImages(container: HTMLElement, timeoutMs: number) {
  const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
  if (imgs.length === 0) return;

  const start = Date.now();
  await Promise.all(
    imgs.map(
      img =>
        new Promise<void>(resolve => {
          if (img.complete) return resolve();
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });

          const tick = () => {
            if (Date.now() - start > timeoutMs) resolve();
            else setTimeout(tick, 50);
          };
          tick();
        })
    )
  );
}

export default function ImportPage() {
  const [url, setUrl] = useState('https://www.bullydex.com/pedigree/US136756M/phoking-big-red');
  const [mode, setMode] = useState<'url' | 'html'>('url');
  const [htmlSource, setHtmlSource] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<ImportedPedigree | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const generations = useMemo(() => (result ? buildGenerations(result.root) : null), [result]);

  const handleImport = useCallback(async () => {
    if (mode === 'url' && !url.trim()) {
      toast.error('Please paste a URL');
      return;
    }
    if (mode === 'html' && !htmlSource.trim()) {
      toast.error('Please paste the page HTML/source');
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);

      const res = await fetch('/api/import/pedigree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'url'
            ? { url: url.trim() }
            : { url: url.trim(), html: htmlSource }
        ),
      });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || 'Import failed');
        return;
      }

      setResult(json.data as ImportedPedigree);
      toast.success('Imported pedigree');
    } catch (e: any) {
      toast.error(e?.message || 'Import failed');
    } finally {
      setIsLoading(false);
    }
  }, [url, mode, htmlSource]);

  const handleExport = useCallback(async () => {
    if (!exportRef.current || !result) return;

    try {
      setIsExporting(true);
      const exportEl = exportRef.current;

      // Use the same hardened export strategy as dog detail pages:
      // clone the DOM, inline computed styles, then render the clone with html2canvas.
      const createIsolatedClone = (original: HTMLElement): HTMLElement => {
        const clone = original.cloneNode(true) as HTMLElement;

        const removeClasses = (el: Element) => {
          el.removeAttribute('class');
          Array.from(el.children).forEach(removeClasses);
        };
        removeClasses(clone);

        const findOriginalElement = (cloneEl: Element, originalRoot: HTMLElement): HTMLElement | null => {
          const path: number[] = [];
          let current: Element | null = cloneEl;
          while (current && current !== clone) {
            const parent: Element | null = current.parentElement;
            if (parent) {
              const index = Array.from(parent.children).indexOf(current);
              path.unshift(index);
            }
            current = parent;
          }

          let originalEl: Element | null = originalRoot;
          for (const index of path) {
            if (originalEl && originalEl.children[index]) {
              originalEl = originalEl.children[index];
            } else {
              return null;
            }
          }
          return originalEl as HTMLElement;
        };

        const applyRGBStyles = (cloneEl: HTMLElement, originalRoot: HTMLElement) => {
          const originalEl = findOriginalElement(cloneEl, originalRoot);
          if (!originalEl) return;

          const existingInlineStyle = cloneEl.getAttribute('style') || '';
          const inlineStyleMap = new Map<string, string>();
          if (existingInlineStyle) {
            existingInlineStyle.split(';').forEach((decl) => {
              const [prop, value] = decl.split(':').map((s) => s.trim());
              if (prop && value) {
                inlineStyleMap.set(prop, value);
              }
            });
          }

          const computed = window.getComputedStyle(originalEl);

          const display = computed.display;
          const flexDirection = computed.flexDirection;
          const flexWrap = computed.flexWrap;
          const alignItems = computed.alignItems;
          const alignContent = computed.alignContent;
          const justifyContent = computed.justifyContent;
          const flexBasis = computed.flexBasis;
          const flexGrow = computed.flexGrow;
          const flexShrink = computed.flexShrink;
          const width = computed.width;
          const height = computed.height;
          const minWidth = computed.minWidth;
          const maxWidth = computed.maxWidth;
          const minHeight = computed.minHeight;
          const maxHeight = computed.maxHeight;
          const padding = computed.padding;
          const paddingTop = computed.paddingTop;
          const paddingRight = computed.paddingRight;
          const paddingBottom = computed.paddingBottom;
          const paddingLeft = computed.paddingLeft;
          const margin = computed.margin;
          const marginTop = computed.marginTop;
          const marginRight = computed.marginRight;
          const marginBottom = computed.marginBottom;
          const marginLeft = computed.marginLeft;
          const gap = computed.gap;
          const columnGap = computed.columnGap;
          const rowGap = computed.rowGap;
          const gridTemplateColumns = computed.gridTemplateColumns;
          const gridTemplateRows = computed.gridTemplateRows;
          const gridColumn = computed.gridColumn;
          const gridRow = computed.gridRow;
          const gridColumnStart = computed.gridColumnStart;
          const gridColumnEnd = computed.gridColumnEnd;
          const gridRowStart = computed.gridRowStart;
          const gridRowEnd = computed.gridRowEnd;
          const position = computed.position;
          const top = computed.top;
          const left = computed.left;
          const right = computed.right;
          const bottom = computed.bottom;
          const zIndex = computed.zIndex;
          const borderRadius = computed.borderRadius;
          const borderWidth = computed.borderWidth;
          const borderStyle = computed.borderStyle;
          const fontSize = computed.fontSize;
          const fontFamily = computed.fontFamily;
          const fontWeight = computed.fontWeight;
          const textAlign = computed.textAlign;
          const textTransform = computed.textTransform;
          const aspectRatio = computed.aspectRatio;
          const boxSizing = computed.boxSizing;
          const overflow = computed.overflow;
          const overflowX = computed.overflowX;
          const overflowY = computed.overflowY;
          const objectFit = computed.objectFit;
          const objectPosition = computed.objectPosition;
          const lineHeight = computed.lineHeight;
          const letterSpacing = computed.letterSpacing;
          const whiteSpace = computed.whiteSpace;
          const textOverflow = computed.textOverflow;
          const textDecoration = computed.textDecoration;
          const textDecorationLine = computed.textDecorationLine;
          const verticalAlign = computed.verticalAlign;
          const visibility = computed.visibility;
          const opacity = computed.opacity;

          const setStyleIfNotInline = (prop: string, value: string) => {
            const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (!inlineStyleMap.has(prop) && !inlineStyleMap.has(camelProp)) {
              cloneEl.style.setProperty(prop, value);
            }
          };

          if (display) setStyleIfNotInline('display', display);
          if (flexDirection) setStyleIfNotInline('flex-direction', flexDirection);
          if (flexWrap) setStyleIfNotInline('flex-wrap', flexWrap);
          if (alignItems) setStyleIfNotInline('align-items', alignItems);
          if (alignContent) setStyleIfNotInline('align-content', alignContent);
          if (justifyContent) setStyleIfNotInline('justify-content', justifyContent);
          if (flexBasis) setStyleIfNotInline('flex-basis', flexBasis);
          if (flexGrow) setStyleIfNotInline('flex-grow', flexGrow);
          if (flexShrink) setStyleIfNotInline('flex-shrink', flexShrink);
          if (width) setStyleIfNotInline('width', width);
          if (height) setStyleIfNotInline('height', height);
          if (minWidth) setStyleIfNotInline('min-width', minWidth);
          if (maxWidth) setStyleIfNotInline('max-width', maxWidth);
          if (minHeight) setStyleIfNotInline('min-height', minHeight);
          if (maxHeight) setStyleIfNotInline('max-height', maxHeight);
          if (padding) setStyleIfNotInline('padding', padding);
          if (paddingTop) setStyleIfNotInline('padding-top', paddingTop);
          if (paddingRight) setStyleIfNotInline('padding-right', paddingRight);
          if (paddingBottom) setStyleIfNotInline('padding-bottom', paddingBottom);
          if (paddingLeft) setStyleIfNotInline('padding-left', paddingLeft);
          if (margin) setStyleIfNotInline('margin', margin);
          if (marginTop) setStyleIfNotInline('margin-top', marginTop);
          if (marginRight) setStyleIfNotInline('margin-right', marginRight);
          if (marginBottom) setStyleIfNotInline('margin-bottom', marginBottom);
          if (marginLeft) setStyleIfNotInline('margin-left', marginLeft);
          if (gap) setStyleIfNotInline('gap', gap);
          if (columnGap) setStyleIfNotInline('column-gap', columnGap);
          if (rowGap) setStyleIfNotInline('row-gap', rowGap);
          if (gridTemplateColumns) setStyleIfNotInline('grid-template-columns', gridTemplateColumns);
          if (gridTemplateRows) setStyleIfNotInline('grid-template-rows', gridTemplateRows);
          if (gridColumn) setStyleIfNotInline('grid-column', gridColumn);
          if (gridRow) setStyleIfNotInline('grid-row', gridRow);
          if (gridColumnStart) setStyleIfNotInline('grid-column-start', gridColumnStart);
          if (gridColumnEnd) setStyleIfNotInline('grid-column-end', gridColumnEnd);
          if (gridRowStart) setStyleIfNotInline('grid-row-start', gridRowStart);
          if (gridRowEnd) setStyleIfNotInline('grid-row-end', gridRowEnd);
          if (position) setStyleIfNotInline('position', position);
          if (top) setStyleIfNotInline('top', top);
          if (left) setStyleIfNotInline('left', left);
          if (right) setStyleIfNotInline('right', right);
          if (bottom) setStyleIfNotInline('bottom', bottom);
          if (zIndex) setStyleIfNotInline('z-index', zIndex);
          if (borderRadius) setStyleIfNotInline('border-radius', borderRadius);
          if (borderWidth) setStyleIfNotInline('border-width', borderWidth);
          if (borderStyle) setStyleIfNotInline('border-style', borderStyle);
          if (fontSize) setStyleIfNotInline('font-size', fontSize);
          if (fontFamily) setStyleIfNotInline('font-family', fontFamily);
          if (textAlign) setStyleIfNotInline('text-align', textAlign);
          if (textTransform) setStyleIfNotInline('text-transform', textTransform);
          if (aspectRatio) setStyleIfNotInline('aspect-ratio', aspectRatio);
          if (boxSizing) setStyleIfNotInline('box-sizing', boxSizing);
          if (overflow) setStyleIfNotInline('overflow', overflow);
          if (overflowX) setStyleIfNotInline('overflow-x', overflowX);
          if (overflowY) setStyleIfNotInline('overflow-y', overflowY);
          if (objectFit) setStyleIfNotInline('object-fit', objectFit);
          if (objectPosition) setStyleIfNotInline('object-position', objectPosition);
          if (lineHeight) setStyleIfNotInline('line-height', lineHeight);
          if (letterSpacing) setStyleIfNotInline('letter-spacing', letterSpacing);
          if (textDecoration) setStyleIfNotInline('text-decoration', textDecoration);
          if (textDecorationLine) setStyleIfNotInline('text-decoration-line', textDecorationLine);
          if (verticalAlign) setStyleIfNotInline('vertical-align', verticalAlign);
          if (visibility) setStyleIfNotInline('visibility', visibility);
          if (opacity) setStyleIfNotInline('opacity', opacity);

          const tagName = cloneEl.tagName.toLowerCase();
          if (tagName === 'p' || tagName === 'a' || tagName === 'span') {
            cloneEl.style.setProperty('font-weight', '400');
          } else if (fontWeight) {
            setStyleIfNotInline('font-weight', fontWeight);
          }

          if (tagName === 'img') {
            const imgEl = cloneEl as HTMLImageElement;
            const originalImg = originalEl as HTMLImageElement;
            if (originalImg.src) imgEl.src = originalImg.src;

            cloneEl.style.setProperty('object-fit', objectFit || 'cover');
            if (objectPosition) cloneEl.style.setProperty('object-position', objectPosition);

            if (computed.width && computed.width !== 'auto') cloneEl.style.setProperty('width', computed.width);
            if (computed.height && computed.height !== 'auto') cloneEl.style.setProperty('height', computed.height);
            if (aspectRatio) cloneEl.style.setProperty('aspect-ratio', aspectRatio);

            cloneEl.style.setProperty('visibility', 'visible');
            cloneEl.style.setProperty('opacity', '1');
          }

          if (
            tagName === 'p' ||
            tagName === 'span' ||
            tagName === 'a' ||
            tagName === 'div' ||
            tagName === 'h1' ||
            tagName === 'h2' ||
            tagName === 'h3'
          ) {
            const isImageContainer = cloneEl.querySelector('img') !== null || originalEl.querySelector('img') !== null;
            cloneEl.style.setProperty('visibility', 'visible');
            cloneEl.style.setProperty('opacity', '1');

            if (whiteSpace) setStyleIfNotInline('white-space', whiteSpace);
            if (textOverflow) setStyleIfNotInline('text-overflow', textOverflow);

            if (!isImageContainer) {
              if (overflow === 'hidden') cloneEl.style.setProperty('overflow', 'visible');
              if (overflowX === 'hidden') cloneEl.style.setProperty('overflow-x', 'visible');
              if (overflowY === 'hidden') cloneEl.style.setProperty('overflow-y', 'visible');
            } else {
              // Preserve overflow-hidden for image containers to keep images within borders
              if (overflow === 'hidden') cloneEl.style.setProperty('overflow', 'hidden');
              if (overflowX === 'hidden') cloneEl.style.setProperty('overflow-x', 'hidden');
              if (overflowY === 'hidden') cloneEl.style.setProperty('overflow-y', 'hidden');
            }

            if (computed.color && computed.color !== 'rgba(0, 0, 0, 0)') {
              cloneEl.style.setProperty('color', 'rgb(255, 255, 255)');
            }
          }

          if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            cloneEl.style.setProperty('background-color', 'transparent');
          }

          if (computed.borderColor && computed.borderColor !== 'rgba(0, 0, 0, 0)') {
            const bs = computed.borderStyle;
            if (bs && bs !== 'none') {
              cloneEl.style.setProperty('border-color', 'rgb(255, 255, 255)');
            }
          }

          Array.from(cloneEl.children).forEach((child) => {
            applyRGBStyles(child as HTMLElement, originalRoot);
          });
        };

        applyRGBStyles(clone, original);
        return clone;
      };

      const isolatedClone = createIsolatedClone(exportEl);

      // Remove generation labels from export (match dog page behavior)
      const firstChild = isolatedClone.firstElementChild;
      if (firstChild) {
        const firstChildText = firstChild.textContent || '';
        if (
          firstChildText.includes('1st generation') &&
          firstChildText.includes('2nd generation') &&
          firstChildText.includes('3rd generation')
        ) {
          firstChild.remove();
        }
      }

      // Wait for images (clone) to load
      const images = isolatedClone.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img) => {
        return new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 5000);
          }
        });
      });
      await Promise.all(imagePromises);

      const rootComputed = window.getComputedStyle(exportEl);
      const originalWidth = exportEl.offsetWidth;
      const originalHeight = exportEl.offsetHeight;
      isolatedClone.style.width = rootComputed.width;
      isolatedClone.style.height = rootComputed.height;
      isolatedClone.style.maxWidth = rootComputed.maxWidth;
      isolatedClone.style.maxHeight = rootComputed.maxHeight;
      isolatedClone.style.padding = rootComputed.padding;
      isolatedClone.style.margin = rootComputed.margin;
      isolatedClone.style.backgroundColor = 'transparent';
      isolatedClone.style.display = rootComputed.display;

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = `${originalWidth}px`;
      tempContainer.style.height = `${originalHeight}px`;
      tempContainer.style.backgroundColor = 'transparent';
      tempContainer.style.overflow = 'visible';

      tempContainer.appendChild(isolatedClone);
      document.body.appendChild(tempContainer);

      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        const canvas = await html2canvas(isolatedClone, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: false,
          onclone: (clonedDoc) => {
            // Ensure aspect ratio is preserved if html2canvas drops it
            clonedDoc.querySelectorAll('img').forEach((img) => {
              const htmlImg = img as HTMLImageElement;
              if (!htmlImg.style.aspectRatio && htmlImg.width && htmlImg.height) {
                htmlImg.style.aspectRatio = `${htmlImg.width} / ${htmlImg.height}`;
              }
            });
            const style = clonedDoc.createElement('style');
            style.textContent = `
              p, a, span { font-weight: 400 !important; }
            `;
            clonedDoc.head.appendChild(style);
          },
        });

        const safeName = result.root.name.replace(/[^\w\-]+/g, '_').slice(0, 60) || 'pedigree';
        const fileName = `import_${safeName}-${Date.now()}.png`;
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Failed to generate image');
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success('Exported PNG');
        }, 'image/png');
      } finally {
        document.body.removeChild(tempContainer);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [result]);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Import pedigree from URL</h1>
            <p className="text-sm text-gray-400">
              BullyDex-only for now. We extract names + images and render in your export style (no database writes).
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="text-sm font-semibold text-gray-300 mb-2 block">Import method</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  type="radio"
                  name="importMode"
                  value="url"
                  checked={mode === 'url'}
                  onChange={() => setMode('url')}
                />
                URL (may be blocked by BullyDex)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  type="radio"
                  name="importMode"
                  value="html"
                  checked={mode === 'html'}
                  onChange={() => setMode('html')}
                />
                Paste HTML source (reliable)
              </label>
            </div>

            <div className="mt-3">
              <label className="text-sm font-semibold text-gray-300 mb-2 block">BullyDex Pedigree URL</label>
              <div className="relative">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input w-full pl-10"
                  placeholder="https://www.bullydex.com/pedigree/..."
                />
                <Link2 className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {mode === 'html' && (
                <div className="mt-3">
                  <label className="text-sm font-semibold text-gray-300 mb-2 block">Paste page source HTML</label>
                  <textarea
                    value={htmlSource}
                    onChange={(e) => setHtmlSource(e.target.value)}
                    className="input w-full min-h-[160px] font-mono text-xs"
                    placeholder="Paste the full HTML source of the BullyDex pedigree page here…"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Tip: open the BullyDex page, use “View Page Source”, then copy/paste everything.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Source: <a className="underline" href={result.sourceUrl} target="_blank" rel="noreferrer">{result.sourceUrl}</a>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="border-2 border-[color:var(--cta-border)] text-[color:var(--cta-fg)] hover:bg-[var(--cta-hover-bg)] hover:text-[color:var(--cta-hover-fg)] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting…' : 'Export PNG'}</span>
            </button>
          </div>

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <div className="card border border-yellow-500/30">
              <div className="text-sm font-semibold text-yellow-200 mb-2">Import warnings</div>
              <ul className="text-sm text-yellow-100/80 space-y-1">
                {result.warnings.map((w, idx) => (
                  <li key={`${w.code}-${idx}`}>{w.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview / Export DOM */}
          <div className="card w-full relative overflow-hidden">
            <div className="mb-4">
              <div className="text-lg font-semibold text-white">{result.root.name}</div>
              <div className="text-sm text-gray-400">Parents → Grandparents → Great-grandparents</div>
            </div>

            {/*
              Match the dog profile pedigree structure:
              - Screen tree: `.pedigree-screen` (theme tweaks without affecting export)
              - Export tree: `.pedigree-export-only` with `data-export-context="dog-detail-pedigree"`
              This ensures alignment rules in globals.css apply identically and does NOT touch dog page export.
            */}
            {(() => {
              const TreeContent = () => (
                <>
                  {/* Generation Labels */}
                  <div className="grid grid-cols-3 gap-x-8 mb-8">
                    <div className="text-center">
                      <p className="text-[12.5pt] text-white uppercase font-bold tracking-wider font-bebas-neue">1st generation</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[12.5pt] text-white uppercase font-bold tracking-wider font-bebas-neue">2nd generation</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[12.5pt] text-white uppercase font-bold tracking-wider font-bebas-neue">3rd generation</p>
                    </div>
                  </div>

                  {/* 3 Column Grid Layout (matches existing dog pedigree layout) */}
                  <div className="grid grid-cols-3 gap-x-[0.2rem] w-full items-start">
                    {/* Column 1: Parents */}
                    <div className="flex flex-col relative" style={{ height: '100%' }}>
                      <div className="relative" style={{ height: '50%' }}>
                        <div className="h-full w-full flex items-center justify-center">
                          <ImportedPedigreeNode dog={generations?.parents[0] ?? null} size="large" />
                        </div>
                      </div>
                      <div className="relative" style={{ height: '50%' }}>
                        <div className="h-full w-full flex items-center justify-center">
                          <ImportedPedigreeNode dog={generations?.parents[1] ?? null} size="large" />
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Grandparents */}
                    <div className="flex flex-col relative" style={{ height: '100%' }}>
                      <div className="relative" style={{ height: '25%' }}>
                        <div className="h-full flex items-center justify-center">
                          <ImportedPedigreeNode dog={generations?.grandparents[0] ?? null} size="medium" />
                        </div>
                      </div>
                      <div className="relative" style={{ height: '25%' }}>
                        <div className="h-full flex items-center justify-center">
                          <ImportedPedigreeNode dog={generations?.grandparents[1] ?? null} size="medium" />
                        </div>
                      </div>
                      <div className="relative" style={{ height: '25%' }}>
                        <div className="h-full flex items-center justify-center">
                          <ImportedPedigreeNode dog={generations?.grandparents[2] ?? null} size="medium" />
                        </div>
                      </div>
                      <div className="relative" style={{ height: '25%' }}>
                        <div className="h-full flex items-center justify-center">
                          <ImportedPedigreeNode dog={generations?.grandparents[3] ?? null} size="medium" />
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Great-grandparents */}
                    <div className="flex flex-col" style={{ height: '100%' }}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="relative" style={{ height: '12.5%' }}>
                          <div className="h-full flex items-center justify-center py-1">
                            <ImportedPedigreeNode
                              dog={(generations?.greatGrandparents[i] as ImportedDogNode | null) ?? null}
                              size="small"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );

              return (
                <>
                  <div className="pedigree-screen">
                    <TreeContent />
                  </div>

                  <div className="pedigree-export-only" aria-hidden="true">
                    <div
                      ref={exportRef}
                      data-pedigree-export
                      data-export-context="dog-detail-pedigree"
                      className="theme-legacy"
                    >
                      <TreeContent />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}


