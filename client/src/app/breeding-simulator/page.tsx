'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Download } from 'lucide-react';
import { Dog } from '@/types';
import { dogsApi } from '@/services/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

// Constants
const ICON_SIZE = 'h-5 w-5';

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

// Pedigree Node Component
interface PedigreeNodeProps {
  dog: Dog | null;
  size?: 'large' | 'medium' | 'small';
}

const PedigreeNode: React.FC<PedigreeNodeProps> = ({ dog, size = 'medium' }) => {
  const sizeClasses = {
    large: 'w-full h-full',
    medium: 'w-full h-full',
    small: 'w-full h-full'
  };

  const imageSizeClasses = {
    large: 'w-2/3 aspect-square',
    medium: 'w-[35%] aspect-square',
    small: 'w-1/4 aspect-square'
  };

  const textSizeClasses = {
    large: {
      kennel: 'text-sm',
      name: 'text-lg'
    },
    medium: {
      kennel: 'text-xs',
      name: 'text-sm'
    },
    small: {
      kennel: 'text-[9px]',
      name: 'text-[10px]'
    }
  };

  const isUnknown = !dog;
  const imageBorderColor = isUnknown ? 'border-gray-600' : 'border-blue-500';
  const isVerticalLayout = size === 'large' || size === 'medium';
  
  return (
    <div className={`${sizeClasses[size]} flex ${isVerticalLayout ? 'flex-col items-center justify-center' : 'items-center'} gap-3`}>
      <div className={`${imageSizeClasses[size]} rounded overflow-hidden flex-shrink-0 ${imageBorderColor} border-2`}>
        {dog?.image_url ? (
          <img
            src={dog.image_url}
            alt={dog.dog_name || 'Unknown'}
            className="w-full h-full object-cover aspect-square"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center aspect-square">
            <User className="w-1/2 h-1/2 text-gray-500" />
          </div>
        )}
      </div>
      
      <div className={`${isVerticalLayout ? 'w-full' : 'flex-1'} min-w-0 flex flex-col ${isVerticalLayout ? 'items-center text-center' : 'justify-center'}`}>
        <p className={`${textSizeClasses[size].kennel} text-white text-opacity-70 uppercase font-medium tracking-wider leading-tight`}>
          {isUnknown ? 'UNKNOWN' : (dog.primary_kennel || '')}
        </p>
        {dog ? (
          <Link 
            href={`/dogs/${dog.id}`}
            className={`${textSizeClasses[size].name} text-white uppercase font-bold tracking-wide leading-tight hover:text-blue-400 transition-colors block truncate mt-1`}
          >
            {dog.dog_name}
          </Link>
        ) : (
          <p className={`${textSizeClasses[size].name} text-gray-600 uppercase font-bold tracking-wide leading-tight mt-1`}>
            UNKNOWN
          </p>
        )}
      </div>
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

  // Extract father's side
  const fatherParents = fatherGenerations[1]?.dogs || [null, null];
  const fatherGrandparents = fatherGenerations[2]?.dogs || [null, null, null, null];
  const fatherGreatGrandparents = fatherGenerations[3]?.dogs || [null, null, null, null, null, null, null, null];
  
  const father = fatherParents[0];
  const fatherFather = fatherGrandparents[0];
  const fatherMother = fatherGrandparents[1];
  const ffFather = fatherGreatGrandparents[0];
  const ffMother = fatherGreatGrandparents[1];
  const fmFather = fatherGreatGrandparents[2];
  const fmMother = fatherGreatGrandparents[3];

  // Extract mother's side
  const motherParents = motherGenerations[1]?.dogs || [null, null];
  const motherGrandparents = motherGenerations[2]?.dogs || [null, null, null, null];
  const motherGreatGrandparents = motherGenerations[3]?.dogs || [null, null, null, null, null, null, null, null];
  
  const mother = motherParents[1];
  const motherFather = motherGrandparents[2];
  const motherMother = motherGrandparents[3];
  const mfFather = motherGreatGrandparents[4];
  const mfMother = motherGreatGrandparents[5];
  const mmFather = motherGreatGrandparents[6];
  const mmMother = motherGreatGrandparents[7];

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
          const fontWeight = computed.fontWeight;
          const textAlign = computed.textAlign;
          const textTransform = computed.textTransform;
          const aspectRatio = computed.aspectRatio;
          const boxSizing = computed.boxSizing;
          const overflow = computed.overflow;
          const overflowX = computed.overflowX;
          const overflowY = computed.overflowY;
          
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
          if (fontWeight) setStyleIfNotInline('font-weight', fontWeight);
          if (textAlign) setStyleIfNotInline('text-align', textAlign);
          if (textTransform) setStyleIfNotInline('text-transform', textTransform);
          if (aspectRatio) setStyleIfNotInline('aspect-ratio', aspectRatio);
          if (boxSizing) setStyleIfNotInline('box-sizing', boxSizing);
          if (overflow) setStyleIfNotInline('overflow', overflow);
          if (overflowX) setStyleIfNotInline('overflow-x', overflowX);
          if (overflowY) setStyleIfNotInline('overflow-y', overflowY);
          
          const tagName = cloneEl.tagName.toLowerCase();
          
          if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            cloneEl.style.setProperty('background-color', 'rgb(23, 23, 23)');
          }
          
          if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'p' || tagName === 'span' || tagName === 'div') {
            if (computed.color && computed.color !== 'rgba(0, 0, 0, 0)') {
              cloneEl.style.setProperty('color', 'rgb(255, 255, 255)');
            }
          }
          
          if (computed.borderColor && computed.borderColor !== 'rgba(0, 0, 0, 0)') {
            const borderStyle = computed.borderStyle;
            if (borderStyle && borderStyle !== 'none') {
              if (cloneEl.querySelector('img') || cloneEl.textContent?.trim()) {
                cloneEl.style.setProperty('border-color', 'rgb(59, 130, 246)');
              } else {
                cloneEl.style.setProperty('border-color', 'rgb(255, 255, 255)');
              }
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
      
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = pedigreeRef.current.offsetWidth + 'px';
      tempContainer.style.height = pedigreeRef.current.offsetHeight + 'px';
      tempContainer.style.backgroundColor = 'rgb(10, 10, 10)';
      tempContainer.appendChild(isolatedClone);
      document.body.appendChild(tempContainer);
      
      try {
        const canvas = await html2canvas(isolatedClone, {
          backgroundColor: '#0a0a0a',
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
    <div className="bg-arbor rounded-lg p-8 w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-white">Breeding Simulator - 6 Generation Pedigree</h2>
        <button
          onClick={handleExportToPNG}
          disabled={isExporting}
          className="btn-spotify-secondary inline-flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>{isExporting ? 'Exporting...' : 'Export to PNG'}</span>
        </button>
      </div>
      
      <div ref={pedigreeRef} data-pedigree-export>
        {/* Generation Labels - 6 columns */}
        <div className="grid grid-cols-6 gap-x-[0.2rem] mb-8">
          <div className="text-center">
            <p className="text-sm text-white uppercase font-bold tracking-wider">Father 3rd gen</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white uppercase font-bold tracking-wider">Father 2nd gen</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white uppercase font-bold tracking-wider">Father</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white uppercase font-bold tracking-wider">Mother</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white uppercase font-bold tracking-wider">Mother 2nd gen</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white uppercase font-bold tracking-wider">Mother 3rd gen</p>
          </div>
        </div>

        {/* 6 Column Mirrored Layout - Matching exact layout from original pedigree */}
        <div className="grid grid-cols-6 gap-x-[0.2rem] w-full items-stretch mx-auto" style={{ maxWidth: '1600px' }}>
          {/* Column 1: Father's 3rd Generation (Great-grandparents) - 8 tiles: top 50% */}
          <div className="flex flex-col" style={{ height: '100%' }}>
            {/* Father's Father's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={ffFather} size="small" />
              </div>
            </div>
            
            {/* Father's Father's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={ffMother} size="small" />
              </div>
            </div>
            
            {/* Father's Mother's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={fmFather} size="small" />
              </div>
            </div>
            
            {/* Father's Mother's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={fmMother} size="small" />
              </div>
            </div>
            
            {/* Empty space for mother's side alignment - 50% */}
            <div className="relative" style={{ height: '50%' }}></div>
          </div>

          {/* Column 2: Father's 2nd Generation (Grandparents) - 4 tiles: top 50% */}
          <div className="flex flex-col relative" style={{ height: '100%' }}>
            {/* Father's Father - 25% of total height */}
            <div className="relative" style={{ height: '25%' }}>
              <div className="h-full flex items-center justify-center">
                <PedigreeNode dog={fatherFather} size="medium" />
              </div>
            </div>
            
            {/* Father's Mother - 25% of total height */}
            <div className="relative" style={{ height: '25%' }}>
              <div className="h-full flex items-center justify-center">
                <PedigreeNode dog={fatherMother} size="medium" />
              </div>
            </div>
            
            {/* Empty space for mother's side alignment - 50% */}
            <div className="relative" style={{ height: '50%' }}></div>
          </div>

          {/* Column 3: Father (1st Generation) - 1 tile: top 50%, square aspect */}
          <div className="flex flex-col aspect-square w-full">
            <div className="relative h-full w-full flex items-center justify-center">
              <PedigreeNode dog={father} size="large" />
            </div>
          </div>

          {/* Column 4: Mother (1st Generation) - 1 tile: bottom 50%, square aspect */}
          <div className="flex flex-col aspect-square w-full">
            <div className="relative h-full w-full flex items-center justify-center">
              <PedigreeNode dog={mother} size="large" />
            </div>
          </div>

          {/* Column 5: Mother's 2nd Generation (Grandparents) - 4 tiles: bottom 50% */}
          <div className="flex flex-col relative" style={{ height: '100%' }}>
            {/* Empty space for father's side alignment - 50% */}
            <div className="relative" style={{ height: '50%' }}></div>
            
            {/* Mother's Father - 25% of total height */}
            <div className="relative" style={{ height: '25%' }}>
              <div className="h-full flex items-center justify-center">
                <PedigreeNode dog={motherFather} size="medium" />
              </div>
            </div>
            
            {/* Mother's Mother - 25% of total height */}
            <div className="relative" style={{ height: '25%' }}>
              <div className="h-full flex items-center justify-center">
                <PedigreeNode dog={motherMother} size="medium" />
              </div>
            </div>
          </div>

          {/* Column 6: Mother's 3rd Generation (Great-grandparents) - 8 tiles: bottom 50% */}
          <div className="flex flex-col" style={{ height: '100%' }}>
            {/* Empty space for father's side alignment - 50% */}
            <div className="relative" style={{ height: '50%' }}></div>
            
            {/* Mother's Father's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mfFather} size="small" />
              </div>
            </div>
            
            {/* Mother's Father's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mfMother} size="small" />
              </div>
            </div>
            
            {/* Mother's Mother's Father - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mmFather} size="small" />
              </div>
            </div>
            
            {/* Mother's Mother's Mother - 12.5% of total height */}
            <div className="relative" style={{ height: '12.5%' }}>
              <div className="h-full flex items-center justify-center py-1">
                <PedigreeNode dog={mmMother} size="small" />
              </div>
            </div>
          </div>
        </div>
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="btn-spotify-ghost p-2"
          >
            <ArrowLeft className={ICON_SIZE} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">Breeding Simulator</h1>
            <p className="text-gray-400 mt-2 text-lg">Combine pedigrees of two dogs</p>
          </div>
        </div>
      </div>

      {/* Dog Selection */}
      <div className="card-spotify">
        <h2 className="text-xl font-semibold text-white mb-6">Select Dogs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Father Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Father (Male)
            </label>
            <select
              value={father?.id || ''}
              onChange={(e) => {
                const selected = availableDogs.find(d => d.id === e.target.value);
                setFather(selected || null);
              }}
              className="input-spotify w-full"
            >
              <option value="">Select a father...</option>
              {availableDogs
                .filter(d => d.gender === 'male')
                .map(d => (
                  <option key={d.id} value={d.id}>
                    {d.dog_name} ({d.primary_kennel})
                  </option>
                ))}
            </select>
          </div>

          {/* Mother Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Mother (Female)
            </label>
            <select
              value={mother?.id || ''}
              onChange={(e) => {
                const selected = availableDogs.find(d => d.id === e.target.value);
                setMother(selected || null);
              }}
              className="input-spotify w-full"
            >
              <option value="">Select a mother...</option>
              {availableDogs
                .filter(d => d.gender === 'female')
                .map(d => (
                  <option key={d.id} value={d.id}>
                    {d.dog_name} ({d.primary_kennel})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Breeding Simulator Pedigree Tree */}
      {loading || pedigreeLoading ? (
        <div className="card-spotify">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-3 text-gray-400">Loading...</span>
          </div>
        </div>
      ) : father && mother ? (
        <BreedingSimulatorTree 
          fatherGenerations={fatherGenerations} 
          motherGenerations={motherGenerations} 
        />
      ) : (
        <div className="card-spotify">
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Please select both a father and mother to view the breeding simulator pedigree</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreedingSimulator;

