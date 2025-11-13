'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Edit, Users, TreePine, User, Download } from 'lucide-react';
import { Dog, DogFormData } from '@/types';
import { dogsApi } from '@/services/api';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

// Constants
const ICON_SIZE = 'h-5 w-5';
const SMALL_ICON_SIZE = 'h-4 w-4';
const PHOTO_SIZE = 'h-32 w-32';
const USER_ICON_SIZE = 'h-16 w-16';

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

// Helper function to build pedigree generations recursively
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

// Basic Info Card Component
interface BasicInfoCardProps {
  dog: Dog;
}

const BasicInfoCard: React.FC<BasicInfoCardProps> = ({ dog }) => (
  <div className="card-spotify">
    <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
    
    <div className="flex items-start space-x-6">
      {/* Profile Image */}
      <div className="flex-shrink-0">
        {dog.image_url ? (
          <img
            src={dog.image_url}
            alt={dog.dog_name}
            className={`${PHOTO_SIZE} rounded-xl object-cover`}
          />
        ) : (
          <div className={`${PHOTO_SIZE} bg-gray-800 rounded-xl flex items-center justify-center`}>
            <User className={`${USER_ICON_SIZE} text-gray-500`} />
          </div>
        )}
      </div>
      
      {/* Dog Information */}
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-gray-400">Dog Name</label>
            <p className="text-lg text-white font-medium">{dog.dog_name}</p>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-gray-400">Gender</label>
            <p className="text-lg text-white">
              {dog.gender === 'male' ? 'Male' : 'Female'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-gray-400">Primary Kennel</label>
            <p className="text-lg text-white">{dog.primary_kennel}</p>
          </div>
          
          {dog.secondary_kennel && (
            <div>
              <label className="text-sm font-semibold text-gray-400">Secondary Kennel</label>
              <p className="text-lg text-white">{dog.secondary_kennel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Pedigree Node Component - Matches SVG design
interface PedigreeNodeProps {
  dog: Dog | null;
  size?: 'large' | 'medium' | 'small';
}

const PedigreeNode: React.FC<PedigreeNodeProps> = ({ dog, size = 'medium' }) => {
  // Size classes - proportional to container size
  // 1st gen: 100%, 2nd gen: 50%, 3rd gen: 25%
  const sizeClasses = {
    large: 'w-full h-full',      // 1st generation - fills 100% of container
    medium: 'w-full h-full',     // 2nd generation - fills 50% container (which is 50% of 1st gen)
    small: 'w-full h-full'       // 3rd generation - fills 25% container (which is 25% of 1st gen)
  };

  // Image sizes - always square, scale proportionally
  // Use aspect-square to ensure square images
  const imageSizeClasses = {
    large: 'w-2/3 aspect-square',        // Square image, 2/3 width of tile (bigger for 1st generation)
    medium: 'w-1/2 aspect-square',      // Square image, 1/2 width of tile (for vertical layout in 2nd gen)
    small: 'w-1/4 aspect-square'         // Smaller square image for 3rd gen, 1/4 width of tile
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

  // For large and medium sizes (1st and 2nd generation), use vertical layout (image on top, text below)
  // For small (3rd generation), use horizontal layout (image left, text right)
  const isVerticalLayout = size === 'large' || size === 'medium';
  
  return (
    <div className={`${sizeClasses[size]} flex ${isVerticalLayout ? 'flex-col items-center justify-center' : 'items-center'} gap-3`}>
      {/* Square Image with Border */}
      <div className={`${imageSizeClasses[size]} rounded overflow-hidden ${isVerticalLayout ? 'flex-shrink-0' : 'flex-shrink-0'} ${imageBorderColor} border-2`}>
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
      
      {/* Dog Info - Vertical Layout for text content */}
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

// Main Dog Display Component (Top Center)
interface MainDogDisplayProps {
  dog: Dog;
}

const MainDogDisplay: React.FC<MainDogDisplayProps> = ({ dog }) => {
  return (
    <div className="flex flex-col items-center mb-8">
      {/* Main Dog Name - Large */}
      <h2 className="text-6xl font-bold text-white uppercase mb-2 tracking-wide">
        {dog.dog_name}
      </h2>
      {/* Kennel Name */}
      <p className="text-xl text-white text-opacity-70 uppercase font-medium tracking-wider">
        {dog.primary_kennel}
      </p>
    </div>
  );
};

// Pedigree Connector Component - White horizontal lines
interface PedigreeConnectorProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  horizontal?: boolean;
}

const PedigreeConnector: React.FC<PedigreeConnectorProps> = ({ from, to, horizontal = true }) => {
  if (horizontal) {
    const width = to.x - from.x;
    return (
      <div 
        className="absolute bg-white h-[2px]"
        style={{
          left: `${from.x}px`,
          top: `${from.y}px`,
          width: `${width}px`
        }}
      />
    );
  }
  // Vertical connector
  const height = to.y - from.y;
  return (
    <div 
      className="absolute bg-white w-[2px]"
      style={{
        left: `${from.x}px`,
        top: `${from.y}px`,
        height: `${height}px`
      }}
    />
  );
};

// Pedigree Tree Component - Father's Lineage Only (Top Half)
interface PedigreeTreeProps {
  generations: PedigreeGeneration[];
}

const PedigreeTree: React.FC<PedigreeTreeProps> = ({ generations }) => {
  const pedigreeRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Extract dogs from each generation - both father's and mother's side
  const parents = generations[1]?.dogs || [null, null];
  const grandparents = generations[2]?.dogs || [null, null, null, null];
  const greatGrandparents = generations[3]?.dogs || [null, null, null, null, null, null, null, null];

  // 1st Generation: Parents
  const father = parents[0]; // Father
  const mother = parents[1]; // Mother
  
  // 2nd Generation: Parents' parents
  const fatherFather = grandparents[0]; // Father's Father
  const fatherMother = grandparents[1]; // Father's Mother
  const motherFather = grandparents[2]; // Mother's Father
  const motherMother = grandparents[3]; // Mother's Mother
  
  // 3rd Generation: 8 great-grandparents (4 from father's side, 4 from mother's side)
  const ffFather = greatGrandparents[0]; // Father's Father's Father
  const ffMother = greatGrandparents[1]; // Father's Father's Mother
  const fmFather = greatGrandparents[2]; // Father's Mother's Father
  const fmMother = greatGrandparents[3]; // Father's Mother's Mother
  const mfFather = greatGrandparents[4]; // Mother's Father's Father
  const mfMother = greatGrandparents[5]; // Mother's Father's Mother
  const mmFather = greatGrandparents[6]; // Mother's Mother's Father
  const mmMother = greatGrandparents[7]; // Mother's Mother's Mother

  // Export pedigree to PNG
  const handleExportToPNG = useCallback(async () => {
    if (!pedigreeRef.current) {
      toast.error('Unable to export pedigree');
      return;
    }

    try {
      setIsExporting(true);
      
      // Create a completely isolated clone with only RGB colors
      const createIsolatedClone = (original: HTMLElement): HTMLElement => {
        const clone = original.cloneNode(true) as HTMLElement;
        
        // Remove all classes to prevent stylesheet parsing
        const removeClasses = (el: Element) => {
          el.removeAttribute('class');
          Array.from(el.children).forEach(removeClasses);
        };
        removeClasses(clone);
        
        // Helper to find corresponding original element
        const findOriginalElement = (cloneEl: Element, originalRoot: HTMLElement): HTMLElement | null => {
          // Build a path to find the element
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
          
          // Navigate to the same element in original
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
        
        // Apply simple RGB styles to all elements
        const applyRGBStyles = (cloneEl: HTMLElement, originalRoot: HTMLElement) => {
          const originalEl = findOriginalElement(cloneEl, originalRoot);
          if (!originalEl) return;
          
          // Start with inline styles from original (these contain important layout info like height: '100%')
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
          
          // Get all layout properties
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
          
          // Helper to set style only if not already in inline styles (preserve inline styles)
          const setStyleIfNotInline = (prop: string, value: string) => {
            const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (!inlineStyleMap.has(prop) && !inlineStyleMap.has(camelProp)) {
              cloneEl.style.setProperty(prop, value);
            }
          };
          
          // Apply all layout styles (but preserve inline styles)
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
          
          // Force simple RGB colors - don't care about exact colors
          const tagName = cloneEl.tagName.toLowerCase();
          
          // Background colors - use dark gray/black
          if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            cloneEl.style.setProperty('background-color', 'rgb(23, 23, 23)');
          }
          
          // Text colors - use white
          if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'p' || tagName === 'span' || tagName === 'div') {
            if (computed.color && computed.color !== 'rgba(0, 0, 0, 0)') {
              cloneEl.style.setProperty('color', 'rgb(255, 255, 255)');
            }
          }
          
          // Border colors - use blue or white
          if (computed.borderColor && computed.borderColor !== 'rgba(0, 0, 0, 0)') {
            // Check if it's a blue border (from border-blue-500) or white
            const borderStyle = computed.borderStyle;
            if (borderStyle && borderStyle !== 'none') {
              // Use blue for pedigree tiles, white for connection lines
              if (cloneEl.querySelector('img') || cloneEl.textContent?.trim()) {
                cloneEl.style.setProperty('border-color', 'rgb(59, 130, 246)');
              } else {
                cloneEl.style.setProperty('border-color', 'rgb(255, 255, 255)');
              }
            }
          }
          
          // Recursively apply to children
          Array.from(cloneEl.children).forEach((child) => {
            applyRGBStyles(child as HTMLElement, originalRoot);
          });
        };
        
        applyRGBStyles(clone, original);
        return clone;
      };
      
      // Create isolated clone
      const isolatedClone = createIsolatedClone(pedigreeRef.current);
      
      // Create temporary container with no stylesheets
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

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Failed to generate image');
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `pedigree-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success('Pedigree exported successfully!');
        }, 'image/png');
      } finally {
        // Clean up temporary container
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
        <h2 className="text-xl font-semibold text-white">3-Generation Pedigree</h2>
        <button
          onClick={handleExportToPNG}
          disabled={isExporting}
          className="btn-spotify-secondary inline-flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>{isExporting ? 'Exporting...' : 'Export to PNG'}</span>
        </button>
      </div>
      
      {/* Pedigree Tree Content - This is what gets exported */}
      <div ref={pedigreeRef} data-pedigree-export>
        {/* Generation Labels */}
        <div className="grid grid-cols-3 gap-x-8 mb-8">
          <div className="text-center">
            <p className="text-sm text-white uppercase font-bold tracking-wider">1st generation</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white uppercase font-bold tracking-wider">2nd generation</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white uppercase font-bold tracking-wider">3rd generation</p>
          </div>
        </div>

        {/* Pedigree Tree Layout - 3 Column Grid with Height Proportions */}
        <div className="grid grid-cols-3 gap-x-8 w-full items-start">
        {/* Column 1: Parents (1st Generation) - 2 tiles: Father (top 50%) and Mother (bottom 50%) */}
        <div className="flex flex-col relative" style={{ height: '100%' }}>
          {/* Father - 50% height */}
          <div className="relative" style={{ height: '50%' }}>
            <div className="h-full w-full flex items-center justify-center">
              <PedigreeNode dog={father} size="large" />
            </div>
          </div>
          
          {/* Mother - 50% height */}
          <div className="relative" style={{ height: '50%' }}>
            <div className="h-full w-full flex items-center justify-center">
              <PedigreeNode dog={mother} size="large" />
            </div>
          </div>
          
        </div>

        {/* Column 2: Grandparents (2nd Generation) - 4 tiles: Father's parents (top 50%) and Mother's parents (bottom 50%) */}
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

        {/* Column 3: Great-grandparents (3rd Generation) - 8 tiles: Father's grandparents (top 50%) and Mother's grandparents (bottom 50%) */}
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



// Main DogProfile component
const DogProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDogs, setAvailableDogs] = useState<Dog[]>([]);
  const [pedigreeGenerations, setPedigreeGenerations] = useState<PedigreeGeneration[]>([]);
  const [pedigreeLoading, setPedigreeLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DogFormData>();

  const selectedGender = watch('gender');

  // Load dog data
  const loadDog = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dogsApi.getById(id!);
      
      if (response.success && response.data) {
        setDog(response.data);
        setValue('dog_name', response.data.dog_name);
        setValue('primary_kennel', response.data.primary_kennel);
        setValue('secondary_kennel', response.data.secondary_kennel || '');
        setValue('gender', response.data.gender);
        setValue('father_id', response.data.father_id || '');
        setValue('mother_id', response.data.mother_id || '');
      } else {
        toast.error(response.error || 'Dog not found');
        router.push('/');
      }
    } catch (error) {
      toast.error('Error loading dog profile');
    } finally {
      setLoading(false);
    }
  }, [id, router, setValue]);

  // Load available dogs for parent selection
  const loadAvailableDogs = useCallback(async () => {
    try {
      const response = await dogsApi.getAll();
      if (response.success && response.data) {
        const filtered = response.data.filter(d => d.id !== id);
        setAvailableDogs(filtered);
      }
    } catch (error) {
      // Silent fail
    }
  }, [id]);

  // Load pedigree generations
  const loadPedigreeGenerations = useCallback(async () => {
    if (!dog) return;
    
    try {
      setPedigreeLoading(true);
      const generations = await buildPedigreeGenerations(dog);
      setPedigreeGenerations(generations);
    } catch (error) {
      console.error('Error loading pedigree generations:', error);
      toast.error('Error loading pedigree data');
    } finally {
      setPedigreeLoading(false);
    }
  }, [dog]);

  // Handle form update
  const handleUpdate = useCallback(async (data: DogFormData) => {
    try {
      setIsSubmitting(true);
      const response = await dogsApi.update(id!, data);
      
      if (response.success) {
        toast.success('Dog profile updated successfully!');
        setIsEditing(false);
        await loadDog(); // Reload dog data
        await loadPedigreeGenerations(); // Reload pedigree data
      } else {
        toast.error(response.error || 'Error updating dog profile');
      }
    } catch (error) {
      toast.error('Error updating dog profile');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, loadDog, loadPedigreeGenerations]);

  // Load data on component mount
  useEffect(() => {
    if (id) {
      loadDog();
      loadAvailableDogs();
    }
  }, [id, loadDog, loadAvailableDogs]);

  // Load pedigree when dog data is available
  useEffect(() => {
    if (dog) {
      loadPedigreeGenerations();
    }
  }, [dog, loadPedigreeGenerations]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Dog not found
  if (!dog) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Dog Not Found</h2>
        <Link href="/" className="btn-spotify-primary inline-flex items-center space-x-2">
          <ArrowLeft className={ICON_SIZE} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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
            <h1 className="text-4xl font-bold text-white">{dog.dog_name}</h1>
            <p className="text-gray-400 mt-2 text-lg">{dog.primary_kennel}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-spotify-secondary inline-flex items-center space-x-2"
          >
            <Edit className={SMALL_ICON_SIZE} />
            <span>{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleSubmit(handleUpdate)} className="space-y-8">
          <div className="card-spotify">
            <h2 className="text-xl font-semibold text-white mb-6">Edit Dog Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dog Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Dog Name *
                </label>
                <input
                  type="text"
                  {...register('dog_name', { 
                    required: 'Dog name is required',
                    minLength: { value: 2, message: 'Dog name must be at least 2 characters' }
                  })}
                  className="input-spotify w-full"
                />
                {errors.dog_name && (
                  <p className="mt-2 text-sm text-red-400">{errors.dog_name.message}</p>
                )}
              </div>

              {/* Primary Kennel */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Primary Kennel *
                </label>
                <input
                  type="text"
                  {...register('primary_kennel', { 
                    required: 'Primary kennel is required',
                    minLength: { value: 2, message: 'Primary kennel must be at least 2 characters' }
                  })}
                  className="input-spotify w-full"
                />
                {errors.primary_kennel && (
                  <p className="mt-2 text-sm text-red-400">{errors.primary_kennel.message}</p>
                )}
              </div>

              {/* Secondary Kennel */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Secondary Kennel
                </label>
                <input
                  type="text"
                  {...register('secondary_kennel')}
                  className="input-spotify w-full"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Gender *
                </label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className="input-spotify w-full"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <p className="mt-2 text-sm text-red-400">{errors.gender.message}</p>
                )}
              </div>

              {/* Father */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Father
                </label>
                <select
                  {...register('father_id')}
                  className="input-spotify w-full"
                >
                  <option value="">No father selected</option>
                  {availableDogs
                    .filter(d => d.gender === 'male')
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.dog_name} ({d.primary_kennel})
                      </option>
                    ))}
                </select>
              </div>

              {/* Mother */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Mother
                </label>
                <select
                  {...register('mother_id')}
                  className="input-spotify w-full"
                >
                  <option value="">No mother selected</option>
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

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-spotify-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-spotify-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-8">
          {/* Basic Information */}
          <BasicInfoCard dog={dog} />

          {/* Pedigree Tree */}
          {pedigreeLoading ? (
            <div className="card-spotify">
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-3 text-gray-400">Loading pedigree...</span>
              </div>
            </div>
          ) : (
            <PedigreeTree generations={pedigreeGenerations} />
          )}

          {/* Metadata */}
          <div className="card-spotify">
            <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">Created:</span>
                <span className="ml-2 text-white">{formatDate(dog.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DogProfile;