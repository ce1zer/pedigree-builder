import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Users } from 'lucide-react';
import { PedigreeNode } from '../types';
import { pedigreeApi } from '../services/api';
import toast from 'react-hot-toast';

const PedigreeViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pedigreeData, setPedigreeData] = useState<PedigreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (id) {
      loadPedigree();
    }
  }, [id]);

  const loadPedigree = async () => {
    try {
      setLoading(true);
      const response = await pedigreeApi.generate(id!, 5);
      
      if (response.success && response.data) {
        setPedigreeData(response.data);
      } else {
        toast.error(response.error || 'Fout bij het laden van stamboom');
        navigate(`/dogs/${id}`);
      }
    } catch (error) {
      console.error('Error loading pedigree:', error);
      toast.error('Fout bij het laden van stamboom');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPng = async () => {
    if (!pedigreeData) return;
    
    try {
      setExporting(true);
      const blob = await pedigreeApi.exportAsPng(pedigreeData);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stamboom-${pedigreeData.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Stamboom succesvol geëxporteerd!');
    } catch (error) {
      console.error('Error exporting pedigree:', error);
      toast.error('Fout bij het exporteren van stamboom');
    } finally {
      setExporting(false);
    }
  };

  const renderPedigreeNode = (node: PedigreeNode, x: number, y: number, level: number = 0): JSX.Element => {
    const nodeWidth = 120;
    const nodeHeight = 80;
    const levelHeight = 120;
    const siblingSpacing = 200;

    return (
      <g key={node.id}>
        {/* Node rectangle */}
        <rect
          x={x - nodeWidth / 2}
          y={y - nodeHeight / 2}
          width={nodeWidth}
          height={nodeHeight}
          fill={node.gender === 'male' ? '#dbeafe' : '#fce4ec'}
          stroke="#374151"
          strokeWidth="2"
          rx="8"
        />
        
        {/* Node content */}
        <text
          x={x}
          y={y - 10}
          textAnchor="middle"
          className="text-sm font-semibold fill-gray-900"
        >
          {node.name}
        </text>
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          className="text-xs fill-gray-600"
        >
          {node.breed}
        </text>
        <text
          x={x}
          y={y + 20}
          textAnchor="middle"
          className="text-xs fill-gray-500"
        >
          {new Date(node.birth_date).getFullYear()}
        </text>

        {/* Parent connections */}
        {node.father && (
          <>
            {/* Line to father */}
            <line
              x1={x}
              y1={y - nodeHeight / 2}
              x2={x - siblingSpacing / 2}
              y2={y - levelHeight}
              stroke="#6b7280"
              strokeWidth="2"
            />
            {renderPedigreeNode(node.father, x - siblingSpacing / 2, y - levelHeight, level + 1)}
          </>
        )}
        
        {node.mother && (
          <>
            {/* Line to mother */}
            <line
              x1={x}
              y1={y - nodeHeight / 2}
              x2={x + siblingSpacing / 2}
              y2={y - levelHeight}
              stroke="#6b7280"
              strokeWidth="2"
            />
            {renderPedigreeNode(node.mother, x + siblingSpacing / 2, y - levelHeight, level + 1)}
          </>
        )}
      </g>
    );
  };

  const calculateTreeDimensions = (node: PedigreeNode, level: number = 0): { width: number; height: number } => {
    let maxWidth = 0;
    let maxHeight = 0;

    const nodeWidth = 120;
    const nodeHeight = 80;
    const levelHeight = 120;
    const siblingSpacing = 200;

    if (level === 0) {
      maxWidth = nodeWidth;
      maxHeight = nodeHeight;
    }

    if (node.father) {
      const fatherDims = calculateTreeDimensions(node.father, level + 1);
      maxWidth = Math.max(maxWidth, fatherDims.width + siblingSpacing);
      maxHeight = Math.max(maxHeight, fatherDims.height + levelHeight);
    }

    if (node.mother) {
      const motherDims = calculateTreeDimensions(node.mother, level + 1);
      maxWidth = Math.max(maxWidth, motherDims.width + siblingSpacing);
      maxHeight = Math.max(maxHeight, motherDims.height + levelHeight);
    }

    return { width: maxWidth, height: maxHeight };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pedigreeData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Stamboom niet gevonden</h2>
        <button onClick={() => navigate(`/dogs/${id}`)} className="btn btn-primary">
          Terug naar Hondenprofiel
        </button>
      </div>
    );
  }

  const dimensions = calculateTreeDimensions(pedigreeData);
  const svgWidth = Math.max(dimensions.width + 100, 800);
  const svgHeight = Math.max(dimensions.height + 100, 600);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Stamboom van {pedigreeData.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Familiegeschiedenis tot 5 generaties terug
            </p>
          </div>
        </div>
        
        <button
          onClick={handleExportPng}
          disabled={exporting}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>{exporting ? 'Exporteren...' : 'Exporteer PNG'}</span>
        </button>
      </div>

      {/* Pedigree Tree */}
      <div className="card p-6">
        <div className="overflow-auto">
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            className="mx-auto"
            style={{ minWidth: '100%', minHeight: '400px' }}
          >
            {/* Background */}
            <rect
              width="100%"
              height="100%"
              fill="#ffffff"
            />
            
            {/* Title */}
            <text
              x={svgWidth / 2}
              y={30}
              textAnchor="middle"
              className="text-lg font-bold fill-gray-900"
            >
              Stamboom van {pedigreeData.name}
            </text>
            
            {/* Legend */}
            <g transform={`translate(20, ${svgHeight - 60})`}>
              <rect x={0} y={0} width={20} height={20} fill="#dbeafe" stroke="#374151" strokeWidth="1" rx="4" />
              <text x={30} y={15} className="text-sm fill-gray-700">Mannetje</text>
              
              <rect x={120} y={0} width={20} height={20} fill="#fce4ec" stroke="#374151" strokeWidth="1" rx="4" />
              <text x={150} y={15} className="text-sm fill-gray-700">Vrouwtje</text>
            </g>
            
            {/* Render pedigree tree */}
            {renderPedigreeNode(pedigreeData, svgWidth / 2, svgHeight - 100)}
          </svg>
        </div>
      </div>

      {/* Info Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stamboom Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Root hond:</span>
              <span className="font-medium">{pedigreeData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ras:</span>
              <span className="font-medium">{pedigreeData.breed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Geboortejaar:</span>
              <span className="font-medium">{new Date(pedigreeData.birth_date).getFullYear()}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generaties</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Maximaal:</span>
              <span className="font-medium">5 generaties</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Huidig:</span>
              <span className="font-medium">
                {Math.max(...getAllGenerations(pedigreeData)) + 1} generaties
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acties</h3>
          <div className="space-y-3">
            <button
              onClick={handleExportPng}
              disabled={exporting}
              className="w-full btn btn-primary flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exporteer PNG</span>
            </button>
            <button
              onClick={() => navigate(`/dogs/${id}`)}
              className="w-full btn btn-secondary flex items-center justify-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Bekijk Profiel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get all generation levels
const getAllGenerations = (node: PedigreeNode): number[] => {
  const generations = [node.generation];
  
  if (node.father) {
    generations.push(...getAllGenerations(node.father));
  }
  
  if (node.mother) {
    generations.push(...getAllGenerations(node.mother));
  }
  
  return generations;
};

export default PedigreeViewer;
