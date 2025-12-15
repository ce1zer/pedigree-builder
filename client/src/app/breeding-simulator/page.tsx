'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, ChevronDown, X } from 'lucide-react';
import { Dog } from '@/types';
import { dogsApi } from '@/services/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

// Constants
const ICON_SIZE = 'h-5 w-5';

// Placeholder SVG component (inline for html2canvas compatibility)
const PlaceholderSVG: React.FC<{ className?: string }> = ({ className = "w-3/4 h-3/4 object-contain opacity-60" }) => {
  return (
    <svg 
      viewBox="0 0 156.5 131" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M116.51.46c-.03,1.6-.25,3.52.97,4.76.23.23,5.5,3.02,5.83,3.07,1.4.23,5.23-.81,7.08-.44.71-2.49,2.47-4.43,4.56-5.9-1.1,6.77,3.18,6.02,6.31,9.14,1.55,1.55,2.39,4.14,3.91,5.81,1.16,1.27,3.95,2.38,3.69,4.11l-1.44,2.59c2.9,1.79,5.99.86,7.91,4.56.96,1.85-.03,10.35-.82,12.51-.55,1.52-1.81,2.16-2.32,3.16-.98,1.9-.03,3.04-2.42,4.55-5.35,3.38-8.95,1.11-14.03,1.92-1.78.28-3.51,1.85-5.74,2.24-4.96.86-6.91-2.31-5.78,4.73s5.48,8.82,1.71,17.1c-1.35,2.95-6.66,7.61-6.83,8.12-.88,2.56-.85,6.54-2.07,9.89-2.89,7.94-9.34,13.69-7.94,23.36.66,4.57,4.58,3.71,6.66,6.79,4.91,7.3-8.06,5.94-11.97,4.49-4.49-1.67-3.03-4.95-3.92-8.53-.65-2.63-2.71-3.19-1.55-6.96.26-.86,2.26-3.17,2.26-3.71v-10.71c-3.45,1.68-7.45,2.19-11.24,2.01-2.7-.12-8.58-2.15-9.93-2.02-1.26.12-4.49,4.71-4.99,5.99-1.07,2.75-1.28,15.49-.14,18.06,1.27,2.83,5.42,4.5,4.3,8.27-3.18.61-13.87,2.36-15.83-.23-.56-.75-1.46-4.46-1.45-5.44.02-1.85,2.12-5.04,1.86-5.9-.19-.61-1.39-.91-1.9-1.63-1.11-1.57-2.43-6.99-3.61-9.35s-5.91-8.3-5.78-10.44c.08-1.3,1.42-3.1.85-4.8-1.7-.17-.88,2.08-2.2,3.02-2.63,1.87-6.88-.79-8.51-3.02-5.27,7.71-15.67,5.23-20.59,12.78-.96,1.47-1.47,3.58-2.57,4.9-1.91,2.29-7.58,4.64-5.73,8.7.89,1.96,3.64,1.75,4.96,5,2.39,5.9-3.52,4.77-7.96,4.47-5.02-.34-8.04-.39-9-5.95-1.6-9.26,3.04-9.68,6.2-16.28,1.44-3.02,1.69-6.83,3.28-9.68.77-1.38,2.12-2.18,2.64-3.34.91-2.03,1.04-6.75,1.88-9.58,1.98-6.71,6.48-13.19,12.05-17.35,1.4-1.05,3.62-1.74,4.68-2.79,1.41-1.4,2.06-4.63,3.96-6.5,2.43-2.38,4.72-1.28,4.45-5.91-.39-6.59-7.66-6.63-10.66-11.3-1.12-1.74-1.9-4.03-.29-5.72.83-.72,1,.15,1.42.6,1.29,1.37,2.24,2.94,3.9,4.07,5.17,3.5,13.72,2.55,13.63,11.04,5.45-1.51,12.88-.72,17.94-3.23,2.81-1.4,5.54-6.33,8.5-8.44,2.13-1.52,6.38-2.16,7.31-2.91s3.59-5.38,4.86-6.84c5.52-6.34,12.11-12.03,20.23-14.65L116.01.46h.5Z" 
        fill="#717179"
      />
    </svg>
  );
};

// Pedigree generation interface
interface PedigreeGeneration {
  generation: number;
  dogs: (Dog | null)[];
}

// Helper function to fetch a dog by ID
const fetchDogById = async (dogId: string): Promise<Dog | null> => {
  try {
    const response = await dogsApi.getById(dogId);
    return response.success && response.data ? response.data : null;
  } catch (error) {
    console.warn(`Failed to fetch dog with ID ${dogId}:`, error);
    return null;
  }
};

// Helper function to build pedigree generations recursively for a single dog
const buildPedigreeGenerations = async (rootDog: Dog): Promise<PedigreeGeneration[]> => {
  const generations: PedigreeGeneration[] = [
    {
      generation: 0,
      dogs: [rootDog]
    }
  ];

  // Generation 1: Parents
  const parents: (Dog | null)[] = [];
  if (rootDog.father_id) {
    parents.push(await fetchDogById(rootDog.father_id));
  } else {
    parents.push(null);
  }
  if (rootDog.mother_id) {
    parents.push(await fetchDogById(rootDog.mother_id));
  } else {
    parents.push(null);
  }
  generations.push({
    generation: 1,
    dogs: parents
  });

  // Generation 2: Grandparents
  const grandparents: (Dog | null)[] = [];
  for (const parent of parents) {
    if (parent?.father_id) {
      grandparents.push(await fetchDogById(parent.father_id));
    } else {
      grandparents.push(null);
    }
    if (parent?.mother_id) {
      grandparents.push(await fetchDogById(parent.mother_id));
    } else {
      grandparents.push(null);
    }
  }
  generations.push({
    generation: 2,
    dogs: grandparents
  });

  // Generation 3: Great-grandparents
  const greatGrandparents: (Dog | null)[] = [];
  for (const grandparent of grandparents) {
    if (grandparent?.father_id) {
      greatGrandparents.push(await fetchDogById(grandparent.father_id));
    } else {
      greatGrandparents.push(null);
    }
    if (grandparent?.mother_id) {
      greatGrandparents.push(await fetchDogById(grandparent.mother_id));
    } else {
      greatGrandparents.push(null);
    }
  }
  generations.push({
    generation: 3,
    dogs: greatGrandparents
  });

  return generations;
};

// Helper function to get kennel name
const getKennelName = (dog: Dog | null): string => {
  if (!dog) return '';
  if (typeof dog.primary_kennel === 'object' && dog.primary_kennel?.name) {
    return dog.primary_kennel.name;
  }
  return typeof dog.primary_kennel === 'string' ? dog.primary_kennel : '';
};

// Pedigree Node Component
interface PedigreeNodeProps {
  dog: Dog | null;
  size?: 'large' | 'medium' | 'small';
  side?: 'father' | 'mother'; // For 3rd generation: father = text left, mother = text right
}

const PedigreeNode: React.FC<PedigreeNodeProps> = ({ dog, size = 'medium', side }) => {
  const sizeClasses = {
    large: 'w-full h-full',
    medium: 'w-full h-full',
    small: 'w-full h-full'
  };

  const imageSizeClasses = {
    large: 'w-full', // Increased by 50%: w-2/3 (66.67%) -> w-full (100%), height increased by 15% via aspect ratio
    medium: 'w-[52.5%] aspect-[4/3]', // Increased by 50%: w-[35%] -> w-[52.5%]
    small: 'w-[37.5%] aspect-[4/3]' // Increased by 50%: w-1/4 (25%) -> w-[37.5%]
  };

  const textSizeClasses = {
    large: {
      kennel: 'text-[8.25pt]', // Reduced by 50%: 16.5pt -> 8.25pt
      name: 'text-[13.75pt]' // Increased by 2pt: 11.75pt -> 13.75pt for 1st generation
    },
    medium: {
      kennel: 'text-[6.5pt]', // Reduced by 50%: 13pt -> 6.5pt
      name: 'text-[7.5pt]' // Reduced by 50%: 15pt -> 7.5pt
    },
    small: {
      kennel: 'text-[6pt]', // Reduced by 50%: 12pt -> 6pt
      name: 'text-[6.5pt]' // Reduced by 50%: 13pt -> 6.5pt
    }
  };

  const isUnknown = !dog;
  const imageBorderColor = 'border-white';

  // For large and medium sizes (1st and 2nd generation), use vertical layout (image on top, text below)
  // For small (3rd generation): father's side = text left, mother's side = text right
  const isVerticalLayout = size === 'large' || size === 'medium';
  const isSmallWithTextLeft = size === 'small' && side === 'father';
  
  // Reduced gap for 1st and 2nd generation to bring text closer to images
  const gapClass = size === 'large' ? 'gap-[5px]' : size === 'medium' ? 'gap-[2px]' : 'gap-3';
  
  return (
    <div className={`${sizeClasses[size]} flex ${isVerticalLayout ? 'flex-col items-center justify-center' : 'items-center'} ${gapClass} ${size === 'small' ? 'h-full' : ''}`}>
      {/* For small size on father's side (3rd generation), text comes first (left side) */}
      {isSmallWithTextLeft && (
        <div className="flex-1 min-w-0 flex flex-col justify-center items-end text-right" style={{ height: '100%' }}>
          <p className={`${textSizeClasses[size].kennel} text-[#717179] uppercase tracking-wider leading-tight font-bebas-neue`}>
            {isUnknown ? 'UNKNOWN' : (() => {
              const championPrefix = dog?.champion === 'ch' ? 'Ch. ' 
                : dog?.champion === 'dual_ch' ? 'Dual Ch. '
                : dog?.champion === 'gr_ch' ? 'Gr. Ch. '
                : dog?.champion === 'dual_gr_ch' ? 'Dual Gr. Ch. '
                : dog?.champion === 'nw_gr_ch' ? 'NW. Gr. Ch. '
                : dog?.champion === 'inw_gr_ch' ? 'INW. Gr. Ch. '
                : '';
              return championPrefix + getKennelName(dog);
            })()}
          </p>
          {dog ? (
            <Link 
              href={`/dogs/${dog.id}`}
              className={`${textSizeClasses[size].name} text-white uppercase font-bold tracking-wide leading-tight hover:text-[color:var(--ring-color)] hover:underline block truncate mt-[1px] font-bebas-neue`}
            >
              {dog.dog_name}
            </Link>
          ) : (
            <p className={`${textSizeClasses[size].name} text-white uppercase font-bold tracking-wide leading-tight mt-[1px] font-bebas-neue`}>
              UNKNOWN
            </p>
          )}
        </div>
      )}
      
      {/* Square Image with Border - Clickable if dog exists */}
      {dog ? (
        <Link 
          href={`/dogs/${dog.id}`} 
          className={`${imageSizeClasses[size]} overflow-hidden ${isVerticalLayout ? 'flex-shrink-0' : 'flex-shrink-0 self-center'} ${imageBorderColor} border-2 hover:underline block`}
        >
          {dog?.image_url ? (
            <img
              src={dog.image_url}
              alt={dog.dog_name || 'Unknown'}
              className={`w-full h-full object-cover ${size === 'large' ? 'aspect-[4/3.45]' : 'aspect-[4/3]'}`}
            />
          ) : (
            <div className={`w-full h-full bg-gray-800 flex items-center justify-center ${size === 'large' ? 'aspect-[4/3.45]' : 'aspect-[4/3]'}`}>
              <PlaceholderSVG />
            </div>
          )}
        </Link>
      ) : (
        <div className={`${imageSizeClasses[size]} overflow-hidden ${isVerticalLayout ? 'flex-shrink-0' : 'flex-shrink-0 self-center'} ${imageBorderColor} border-2`}>
          <div className={`w-full h-full bg-gray-800 flex items-center justify-center ${size === 'large' ? 'aspect-[4/3.45]' : 'aspect-[4/3]'}`}>
            <PlaceholderSVG />
          </div>
        </div>
      )}
      
      {/* Dog Info - For large and medium sizes (vertical layout) and small size on mother's side (text right) */}
      {(size === 'large' || size === 'medium' || (size === 'small' && side === 'mother')) && (
        <div className={`${isVerticalLayout ? 'w-full' : 'flex-1'} min-w-0 flex flex-col ${isVerticalLayout ? 'items-center text-center' : 'justify-center'} ${size === 'small' ? 'h-full' : ''}`}>
          <p className={`${textSizeClasses[size].kennel} text-[#717179] uppercase tracking-wider leading-tight font-bebas-neue`}>
            {isUnknown ? 'UNKNOWN' : (() => {
              const championPrefix = dog?.champion === 'ch' ? 'Ch. ' 
                : dog?.champion === 'dual_ch' ? 'Dual Ch. '
                : dog?.champion === 'gr_ch' ? 'Gr. Ch. '
                : dog?.champion === 'dual_gr_ch' ? 'Dual Gr. Ch. '
                : dog?.champion === 'nw_gr_ch' ? 'NW. Gr. Ch. '
                : dog?.champion === 'inw_gr_ch' ? 'INW. Gr. Ch. '
                : '';
              return championPrefix + getKennelName(dog);
            })()}
          </p>
          {dog ? (
            <Link 
              href={`/dogs/${dog.id}`}
              className={`${textSizeClasses[size].name} text-white uppercase font-bold tracking-wide leading-tight hover:text-[color:var(--ring-color)] hover:underline block truncate mt-[1px] font-bebas-neue`}
            >
              {dog.dog_name}
            </Link>
          ) : (
            <p className={`${textSizeClasses[size].name} text-white uppercase font-bold tracking-wide leading-tight mt-[1px] font-bebas-neue`}>
              UNKNOWN
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Breeding Simulator Pedigree Tree Component - 6 Column Mirrored Layout
interface BreedingSimulatorTreeProps {
  fatherGenerations: PedigreeGeneration[];
  motherGenerations: PedigreeGeneration[];
}

const BreedingSimulatorTree: React.FC<BreedingSimulatorTreeProps> = ({ fatherGenerations, motherGenerations }) => {
  const pedigreeRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Extract father's side - we need the father's parents, grandparents, and great-grandparents
  // fatherGenerations[0] = the father dog itself
  // fatherGenerations[1] = father's parents [father's father, father's mother]
  // fatherGenerations[2] = father's grandparents [ffFather, ffMother, fmFather, fmMother]
  // fatherGenerations[3] = father's great-grandparents [8 dogs]
  
  const fatherParents = fatherGenerations[1]?.dogs || [null, null];
  const fatherGrandparents = fatherGenerations[2]?.dogs || [null, null, null, null];
  const fatherGreatGrandparents = fatherGenerations[3]?.dogs || [null, null, null, null, null, null, null, null];
  
  // Father's parents (1st generation of father's side)
  const fatherFather = fatherParents[0]; // Father's father
  const fatherMother = fatherParents[1]; // Father's mother
  
  // Father's grandparents (2nd generation of father's side)
  const ffFather = fatherGrandparents[0]; // Father's father's father
  const ffMother = fatherGrandparents[1]; // Father's father's mother
  const fmFather = fatherGrandparents[2]; // Father's mother's father
  const fmMother = fatherGrandparents[3]; // Father's mother's mother
  
  // Father's great-grandparents (3rd generation of father's side) - 8 dogs
  const fffFather = fatherGreatGrandparents[0]; // Father's father's father's father
  const fffMother = fatherGreatGrandparents[1]; // Father's father's father's mother
  const ffmFather = fatherGreatGrandparents[2]; // Father's father's mother's father
  const ffmMother = fatherGreatGrandparents[3]; // Father's father's mother's mother
  const fmfFather = fatherGreatGrandparents[4]; // Father's mother's father's father
  const fmfMother = fatherGreatGrandparents[5]; // Father's mother's father's mother
  const fmmFather = fatherGreatGrandparents[6]; // Father's mother's mother's father
  const fmmMother = fatherGreatGrandparents[7]; // Father's mother's mother's mother

  // Extract mother's side - we need the mother's parents, grandparents, and great-grandparents
  // motherGenerations[0] = the mother dog itself
  // motherGenerations[1] = mother's parents [mother's father, mother's mother]
  // motherGenerations[2] = mother's grandparents [mfFather, mfMother, mmFather, mmMother]
  // motherGenerations[3] = mother's great-grandparents [8 dogs]
  
  const motherParents = motherGenerations[1]?.dogs || [null, null];
  const motherGrandparents = motherGenerations[2]?.dogs || [null, null, null, null];
  const motherGreatGrandparents = motherGenerations[3]?.dogs || [null, null, null, null, null, null, null, null];
  
  // Mother's parents (1st generation of mother's side)
  const motherFather = motherParents[0]; // Mother's father
  const motherMother = motherParents[1]; // Mother's mother
  
  // Mother's grandparents (2nd generation of mother's side)
  const mfFather = motherGrandparents[0]; // Mother's father's father
  const mfMother = motherGrandparents[1]; // Mother's father's mother
  const mmFather = motherGrandparents[2]; // Mother's mother's father
  const mmMother = motherGrandparents[3]; // Mother's mother's mother
  
  // Mother's great-grandparents (3rd generation of mother's side) - 8 dogs
  const mffFather = motherGreatGrandparents[0]; // Mother's father's father's father
  const mffMother = motherGreatGrandparents[1]; // Mother's father's father's mother
  const mfmFather = motherGreatGrandparents[2]; // Mother's father's mother's father
  const mfmMother = motherGreatGrandparents[3]; // Mother's father's mother's mother
  const mmfFather = motherGreatGrandparents[4]; // Mother's mother's father's father
  const mmfMother = motherGreatGrandparents[5]; // Mother's mother's father's mother
  const mmmFather = motherGreatGrandparents[6]; // Mother's mother's mother's father
  const mmmMother = motherGreatGrandparents[7]; // Mother's mother's mother's mother

  // Export pedigree to PNG
  const handleExportToPNG = useCallback(async () => {
    if (!pedigreeRef.current) {
      toast.error('Unable to export pedigree');
      return;
    }

    try {
      setIsExporting(true);
      
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
            existingInlineStyle.split(';').forEach(decl => {
              const [prop, value] = decl.split(':').map(s => s.trim());
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
          const gap = computed.gap; // Includes updated spacing: gap-[11.25px] for 1st gen
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
          const lineHeight = computed.lineHeight;
          const letterSpacing = computed.letterSpacing;
          const whiteSpace = computed.whiteSpace;
          const textOverflow = computed.textOverflow;
          const textDecoration = computed.textDecoration;
          const textDecorationLine = computed.textDecorationLine;
          const verticalAlign = computed.verticalAlign;
          const aspectRatio = computed.aspectRatio;
          const boxSizing = computed.boxSizing;
          const overflow = computed.overflow;
          const overflowX = computed.overflowX;
          const overflowY = computed.overflowY;
          const objectFit = computed.objectFit;
          const objectPosition = computed.objectPosition;
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
          if (marginTop) setStyleIfNotInline('margin-top', marginTop); // Includes updated spacing: mt-[1px] for kennel-dog name spacing
          if (marginRight) setStyleIfNotInline('margin-right', marginRight);
          if (marginBottom) setStyleIfNotInline('margin-bottom', marginBottom);
          if (marginLeft) setStyleIfNotInline('margin-left', marginLeft);
          // Reduce gap by 50% for 1st generation (large size) flex containers in export
          if (gap) {
            // Check if this is a 1st generation container (flex-direction: column with gap around 11.25px)
            const isFirstGenContainer = flexDirection === 'column';
            if (isFirstGenContainer) {
              const reduceGap = (value: string): string => {
                if (!value || value === '0' || value === '0px') return value;
                // Try to parse as pixel value
                const pxMatch = value.match(/^([\d.]+)px$/);
                if (pxMatch) {
                  const num = parseFloat(pxMatch[1]);
                  // If gap is around 11.25px (1st generation: 10.5-12px range, but not exactly 12px for 3rd gen)
                  // Target specifically 1st generation gap of 11.25px
                  if (num >= 10.5 && num < 12) {
                    return `${num * 0.5}px`;
                  }
                }
                // Try to parse as rem/em and convert (assuming 16px base)
                const remMatch = value.match(/^([\d.]+)(rem|em)$/);
                if (remMatch) {
                  const num = parseFloat(remMatch[1]);
                  const unit = remMatch[2];
                  const pxEquivalent = num * 16;
                  // If equivalent to 1st generation gap (10.5-12px, but not 12px), reduce by 50%
                  if (pxEquivalent >= 10.5 && pxEquivalent < 12) {
                    return `${num * 0.5}${unit}`;
                  }
                }
                return value;
              };
              const reducedGap = reduceGap(gap);
              if (reducedGap !== gap) {
                cloneEl.style.setProperty('gap', reducedGap);
              } else {
                setStyleIfNotInline('gap', gap);
              }
            } else {
              setStyleIfNotInline('gap', gap);
            }
          }
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
          if (fontWeight) setStyleIfNotInline('font-weight', fontWeight);
          if (textAlign) setStyleIfNotInline('text-align', textAlign);
          if (textTransform) setStyleIfNotInline('text-transform', textTransform);
          if (lineHeight) setStyleIfNotInline('line-height', lineHeight);
          if (letterSpacing) setStyleIfNotInline('letter-spacing', letterSpacing);
          if (textDecoration) setStyleIfNotInline('text-decoration', textDecoration);
          if (textDecorationLine) setStyleIfNotInline('text-decoration-line', textDecorationLine);
          if (verticalAlign) setStyleIfNotInline('vertical-align', verticalAlign);
          if (aspectRatio) setStyleIfNotInline('aspect-ratio', aspectRatio);
          if (boxSizing) setStyleIfNotInline('box-sizing', boxSizing);
          if (objectFit) setStyleIfNotInline('object-fit', objectFit);
          if (objectPosition) setStyleIfNotInline('object-position', objectPosition);
          if (visibility) setStyleIfNotInline('visibility', visibility);
          if (opacity) setStyleIfNotInline('opacity', opacity);
          
          const tagName = cloneEl.tagName.toLowerCase();
          
          // For images, ensure proper rendering
          if (tagName === 'img') {
            // Ensure images maintain aspect ratio and don't distort
            if (objectFit) {
              cloneEl.style.setProperty('object-fit', objectFit);
            }
            if (objectPosition) {
              cloneEl.style.setProperty('object-position', objectPosition);
            }
          }
          
          // For text elements, preserve exact layout and alignment
          if (tagName === 'p' || tagName === 'a' || tagName === 'span' || (tagName === 'div' && cloneEl.textContent?.trim())) {
            // Reduce top spacing by 50% for text elements in export
            const reduceTopSpacing = (value: string): string => {
              if (!value || value === '0' || value === '0px') return value;
              const match = value.match(/^([\d.]+)(px|rem|em|pt)$/);
              if (match) {
                const num = parseFloat(match[1]);
                const unit = match[2];
                return `${num * 0.5}${unit}`;
              }
              return value;
            };
            
            // Reduce margin-top by 50%
            if (marginTop && marginTop !== '0px') {
              const reducedMarginTop = reduceTopSpacing(marginTop);
              cloneEl.style.setProperty('margin-top', reducedMarginTop);
            }
            
            // Reduce padding-top by 50%
            if (paddingTop && paddingTop !== '0px') {
              const reducedPaddingTop = reduceTopSpacing(paddingTop);
              cloneEl.style.setProperty('padding-top', reducedPaddingTop);
            }
            
            // Preserve white-space to maintain exact text layout (keep nowrap if set)
            if (whiteSpace) setStyleIfNotInline('white-space', whiteSpace);
            // Preserve text-overflow to maintain exact text behavior
            if (textOverflow) setStyleIfNotInline('text-overflow', textOverflow);
            // Only make overflow visible if it's hidden, but preserve other overflow settings
            if (overflow === 'hidden') {
              cloneEl.style.setProperty('overflow', 'visible');
            } else if (overflow) {
              setStyleIfNotInline('overflow', overflow);
            }
            if (overflowX === 'hidden') {
              cloneEl.style.setProperty('overflow-x', 'visible');
            } else if (overflowX) {
              setStyleIfNotInline('overflow-x', overflowX);
            }
            if (overflowY === 'hidden') {
              cloneEl.style.setProperty('overflow-y', 'visible');
            } else if (overflowY) {
              setStyleIfNotInline('overflow-y', overflowY);
            }
          } else {
            if (overflow) setStyleIfNotInline('overflow', overflow);
            if (overflowX) setStyleIfNotInline('overflow-x', overflowX);
            if (overflowY) setStyleIfNotInline('overflow-y', overflowY);
          }
          
          // Background colors - make transparent (only images and text should be visible)
          if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            cloneEl.style.setProperty('background-color', 'transparent');
          }
          
          // Apply text color to all text elements including links
          if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'p' || tagName === 'span' || tagName === 'div' || tagName === 'a') {
            // Ensure text is visible
            cloneEl.style.setProperty('visibility', 'visible');
            cloneEl.style.setProperty('opacity', '1');
            if (computed.color && computed.color !== 'rgba(0, 0, 0, 0)') {
              cloneEl.style.setProperty('color', 'rgb(255, 255, 255)');
            }
          }
          
          // Preserve border color exactly as rendered
          const borderColor = computed.borderColor;
          if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)' && borderStyle && borderStyle !== 'none') {
            // Convert rgba to rgb for consistency, but preserve the actual color
            if (borderColor.includes('rgb')) {
              cloneEl.style.setProperty('border-color', borderColor);
            } else {
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
      
      const isolatedClone = createIsolatedClone(pedigreeRef.current);
      
      // Remove generation labels from export
      // The generation labels are always the first direct child div of the pedigree container
      // Check the first child - if it contains generation label text, remove it
      const firstChild = isolatedClone.firstElementChild;
      if (firstChild) {
        const firstChildText = firstChild.textContent || '';
        // Check for all generation label texts
        if ((firstChildText.includes('Father 3rd gen') || firstChildText.includes('FATHER 3RD GEN')) && 
            (firstChildText.includes('Father 2nd gen') || firstChildText.includes('FATHER 2ND GEN')) && 
            (firstChildText.includes('Mother 2nd gen') || firstChildText.includes('MOTHER 2ND GEN')) &&
            (firstChildText.includes('Mother 3rd gen') || firstChildText.includes('MOTHER 3RD GEN'))) {
          firstChild.remove();
        }
      }
      
      // Apply computed styles to the root clone to ensure exact layout match
      const rootComputed = window.getComputedStyle(pedigreeRef.current);
      isolatedClone.style.width = rootComputed.width;
      isolatedClone.style.height = rootComputed.height;
      isolatedClone.style.maxWidth = rootComputed.maxWidth;
      isolatedClone.style.padding = rootComputed.padding;
      isolatedClone.style.margin = rootComputed.margin;
      isolatedClone.style.backgroundColor = 'transparent';
      
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = pedigreeRef.current.offsetWidth + 'px';
      tempContainer.style.height = pedigreeRef.current.offsetHeight + 'px';
      tempContainer.style.backgroundColor = 'transparent';
      tempContainer.appendChild(isolatedClone);
      document.body.appendChild(tempContainer);
      
      try {
        const canvas = await html2canvas(isolatedClone, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: false,
          ignoreElements: () => false,
        });

        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Failed to generate image');
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `breeding-simulator-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success('Pedigree exported successfully!');
        }, 'image/png');
      } finally {
        document.body.removeChild(tempContainer);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export pedigree');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="card w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-white">Breeding Simulator - 6 Generation Pedigree</h2>
        <button
          onClick={handleExportToPNG}
          disabled={isExporting}
          className="btn-secondary inline-flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>{isExporting ? 'Exporting...' : 'Export to PNG'}</span>
        </button>
      </div>
      
      <div ref={pedigreeRef} data-pedigree-export className="theme-legacy">
        {/* 6 Column Mirrored Layout - Matching exact layout from original pedigree */}
        {/* Gap reduced by 70%: from 0.2rem to 0.06rem (~1px) */}
        <div className="pedigree-grid grid grid-cols-6 gap-x-[0.06rem] w-full items-start mx-auto" style={{ maxWidth: '1600px' }}>
          {/* Column 1: Father's 3rd Generation (Great-grandparents) - 8 tiles: top 50% */}
          <div className="flex flex-col" style={{ height: '100%' }}>
            {/* Father's Father's Father's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={fffFather} size="small" side="father" />
              </div>
            </div>
            
            {/* Father's Father's Father's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={fffMother} size="small" side="father" />
              </div>
            </div>
            
            {/* Father's Father's Mother's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={ffmFather} size="small" side="father" />
              </div>
            </div>
            
            {/* Father's Father's Mother's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={ffmMother} size="small" side="father" />
              </div>
            </div>
            
            {/* Father's Mother's Father's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={fmfFather} size="small" side="father" />
              </div>
            </div>
            
            {/* Father's Mother's Father's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={fmfMother} size="small" side="father" />
              </div>
            </div>
            
            {/* Father's Mother's Mother's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={fmmFather} size="small" side="father" />
              </div>
            </div>
            
            {/* Father's Mother's Mother's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={fmmMother} size="small" side="father" />
              </div>
            </div>
            
            {/* Empty space for mother's side alignment - 50% */}
            <div className="relative" style={{ height: '50%' }}></div>
          </div>

          {/* Column 2: Father's 2nd Generation (Grandparents) - 4 tiles: top 50%, aligned with 1st gen */}
          <div className="generation-col flex flex-col relative" style={{ height: '100%' }}>
            {/* Top 50% - aligned with Column 3 (Father's 1st gen) */}
            <div className="relative" style={{ height: '50%' }}>
              <div className="h-full flex flex-col">
                {/* Father's Father's Father - 25% of this 50% section, aligned with top 1st gen tile */}
                <div className="relative" style={{ height: '50%' }}>
                  <div className="h-full w-full flex items-center justify-center">
                    <PedigreeNode dog={ffFather} size="medium" />
                  </div>
                </div>
                
                {/* Father's Father's Mother - 25% of this 50% section */}
                <div className="relative" style={{ height: '50%' }}>
                  <div className="h-full w-full flex items-center justify-center">
                    <PedigreeNode dog={ffMother} size="medium" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom 50% - aligned with Column 3 (Father's 1st gen) */}
            <div className="relative" style={{ height: '50%' }}>
              <div className="h-full flex flex-col">
                {/* Father's Mother's Father - 25% of this 50% section, aligned with bottom 1st gen tile */}
                <div className="relative" style={{ height: '50%' }}>
                  <div className="h-full w-full flex items-center justify-center">
                    <PedigreeNode dog={fmFather} size="medium" />
                  </div>
                </div>
                
                {/* Father's Mother's Mother - 25% of this 50% section */}
                <div className="relative" style={{ height: '50%' }}>
                  <div className="h-full w-full flex items-center justify-center">
                    <PedigreeNode dog={fmMother} size="medium" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Father's 1st Generation (Parents) - 2 tiles: reference for alignment */}
          <div className="generation-col parent-pair flex flex-col relative" style={{ height: '100%', marginRight: '0.5rem' }}>
            {/* Father's Father - 50% height */}
            <div className="relative pedigree-tile" style={{ height: '50%' }}>
              <div className="h-full w-full flex items-center justify-center">
                <PedigreeNode dog={fatherFather} size="large" />
              </div>
            </div>
            
            {/* Father's Mother - 50% height */}
            <div className="relative pedigree-tile" style={{ height: '50%' }}>
              <div className="h-full w-full flex items-center justify-center">
                <PedigreeNode dog={fatherMother} size="large" />
              </div>
            </div>
          </div>

          {/* Column 4: Mother's 1st Generation (Parents) - 2 tiles: reference for alignment */}
          <div className="generation-col parent-pair flex flex-col relative" style={{ height: '100%', marginLeft: '0.5rem' }}>
            {/* Mother's Father - 50% height */}
            <div className="relative pedigree-tile" style={{ height: '50%' }}>
              <div className="h-full w-full flex items-center justify-center">
                <PedigreeNode dog={motherFather} size="large" />
              </div>
            </div>
            
            {/* Mother's Mother - 50% height */}
            <div className="relative pedigree-tile" style={{ height: '50%' }}>
              <div className="h-full w-full flex items-center justify-center">
                <PedigreeNode dog={motherMother} size="large" />
              </div>
            </div>
          </div>

          {/* Column 5: Mother's 2nd Generation (Grandparents) - 4 tiles: EXACT same structure as Father's 2nd gen */}
          <div className="generation-col flex flex-col relative" style={{ height: '100%' }}>
            {/* Top 50% - aligned with Column 4 (Mother's 1st gen) */}
            <div className="relative" style={{ height: '50%' }}>
              <div className="h-full flex flex-col">
                {/* Mother's Father's Father - 50% of this 50% section, aligned with top 1st gen tile */}
                <div className="relative" style={{ height: '50%' }}>
                  <div className="h-full w-full flex items-center justify-center">
                    <PedigreeNode dog={mfFather} size="medium" />
                  </div>
                </div>
                
                {/* Mother's Father's Mother - 50% of this 50% section */}
                <div className="relative" style={{ height: '50%' }}>
                  <div className="h-full w-full flex items-center justify-center">
                    <PedigreeNode dog={mfMother} size="medium" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom 50% - aligned with Column 4 (Mother's 1st gen) */}
            <div className="relative" style={{ height: '50%' }}>
              <div className="h-full flex flex-col">
                {/* Mother's Mother's Father - 50% of this 50% section, aligned with bottom 1st gen tile */}
                <div className="relative" style={{ height: '50%' }}>
                  <div className="h-full w-full flex items-center justify-center">
                    <PedigreeNode dog={mmFather} size="medium" />
                  </div>
                </div>
                
                {/* Mother's Mother's Mother - 50% of this 50% section */}
                <div className="relative" style={{ height: '50%' }}>
                  <div className="h-full w-full flex items-center justify-center">
                    <PedigreeNode dog={mmMother} size="medium" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 6: Mother's 3rd Generation (Great-grandparents) - 8 tiles: bottom 50% */}
          <div className="flex flex-col" style={{ height: '100%' }}>
            {/* Empty space for father's side alignment - 50% */}
            <div className="relative" style={{ height: '50%' }}></div>
            
            {/* Mother's Father's Father's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mffFather} size="small" side="mother" />
              </div>
            </div>
            
            {/* Mother's Father's Father's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mffMother} size="small" side="mother" />
              </div>
            </div>
            
            {/* Mother's Father's Mother's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mfmFather} size="small" side="mother" />
              </div>
            </div>
            
            {/* Mother's Father's Mother's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mfmMother} size="small" side="mother" />
              </div>
            </div>
            
            {/* Mother's Mother's Father's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mmfFather} size="small" side="mother" />
              </div>
            </div>
            
            {/* Mother's Mother's Father's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mmfMother} size="small" side="mother" />
              </div>
            </div>
            
            {/* Mother's Mother's Mother's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mmmFather} size="small" side="mother" />
              </div>
            </div>
            
            {/* Mother's Mother's Mother's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mmmMother} size="small" side="mother" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Searchable Dropdown Component
interface SearchableDropdownProps {
  options: Dog[];
  value: Dog | null;
  onChange: (dog: Dog | null) => void;
  placeholder: string;
  label: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(dog => {
    const kennelName = getKennelName(dog);
    return dog.dog_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kennelName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (dog: Dog) => {
    onChange(dog);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-300 mb-3">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input w-full text-left flex items-center justify-between pr-8"
        >
          <span className={value ? 'text-white' : 'text-gray-400'}>
            {value ? `${value.dog_name} (${getKennelName(value)})` : placeholder}
          </span>
          <div className="flex items-center space-x-2">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-white" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-700">
              <input
                type="text"
                placeholder="Search by name or kennel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring-color)]"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-gray-400 text-sm">No dogs found</div>
              ) : (
                filteredOptions.map((dog) => (
                  <button
                    key={dog.id}
                    type="button"
                    onClick={() => handleSelect(dog)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                      value?.id === dog.id ? 'bg-gray-600 hover:bg-gray-700' : ''
                    }`}
                  >
                    <div className="text-white font-medium">{dog.dog_name}</div>
                    <div className="text-sm text-gray-400">{getKennelName(dog)}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Breeding Simulator Component
const BreedingSimulator: React.FC = () => {
  const router = useRouter();
  const [father, setFather] = useState<Dog | null>(null);
  const [mother, setMother] = useState<Dog | null>(null);
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);
  const [fatherGenerations, setFatherGenerations] = useState<PedigreeGeneration[]>([]);
  const [motherGenerations, setMotherGenerations] = useState<PedigreeGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedigreeLoading, setPedigreeLoading] = useState(false);

  // Load available dogs
  const loadAvailableDogs = useCallback(async () => {
    try {
      const response = await dogsApi.getAll();
      if (response.success && response.data) {
        setAvailableDogs(response.data);
      }
    } catch (error) {
      console.error('Error loading dogs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load pedigree generations for selected dogs
  const loadPedigrees = useCallback(async () => {
    if (!father || !mother) {
      setFatherGenerations([]);
      setMotherGenerations([]);
      return;
    }

    try {
      setPedigreeLoading(true);
      const [fatherGen, motherGen] = await Promise.all([
        buildPedigreeGenerations(father),
        buildPedigreeGenerations(mother)
      ]);
      setFatherGenerations(fatherGen);
      setMotherGenerations(motherGen);
    } catch (error) {
      console.error('Error loading pedigrees:', error);
      toast.error('Error loading pedigree data');
    } finally {
      setPedigreeLoading(false);
    }
  }, [father, mother]);

  useEffect(() => {
    loadAvailableDogs();
  }, [loadAvailableDogs]);

  useEffect(() => {
    loadPedigrees();
  }, [loadPedigrees]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="btn-ghost p-2"
          >
            <ArrowLeft className={ICON_SIZE} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">Breeding Simulator</h1>
          </div>
        </div>
      </div>

      {/* Dog Selection */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6">Select Dogs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Father Selection */}
          <SearchableDropdown
            options={availableDogs.filter(d => d.gender === 'male')}
            value={father}
            onChange={setFather}
            placeholder="Select a father..."
            label="Father (Male)"
          />

          {/* Mother Selection */}
          <SearchableDropdown
            options={availableDogs.filter(d => d.gender === 'female')}
            value={mother}
            onChange={setMother}
            placeholder="Select a mother..."
            label="Mother (Female)"
          />
        </div>
      </div>

      {/* Breeding Simulator Pedigree Tree */}
      {loading || pedigreeLoading ? (
        <div className="card">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-gray-400">Loading...</span>
          </div>
        </div>
      ) : father && mother ? (
        <BreedingSimulatorTree 
          fatherGenerations={fatherGenerations} 
          motherGenerations={motherGenerations} 
        />
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Please select both a father and mother to view the breeding simulator pedigree</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreedingSimulator;

