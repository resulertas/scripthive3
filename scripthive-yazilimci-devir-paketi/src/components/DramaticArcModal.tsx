import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Activity, X, ExternalLink, BarChart3, ChevronRight, ChevronLeft,
  Search, FastForward, Columns, Plus, Minus, Download, FileText, 
  Table as TableIcon, Check, Layers, SlidersHorizontal, ChevronDown
} from 'lucide-react';
import { ScreenplayElement } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, ReferenceLine, CartesianGrid, LineChart, Line
} from 'recharts';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, ShadingType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { printStyledDocument, downloadUtf8File, escapeHtml } from '../lib/exportUtils';
import { safeStorage } from '../lib/storage';

type ArcMetricKey = 'tension' | 'comedy' | 'action' | 'horror' | 'romance' | 'emotion';

interface MetricDefinition {
  key: ArcMetricKey;
  label: string;
  shortLabel: string;
  curveColor: string;
  dotColor: string;
  description: string;
  presets: { label: string; score: number; desc: string }[];
}

const METRIC_DEFINITIONS: Record<ArcMetricKey, MetricDefinition> = {
  tension: {
    key: 'tension',
    label: 'Gerilim Ritmi',
    shortLabel: 'Gerilim',
    curveColor: '#94a3b8', // Slate Silver
    dotColor: '#e2e8f0',
    description: 'Dramatik gerilim, çatışma ve baskı seviyesi',
    presets: [
      { label: 'Sakin', score: 20, desc: 'Açılış / Dinlenme' },
      { label: 'Denge', score: 45, desc: 'Normal Akış' },
      { label: 'Gerilim', score: 70, desc: 'Çatışma / Baskı' },
      { label: 'Doruk', score: 95, desc: 'Zirve / Kriz' },
    ]
  },
  comedy: {
    key: 'comedy',
    label: 'Komedi Ritmi',
    shortLabel: 'Komedi',
    curveColor: '#f59e0b', // Amber
    dotColor: '#fbbf24',
    description: 'Mizah, kahkaha ve tempolu diyalog seviyesi',
    presets: [
      { label: 'Düşük', score: 20, desc: 'Hazırlık / Konu İlerletme' },
      { label: 'Tempolu', score: 45, desc: 'Nükteli / Hafif Mizah' },
      { label: 'Kahkaha', score: 70, desc: 'Komik Durum / Punchline' },
      { label: 'Zirve', score: 95, desc: 'Büyük Gag / Doruk Komedi' },
    ]
  },
  action: {
    key: 'action',
    label: 'Aksiyon Ritmi',
    shortLabel: 'Aksiyon',
    curveColor: '#38bdf8', // Sky
    dotColor: '#7dd3fc',
    description: 'Fiziksel tempo, kovalamaca ve çatışma seviyesi',
    presets: [
      { label: 'Sakin', score: 20, desc: 'Planlama / Hazırlık' },
      { label: 'Hareketli', score: 45, desc: 'Takip / Kovalamaca' },
      { label: 'Çatışma', score: 70, desc: 'Dövüş / Tehlike' },
      { label: 'Zirve', score: 95, desc: 'Patlama / Büyük Aksiyon' },
    ]
  },
  horror: {
    key: 'horror',
    label: 'Korku Ritmi',
    shortLabel: 'Korku',
    curveColor: '#a855f7', // Purple
    dotColor: '#c084fc',
    description: 'Ürperti, dehşet ve tekinsizlik seviyesi',
    presets: [
      { label: 'Tedirgin', score: 20, desc: 'Tekinsiz Atmosfer' },
      { label: 'Ürperti', score: 45, desc: 'Şüphe / Beklenti' },
      { label: 'Dehşet', score: 70, desc: 'Jump Scare / Tehdit' },
      { label: 'Kabus', score: 95, desc: 'Büyük Şok / Çaresizlik' },
    ]
  },
  romance: {
    key: 'romance',
    label: 'Romantik Ritim',
    shortLabel: 'Romantik',
    curveColor: '#f43f5e', // Rose
    dotColor: '#fb7185',
    description: 'Duygusal yakınlaşma, flört ve tutku seviyesi',
    presets: [
      { label: 'Mesafeli', score: 20, desc: 'İlk Karşılaşma / Tanışma' },
      { label: 'Flört', score: 45, desc: 'Çekim / Diyalog' },
      { label: 'Tutku', score: 70, desc: 'İtiraf / Yakınlaşma' },
      { label: 'Doruk', score: 95, desc: 'Büyük İtiraf / Kavuşma' },
    ]
  },
  emotion: {
    key: 'emotion',
    label: 'Duygu Yoğunluğu',
    shortLabel: 'Duygu',
    curveColor: '#10b981', // Emerald Green
    dotColor: '#34d399',
    description: 'Duygusal derinlik, his ve dramatik etki seviyesi',
    presets: [
      { label: 'Sakin', score: 20, desc: 'Durgun / Nötr Duygu' },
      { label: 'Duygusal', score: 45, desc: 'Hafif Duygu / Empati' },
      { label: 'Yoğun', score: 70, desc: 'Güçlü Duygu / Kırılma' },
      { label: 'Zirve', score: 95, desc: 'Katarsis / Dramatik Doruk' },
    ]
  }
};

const VALID_ARC_METRICS: ArcMetricKey[] = ['tension', 'comedy', 'action', 'horror', 'romance', 'emotion'];

const getMetricDef = (key: string): MetricDefinition => {
  return METRIC_DEFINITIONS[key as ArcMetricKey] || METRIC_DEFINITIONS.tension;
};

const getValidMetrics = (metrics: any): ArcMetricKey[] => {
  if (!Array.isArray(metrics)) return ['action', 'comedy'];
  const valid = metrics.filter((k): k is ArcMetricKey => VALID_ARC_METRICS.includes(k as ArcMetricKey));
  return valid.length > 0 ? valid : ['action', 'comedy'];
};

const GENRE_PRESETS: { id: string; label: string; metrics: ArcMetricKey[] }[] = [
  { id: 'custom', label: 'Özel Seçim', metrics: [] },
  { id: 'comedy_action', label: 'Aksiyon & Komedi', metrics: ['action', 'comedy'] },
  { id: 'comedy_emotion', label: 'Komedi Dizisi (Komedi + Duygu)', metrics: ['comedy', 'emotion'] },
  { id: 'romcom', label: 'Romantik Komedi', metrics: ['comedy', 'romance', 'emotion'] },
  { id: 'drama_tension', label: 'Dram & Gerilim', metrics: ['tension', 'emotion'] },
  { id: 'action_thriller', label: 'Aksiyon & Gerilim', metrics: ['action', 'tension'] },
  { id: 'horror_thriller', label: 'Korku & Gerilim', metrics: ['horror', 'tension'] },
  { id: 'all_genres', label: 'Tüm Türler', metrics: ['tension', 'comedy', 'action', 'horror', 'romance', 'emotion'] },
];

interface DramaticArcModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ScreenplayElement[];
  onUpdateElementTension?: (sceneId: string, tensionScore: number) => void;
  onUpdateSceneArcData?: (sceneId: string, updates: { 
    tensionScore?: number; 
    comedyScore?: number; 
    actionScore?: number; 
    horrorScore?: number;
    romanceScore?: number;
    emotionScore?: number;
    emotionTag?: string;
  }) => void;
  onJumpToScene?: (elementId: string) => void;
  onOpenInSplitPanel?: () => void;
  theme: 'dark' | 'light';
}

interface SceneArcData {
  id: string;
  sceneNumber: number | string;
  title: string;
  location: string;
  tension: number;
  comedy: number;
  action: number;
  horror: number;
  romance: number;
  emotion: number;
  wordCount: number;
  characters: string[];
  approxPage: number;
  act: '1. Perde' | '2. Perde' | '3. Perde';
  actIndex: 1 | 2 | 3;
}

/**
 * Renders a high-resolution standalone chart image (Base64 PNG)
 * representing curves ONLY for the active selected metrics.
 */
function generateRhythmChartImage(
  scenes: SceneArcData[],
  selectedMetrics: ArcMetricKey[],
  stats: Record<string, any>
): string {
  const canvas = document.createElement('canvas');
  const width = 1600;
  const height = 480;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  if (scenes.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Henüz sahne verisi bulunamadı', width / 2, height / 2);
    return canvas.toDataURL('image/png');
  }

  // 2. Geometry
  const padLeft = 125;
  const padRight = 50;
  const padTop = 100;
  const padBottom = 55;
  const graphWidth = width - padLeft - padRight;
  const graphHeight = height - padTop - padBottom;

  // 3. Header: Clean Two-Tier Layout (No Collisions)
  const validMetrics = getValidMetrics(selectedMetrics);
  const subtitleStats = validMetrics.map(k => `${getMetricDef(k).shortLabel}: ${stats[`avg_${k}`] || 0}`).join('  |  ');

  // Tier 1: Main Title & Scene / Stat Summary (Y = 34)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('DRAMATİK RİTİM EĞRİSİ', padLeft, 34);

  ctx.textAlign = 'right';
  ctx.font = '600 14px "Courier Prime", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Toplam: ${scenes.length} Sahne  |  ${subtitleStats}`, width - padRight, 34);

  // Tier 2: Dynamic Metric Legend Badges (Y = 68)
  let legendX = padLeft;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  validMetrics.forEach(key => {
    const def = getMetricDef(key);
    // Swatch
    ctx.fillStyle = def.curveColor;
    ctx.fillRect(legendX, 62, 12, 12);

    // Label
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(def.label, legendX + 18, 68);

    const textWidth = ctx.measureText(def.label).width;
    legendX += 18 + textWidth + 28;
  });

  // 4. Grid Lines & Y-Axis Labels
  const gridLevels = [
    { score: 100, label: '100' },
    { score: 85, label: '85 (Doruk)' },
    { score: 50, label: '50 (Denge)' },
    { score: 0, label: '0' },
  ];

  ctx.lineWidth = 1.2;
  gridLevels.forEach(grid => {
    const y = padTop + (1 - grid.score / 100) * graphHeight;
    ctx.strokeStyle = grid.score === 85 ? 'rgba(148, 163, 184, 0.35)' : 'rgba(51, 65, 85, 0.6)';
    ctx.setLineDash(grid.score === 0 ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '14px "Courier Prime", monospace';
    ctx.fillStyle = grid.score === 85 ? '#94a3b8' : '#64748b';
    ctx.fillText(grid.label, padLeft - 16, y);
  });

  const getPoints = (getValue: (s: SceneArcData) => number) => {
    return scenes.map((s, idx) => {
      const x = scenes.length === 1
        ? padLeft + graphWidth / 2
        : padLeft + (idx / (scenes.length - 1)) * graphWidth;
      const score = Math.max(0, Math.min(100, getValue(s)));
      const y = padTop + (1 - score / 100) * graphHeight;
      return { x, y, score, sceneNumber: s.sceneNumber };
    });
  };

  const drawCurve = (
    pts: Array<{ x: number; y: number; score: number }>,
    strokeColor: string,
    fillGradient: boolean
  ) => {
    if (pts.length === 0) return;

    if (fillGradient && pts.length > 1) {
      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + graphHeight);
      grad.addColorStop(0, strokeColor + '44');
      grad.addColorStop(1, strokeColor + '03');

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = i > 0 ? pts[i - 1] : pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = i + 2 < pts.length ? pts[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }

      ctx.lineTo(pts[pts.length - 1].x, padTop + graphHeight);
      ctx.lineTo(pts[0].x, padTop + graphHeight);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = strokeColor;
    ctx.moveTo(pts[0].x, pts[0].y);

    if (pts.length === 1) {
      ctx.arc(pts[0].x, pts[0].y, 5, 0, Math.PI * 2);
    } else {
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = i > 0 ? pts[i - 1] : pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = i + 2 < pts.length ? pts[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
    }
    ctx.stroke();

    // Dots
    pts.forEach(p => {
      if (p.score >= 80 || scenes.length <= 25) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.score >= 80 ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = p.score >= 80 ? '#ffffff' : strokeColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
      }
    });
  };

  // 5. Render Curves
  const isSingle = validMetrics.length === 1;

  validMetrics.forEach(key => {
    const def = getMetricDef(key);
    const pts = getPoints(s => (s as any)[key]);
    drawCurve(pts, def.curveColor, isSingle);
  });

  // 6. X-Axis Scene Numbers
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '13px "Courier Prime", monospace';
  ctx.fillStyle = '#64748b';

  const step = scenes.length <= 40 ? 1 : scenes.length <= 80 ? 2 : Math.ceil(scenes.length / 40);
  scenes.forEach((s, idx) => {
    if (idx % step === 0 || idx === scenes.length - 1) {
      const x = scenes.length === 1
        ? padLeft + graphWidth / 2
        : padLeft + (idx / (scenes.length - 1)) * graphWidth;
      ctx.fillText(String(s.sceneNumber), x, padTop + graphHeight + 12);
    }
  });

  return canvas.toDataURL('image/png');
}

export default function DramaticArcModal({
  isOpen,
  onClose,
  elements,
  onUpdateElementTension,
  onUpdateSceneArcData,
  onJumpToScene,
  onOpenInSplitPanel,
  theme
}: DramaticArcModalProps) {
  // 1. Saved Selected Metrics for the Project (e.g. ['action', 'comedy'])
  const [selectedMetrics, setSelectedMetrics] = useState<ArcMetricKey[]>(() => {
    const saved = safeStorage.getItem('scriptHive_selectedArcMetrics');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return getValidMetrics(parsed);
      } catch (e) {}
    }
    return ['action', 'comedy']; // Default: Aksiyon & Komedi
  });

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actFilter, setActFilter] = useState<'all' | 'act1' | 'act2' | 'act3' | 'climax'>('all');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const sceneListRef = useRef<HTMLDivElement>(null);

  const activeMetrics = useMemo(() => getValidMetrics(selectedMetrics), [selectedMetrics]);

  const handleUpdateSelectedMetrics = (nextMetrics: ArcMetricKey[]) => {
    const valid = getValidMetrics(nextMetrics);
    setSelectedMetrics(valid);
    safeStorage.setItem('scriptHive_selectedArcMetrics', JSON.stringify(valid));
  };

  const handleToggleMetric = (key: ArcMetricKey) => {
    if (!VALID_ARC_METRICS.includes(key)) return;
    if (activeMetrics.includes(key)) {
      if (activeMetrics.length === 1) return; // Keep at least 1
      handleUpdateSelectedMetrics(activeMetrics.filter(m => m !== key));
    } else {
      handleUpdateSelectedMetrics([...activeMetrics, key]);
    }
  };

  // Parse scenes and heuristic baselines
  const sceneData = useMemo(() => {
    const list: SceneArcData[] = [];
    let currentSceneEl: ScreenplayElement | null = null;
    let currentWords = 0;
    let currentChars = new Set<string>();
    let totalRunningWords = 0;
    let sceneIndex = 0;

    const finalizeScene = () => {
      if (currentSceneEl) {
        sceneIndex += 1;
        const estProgress = elements.length > 0 ? (elements.indexOf(currentSceneEl) / elements.length) : 0;
        let defaultTension = 30;
        let act: '1. Perde' | '2. Perde' | '3. Perde' = '1. Perde';
        let actIndex: 1 | 2 | 3 = 1;

        if (estProgress < 0.25) {
          act = '1. Perde';
          actIndex = 1;
          defaultTension = 30 + (estProgress / 0.25) * 25;
        } else if (estProgress < 0.75) {
          act = '2. Perde';
          actIndex = 2;
          if (estProgress < 0.50) {
            defaultTension = 45 + ((estProgress - 0.25) / 0.25) * 30;
          } else {
            defaultTension = 70 + ((estProgress - 0.50) / 0.25) * 15;
          }
        } else {
          act = '3. Perde';
          actIndex = 3;
          if (estProgress < 0.90) {
            defaultTension = 90 + ((estProgress - 0.75) / 0.15) * 8;
          } else {
            defaultTension = 98 - ((estProgress - 0.90) / 0.10) * 60;
          }
        }

        const tension = currentSceneEl.tensionScore !== undefined ? currentSceneEl.tensionScore : Math.round(defaultTension);
        const comedy = currentSceneEl.comedyScore !== undefined ? currentSceneEl.comedyScore : 40;
        const action = currentSceneEl.actionScore !== undefined ? currentSceneEl.actionScore : 35;
        const horror = currentSceneEl.horrorScore !== undefined ? currentSceneEl.horrorScore : 30;
        const romance = currentSceneEl.romanceScore !== undefined ? currentSceneEl.romanceScore : 30;
        const emotion = currentSceneEl.emotionScore !== undefined ? currentSceneEl.emotionScore : (tension >= 70 ? 75 : 45);

        list.push({
          id: currentSceneEl.id,
          sceneNumber: currentSceneEl.sceneNumber || sceneIndex,
          title: currentSceneEl.content,
          location: currentSceneEl.content.split('-')[0].replace(/^(İÇ|DIŞ|İÇ\/DIŞ)\.?\s*/i, '').trim(),
          tension,
          comedy,
          action,
          horror,
          romance,
          emotion,
          wordCount: currentWords,
          characters: Array.from(currentChars),
          approxPage: Math.max(1, Math.ceil(totalRunningWords / 220)),
          act,
          actIndex
        });
      }
    };

    elements.forEach((el) => {
      const words = el.content.trim().split(/\s+/).filter(Boolean).length;
      totalRunningWords += words;

      if (el.type === 'scene') {
        finalizeScene();
        currentSceneEl = el;
        currentWords = 0;
        currentChars = new Set();
      } else {
        currentWords += words;
        if (el.type === 'character') {
          const cleaned = el.content.replace(/\(.*\)/g, '').trim().toLocaleUpperCase('tr-TR');
          if (cleaned) currentChars.add(cleaned);
        }
      }
    });

    finalizeScene();
    return list;
  }, [elements]);

  // Set default selected scene
  useEffect(() => {
    if (sceneData.length > 0 && !selectedSceneId) {
      setSelectedSceneId(sceneData[0].id);
    }
  }, [sceneData, selectedSceneId]);

  const selectedIndex = useMemo(() => {
    return sceneData.findIndex(s => s.id === selectedSceneId);
  }, [sceneData, selectedSceneId]);

  const selectedScene = useMemo(() => {
    if (selectedIndex >= 0 && selectedIndex < sceneData.length) {
      return sceneData[selectedIndex];
    }
    return sceneData[0];
  }, [sceneData, selectedIndex]);

  // Filtered scenes
  const filteredScenes = useMemo(() => {
    return sceneData.filter(s => {
      if (actFilter === 'act1' && s.actIndex !== 1) return false;
      if (actFilter === 'act2' && s.actIndex !== 2) return false;
      if (actFilter === 'act3' && s.actIndex !== 3) return false;
      if (actFilter === 'climax') {
        const hasClimax = activeMetrics.some(k => ((s as any)[k] || 0) >= 80);
        if (!hasClimax) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLocaleLowerCase('tr-TR');
        const matchTitle = s.title.toLocaleLowerCase('tr-TR').includes(query);
        const matchLoc = s.location.toLocaleLowerCase('tr-TR').includes(query);
        const matchNum = String(s.sceneNumber).includes(query);
        const matchChars = s.characters.some(c => c.toLocaleLowerCase('tr-TR').includes(query));
        return matchTitle || matchLoc || matchNum || matchChars;
      }

      return true;
    });
  }, [sceneData, actFilter, searchQuery, activeMetrics]);

  // Navigation handlers
  const handleSelectPrev = () => {
    if (selectedIndex > 0) {
      setSelectedSceneId(sceneData[selectedIndex - 1].id);
    }
  };

  const handleSelectNext = () => {
    if (selectedIndex < sceneData.length - 1) {
      setSelectedSceneId(sceneData[selectedIndex + 1].id);
    }
  };

  // Score update handler for ANY specific metric
  const handleApplyScore = (metricKey: ArcMetricKey, score: number, shouldAdvance = false) => {
    if (!selectedScene) return;
    const clamped = Math.min(100, Math.max(1, score));

    if (metricKey === 'horror') {
      onUpdateSceneArcData?.(selectedScene.id, { horrorScore: clamped });
    } else if (metricKey === 'romance') {
      onUpdateSceneArcData?.(selectedScene.id, { romanceScore: clamped });
    } else if (metricKey === 'action') {
      onUpdateSceneArcData?.(selectedScene.id, { actionScore: clamped });
    } else if (metricKey === 'comedy') {
      onUpdateSceneArcData?.(selectedScene.id, { comedyScore: clamped });
    } else if (metricKey === 'emotion') {
      onUpdateSceneArcData?.(selectedScene.id, { emotionScore: clamped });
    } else {
      onUpdateElementTension?.(selectedScene.id, clamped);
      onUpdateSceneArcData?.(selectedScene.id, { tensionScore: clamped });
    }

    if (shouldAdvance && selectedIndex < sceneData.length - 1) {
      setSelectedSceneId(sceneData[selectedIndex + 1].id);
    }
  };

  const handleDeltaScore = (metricKey: ArcMetricKey, delta: number) => {
    if (!selectedScene) return;
    const currentVal = (selectedScene as any)[metricKey] || 50;
    handleApplyScore(metricKey, currentVal + delta, false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleSelectPrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleSelectNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, sceneData]);

  // Statistics & Metrics for selected genres
  const stats = useMemo(() => {
    const res: Record<string, any> = {};
    if (sceneData.length === 0) return res;

    (['tension', 'comedy', 'action', 'horror', 'romance', 'emotion'] as ArcMetricKey[]).forEach(k => {
      const total = sceneData.reduce((acc, s) => acc + ((s as any)[k] || 0), 0);
      res[`avg_${k}`] = Math.round(total / sceneData.length);
      res[`max_${k}`] = Math.max(...sceneData.map(s => (s as any)[k] || 0));
      res[`climax_${k}`] = sceneData.filter(s => ((s as any)[k] || 0) >= 80).length;
    });

    return res;
  }, [sceneData]);

  // Exports
  const handleExportPDF = () => {
    const chartDataUrl = generateRhythmChartImage(sceneData, activeMetrics, stats);

    const statCardsHtml = `
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-val">${sceneData.length}</div>
          <div class="stat-lbl">Toplam Sahne</div>
        </div>
        ${activeMetrics.map(k => `
          <div class="stat-box">
            <div class="stat-val">${stats[`avg_${k}`] || 0} / 100</div>
            <div class="stat-lbl">Ort. ${getMetricDef(k).shortLabel}</div>
          </div>
        `).join('')}
      </div>
    `;

    const tableHeaderHtml = `
      <thead>
        <tr>
          <th style="width: 7%; text-align: center;">Sahne</th>
          <th style="width: 28%;">Sahne Başlığı & Mekan</th>
          ${activeMetrics.map(k => `
            <th style="text-align: center;">${getMetricDef(k).shortLabel} (1-100)</th>
          `).join('')}
          <th style="width: 22%;">Karakterler</th>
        </tr>
      </thead>
    `;

    const tableRowsHtml = sceneData.map(s => `
      <tr>
        <td style="text-align: center; font-weight: 700; color: #334155;">#${s.sceneNumber}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a;">${escapeHtml(s.title)}</div>
          <div style="font-size: 7.5pt; color: #64748b;">${escapeHtml(s.location || 'Genel')} • ${s.wordCount} Kelime (~${s.approxPage}. Sayfa)</div>
        </td>
        ${activeMetrics.map(k => `
          <td style="text-align: center; font-weight: 700;">${(s as any)[k]} / 100</td>
        `).join('')}
        <td style="color: #475569; font-size: 8.5pt;">${escapeHtml(s.characters.join(', ') || '-')}</td>
      </tr>
    `).join('');

    const bodyHtml = `
      ${statCardsHtml}

      <div class="section-title">Dramatik Ritim & Dalgalanma Grafiği</div>
      <div style="margin: 14px 0 24px; text-align: center;">
        <img src="${chartDataUrl}" style="width: 100%; max-width: 860px; height: auto; border-radius: 8px; border: 1px solid #334155; display: block; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Ritim Grafiği" />
      </div>

      <div class="section-title">Sahne Bazlı Ritim Analiz Çizelgesi</div>

      <table class="data-table">
        ${tableHeaderHtml}
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    `;

    const genreTitle = activeMetrics.map(k => getMetricDef(k).shortLabel).join(', ');

    printStyledDocument({
      title: `Dramatik Ritim Analiz Raporu (${genreTitle})`,
      categoryBadge: 'Senaryo Ritim Analizi',
      subtitle: `${sceneData.length} Sahne • ` + activeMetrics.map(k => `${getMetricDef(k).shortLabel}: ${stats[`avg_${k}`] || 0}/100`).join(' • '),
      bodyHtml,
      accentColor: '#475569'
    });
  };

  const handleExportDOCX = async () => {
    try {
      const chartDataUrl = generateRhythmChartImage(sceneData, activeMetrics, stats);
      const base64Data = chartDataUrl.split(',')[1] || chartDataUrl;
      const binaryString = atob(base64Data);
      const imageBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageBytes[i] = binaryString.charCodeAt(i);
      }

      const headerCells: TableCell[] = [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SAHNE", bold: true, size: 16, font: "Arial" })], alignment: AlignmentType.CENTER })], shading: { fill: "F1F5F9", type: ShadingType.CLEAR } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SAHNE BAŞLIĞI", bold: true, size: 16, font: "Arial" })] })], shading: { fill: "F1F5F9", type: ShadingType.CLEAR } }),
      ];

      activeMetrics.forEach(k => {
        headerCells.push(
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: getMetricDef(k).shortLabel.toLocaleUpperCase('tr-TR'), bold: true, size: 16, font: "Arial" })], alignment: AlignmentType.CENTER })],
            shading: { fill: "F1F5F9", type: ShadingType.CLEAR }
          })
        );
      });

      headerCells.push(
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "KARAKTERLER", bold: true, size: 16, font: "Arial" })] })],
          shading: { fill: "F1F5F9", type: ShadingType.CLEAR }
        })
      );

      const bodyRows = sceneData.map(s => {
        const cells: TableCell[] = [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `#${s.sceneNumber}`, bold: true, size: 16, font: "Arial" })], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.title, size: 16, font: "Arial" })] })] }),
        ];

        activeMetrics.forEach(k => {
          cells.push(
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${(s as any)[k]}`, bold: true, size: 16, font: "Arial" })], alignment: AlignmentType.CENTER })]
            })
          );
        });

        cells.push(
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: s.characters.join(', ') || '-', size: 16, font: "Arial" })] })]
          })
        );

        return new TableRow({ children: cells });
      });

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
              }
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "DRAMATİK RİTİM ANALİZ RAPORU", bold: true, size: 28, font: "Arial" })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 120 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Toplam Sahne: ${sceneData.length}  |  ` + activeMetrics.map(k => `Ort. ${getMetricDef(k).shortLabel}: ${stats[`avg_${k}`] || 0}/100`).join('  |  ') + `  |  Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
                    italics: true,
                    size: 18,
                    color: "64748B",
                    font: "Arial"
                  }),
                ],
                spacing: { after: 200 },
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBytes,
                    transformation: {
                      width: 590,
                      height: 170,
                    },
                  } as any),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 260 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({ children: headerCells }),
                  ...bodyRows
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "ScriptHive_Ritim_Raporu.docx");
    } catch (err: any) {
      console.error(err);
      alert('Word dosyası oluşturulurken hata oluştu: ' + (err.message || String(err)));
    }
  };

  const handleExportMD = () => {
    let md = `# DRAMATİK RİTİM ANALİZ RAPORU\n\n`;
    md += `* **Toplam Sahne:** ${sceneData.length}\n`;
    activeMetrics.forEach(k => {
      md += `* **Ortalama ${getMetricDef(k).label}:** ${stats[`avg_${k}`] || 0} / 100\n`;
    });
    md += `* **Rapor Tarihi:** ${new Date().toLocaleDateString('tr-TR')}\n\n---\n\n`;

    let mdHeader = `| Sahne No | Sahne Başlığı |`;
    let mdDivider = `| :---: | :--- |`;
    activeMetrics.forEach(k => {
      mdHeader += ` ${getMetricDef(k).shortLabel} (1-100) |`;
      mdDivider += ` :---: |`;
    });
    mdHeader += ` Karakterler |\n`;
    mdDivider += ` :--- |\n`;

    md += mdHeader + mdDivider;

    sceneData.forEach(s => {
      let row = `| #${s.sceneNumber} | ${s.title} |`;
      activeMetrics.forEach(k => {
        row += ` ${(s as any)[k]} |`;
      });
      row += ` ${s.characters.join(', ') || '-'} |\n`;
      md += row;
    });

    downloadUtf8File(md, "ScriptHive_Ritim_Raporu.md", "text/markdown;charset=utf-8");
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const bgModal = isDark ? 'bg-[#151921] text-slate-200 border-slate-800' : 'bg-[#fcfaf6] text-slate-800 border-[#ded5c5]';
  const borderSubtle = isDark ? 'border-slate-800/80' : 'border-[#e8e0d2]';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const btnGhost = isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/70' : 'text-slate-600 hover:text-slate-900 hover:bg-[#ebe3d5]';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.15 }}
          className={`w-full max-w-5xl h-[94vh] rounded-xl shadow-2xl border flex flex-col overflow-visible ${bgModal}`}
        >
          {/* 1. TOP HEADER BAR */}
          <div className={`px-5 py-2.5 border-b flex items-center justify-between gap-3 shrink-0 ${borderSubtle}`}>
            {/* Title & Active Badges */}
            <div className="flex items-center gap-2.5 min-w-0">
              <h2 className="text-sm sm:text-base font-semibold tracking-tight whitespace-nowrap">Ritim & Dramatik Analiz</h2>
              <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono hidden md:inline-block border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-[#f0ebe0] border-[#d8cfbe] text-slate-700'}`}>
                {activeMetrics.map(k => getMetricDef(k).shortLabel).join(' + ')}
              </span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {onOpenInSplitPanel && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenInSplitPanel();
                    onClose();
                  }}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    isDark 
                      ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300' 
                      : 'border-[#ded5c5] bg-white hover:bg-[#ebe3d5] text-slate-700'
                  }`}
                  title="Senaryoyu okurken yan yana puanlama yapmak için Çift Panel modunu açar"
                >
                  <Columns size={13} className="opacity-70" />
                  <span className="text-[11px] hidden sm:inline">Çift Panelde Aç</span>
                </button>
              )}

              <label 
                className={`hidden sm:flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border cursor-pointer transition-colors ${
                  autoAdvance 
                    ? (isDark ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-[#eae2d4] border-[#cfc4b0] text-slate-800')
                    : (isDark ? 'border-transparent text-slate-500 hover:text-slate-400' : 'border-transparent text-slate-500 hover:text-slate-700')
                }`}
                title="Puanlama yapıldığında otomatik olarak bir sonraki sahneye geçer"
              >
                <input 
                  type="checkbox" 
                  checked={autoAdvance} 
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="sr-only"
                />
                <FastForward size={12} className={autoAdvance ? "opacity-100" : "opacity-40"} />
                <span className="text-[11px]">Otomatik İlerle</span>
              </label>

              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${btnGhost}`}
                title="Kapat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 2. GENRE & METRIC SELECTION TOOLBAR (Direct Toggle Pills - No Clipping!) */}
          <div className={`px-5 py-2 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${isDark ? 'bg-[#12161f]' : 'bg-[#f6f2e9]'} ${borderSubtle}`}>
            {/* Left: Metric Toggle Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold opacity-60 uppercase tracking-wider mr-1">Analiz Türleri:</span>

              {(['tension', 'comedy', 'action', 'horror', 'romance', 'emotion'] as ArcMetricKey[]).map(key => {
                const def = getMetricDef(key);
                const isSelected = activeMetrics.includes(key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToggleMetric(key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                      isSelected
                        ? (isDark ? 'bg-slate-700 text-white font-semibold border-slate-500 shadow-xs' : 'bg-white text-slate-900 font-bold border-slate-400 shadow-xs')
                        : (isDark ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200' : 'bg-black/5 text-slate-500 border-transparent hover:text-slate-800')
                    }`}
                    title={`${def.label} puanlamasını aç / kapat`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: def.curveColor }} />
                    <span>{def.shortLabel}</span>
                    {isSelected && <Check size={11} className="opacity-80" />}
                  </button>
                );
              })}
            </div>

            {/* Right: Quick Genre Preset Packages */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresetsMenu(!showPresetsMenu)}
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors ${
                  isDark ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300' : 'border-[#dcd3c3] bg-white hover:bg-[#ebe3d5] text-slate-700'
                }`}
              >
                <span>Hazır Tür Paketleri</span>
                <ChevronDown size={11} className="opacity-60" />
              </button>

              {showPresetsMenu && (
                <div className={`absolute right-0 top-full mt-1 w-64 rounded-xl shadow-2xl border p-2 z-50 text-xs ${isDark ? 'bg-[#1a202c] border-slate-700 text-slate-200' : 'bg-white border-[#ded5c5] text-slate-800'}`}>
                  <div className="font-semibold text-[10px] uppercase opacity-50 px-2 py-1 border-b border-black/10 dark:border-white/10 mb-1">
                    Hızlı Tür Şablonları
                  </div>
                  {GENRE_PRESETS.filter(p => p.id !== 'custom').map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        handleUpdateSelectedMetrics(preset.metrics);
                        setShowPresetsMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        JSON.stringify(preset.metrics) === JSON.stringify(activeMetrics)
                          ? (isDark ? 'bg-slate-700 font-bold text-white' : 'bg-slate-200 font-bold text-slate-900')
                          : (isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')
                      }`}
                    >
                      <span>{preset.label}</span>
                      {JSON.stringify(preset.metrics) === JSON.stringify(activeMetrics) && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. STATS STRIP (Averages for all active selected genres) */}
          <div className={`px-5 py-1.5 border-b flex items-center justify-between text-[11px] ${textMuted} shrink-0 ${borderSubtle}`}>
            <div className="flex items-center gap-2 overflow-x-auto">
              <span>Toplam: <strong className="font-mono">{sceneData.length} Sahne</strong></span>
              {activeMetrics.map(k => (
                <React.Fragment key={k}>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getMetricDef(k).curveColor }} />
                    <span>Ort. {getMetricDef(k).shortLabel}:</span>
                    <strong className="font-mono">{(stats as any)[`avg_${k}`] || 0}/100</strong>
                  </span>
                </React.Fragment>
              ))}
            </div>
            <span className="hidden md:inline opacity-60">Klavye: [←/→] Gezin</span>
          </div>

          {/* 4. VISUAL RHYTHM CHART (Multi-curve rendering for selected genres) */}
          <div className={`w-full h-36 sm:h-40 px-4 pt-2 pb-1 border-b shrink-0 ${borderSubtle}`}>
            {sceneData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <BarChart3 size={30} className="mb-1" />
                <p className="text-xs">Senaryoda henüz sahne başlığı bulunamadı.</p>
              </div>
            ) : activeMetrics.length > 1 ? (
              /* Multi-Line Chart */
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sceneData}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setSelectedSceneId(e.activePayload[0].payload.id);
                    }
                  }}
                  margin={{ top: 5, right: 10, left: -30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="2 2" stroke={isDark ? '#232d3b' : '#eae3d5'} />
                  <XAxis 
                    dataKey="sceneNumber" 
                    stroke={isDark ? '#64748b' : '#94a3b8'} 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke={isDark ? '#64748b' : '#94a3b8'} 
                    fontSize={10}
                    tickLine={false}
                    ticks={[0, 50, 100]}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as SceneArcData;
                        return (
                          <div className={`p-2 rounded-lg shadow-lg border text-xs ${isDark ? 'bg-[#1a202c] border-slate-700 text-slate-100' : 'bg-white border-[#d8cdba] text-slate-900'}`}>
                            <div className="font-semibold mb-1">
                              #{data.sceneNumber}: {data.title}
                            </div>
                            <div className="space-y-0.5 text-[11px]">
                              {activeMetrics.map(k => (
                                <div key={k} className="flex items-center justify-between gap-3">
                                  <span style={{ color: getMetricDef(k).curveColor }}>{getMetricDef(k).label}:</span>
                                  <strong className="font-mono">{(data as any)[k]}/100</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={50} stroke={isDark ? '#334155' : '#cbd5e1'} strokeDasharray="3 3" />
                  <ReferenceLine y={85} stroke={isDark ? '#475569' : '#94a3b8'} strokeDasharray="3 3" />

                  {activeMetrics.map(k => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      name={getMetricDef(k).shortLabel}
                      stroke={getMetricDef(k).curveColor}
                      strokeWidth={2.2}
                      dot={false}
                      activeDot={{ r: 4.5, fill: getMetricDef(k).curveColor }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              /* Single Metric Area Chart with Rich Gradient */
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sceneData}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setSelectedSceneId(e.activePayload[0].payload.id);
                    }
                  }}
                  margin={{ top: 5, right: 10, left: -30, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="singleCurveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getMetricDef(activeMetrics[0]).curveColor} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={getMetricDef(activeMetrics[0]).curveColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke={isDark ? '#232d3b' : '#eae3d5'} />
                  <XAxis dataKey="sceneNumber" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} ticks={[0, 50, 100]} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as SceneArcData;
                        const k = activeMetrics[0];
                        return (
                          <div className={`p-2 rounded-lg shadow-lg border text-xs ${isDark ? 'bg-[#1a202c] border-slate-700 text-slate-100' : 'bg-white border-[#d8cdba] text-slate-900'}`}>
                            <div className="font-semibold mb-0.5">#{data.sceneNumber}: {data.title}</div>
                            <div className="text-[11px]" style={{ color: getMetricDef(k).curveColor }}>
                              {getMetricDef(k).label}: <strong className="font-mono">{(data as any)[k]}/100</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={50} stroke={isDark ? '#334155' : '#cbd5e1'} strokeDasharray="3 3" />
                  <ReferenceLine y={85} stroke={isDark ? '#475569' : '#94a3b8'} strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey={activeMetrics[0]}
                    stroke={getMetricDef(activeMetrics[0]).curveColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#singleCurveGrad)"
                    dot={(props: any) => {
                      if (props.payload.id === selectedSceneId) {
                        return (
                          <circle 
                            key={`dot-${props.payload.id}`}
                            cx={props.cx} cy={props.cy} r={5} 
                            fill={isDark ? '#f8fafc' : '#0f172a'} 
                            stroke="#ffffff" strokeWidth={2} 
                          />
                        );
                      }
                      return null;
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 5. ACTIVE SCENE SIMULTANEOUS SCORING CONTROL PANEL */}
          {selectedScene && (
            <div className={`px-5 py-3 border-b space-y-2 shrink-0 ${isDark ? 'bg-[#161b24]' : 'bg-[#f5efe4]'} ${borderSubtle}`}>
              {/* Scene Heading & Quick Navigation */}
              <div className="flex items-center justify-between gap-2 border-b pb-1.5 border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectPrev}
                      disabled={selectedIndex <= 0}
                      className={`p-1 rounded transition-colors ${selectedIndex > 0 ? btnGhost : 'opacity-25 cursor-not-allowed'}`}
                      title="Önceki Sahne"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectNext}
                      disabled={selectedIndex >= sceneData.length - 1}
                      className={`p-1 rounded transition-colors ${selectedIndex < sceneData.length - 1 ? btnGhost : 'opacity-25 cursor-not-allowed'}`}
                      title="Sonraki Sahne"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <span className="font-mono font-bold text-xs opacity-70 shrink-0">
                    #{selectedScene.sceneNumber}
                  </span>
                  <span className="font-semibold text-xs truncate">
                    {selectedScene.title}
                  </span>
                  <span className="text-[11px] opacity-50 shrink-0 hidden sm:inline">
                    ({selectedScene.act} • ~{selectedScene.approxPage}. Sayfa)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onJumpToScene?.(selectedScene.id);
                    onClose();
                  }}
                  className="text-[11px] opacity-70 hover:opacity-100 hover:underline flex items-center gap-0.5 shrink-0"
                >
                  <span>Metne Git</span>
                  <ExternalLink size={10} />
                </button>
              </div>

              {/* Simultaneous Multi-Genre Scoring Rows for Active Scene */}
              <div className={`grid gap-2 ${activeMetrics.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {activeMetrics.map(key => {
                  const def = getMetricDef(key);
                  const currentScore = (selectedScene as any)[key] || 50;

                  return (
                    <div 
                      key={key}
                      className={`p-2 rounded-xl border flex flex-col gap-1.5 ${isDark ? 'bg-[#12161f]/90 border-slate-800' : 'bg-white border-[#ded5c5]'}`}
                    >
                      {/* Metric Header & Score Display */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: def.curveColor }} />
                          <span className="font-semibold text-xs" style={{ color: def.curveColor }}>{def.label}</span>
                        </div>

                        {/* Numeric Score + Steppers */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeltaScore(key, -5)}
                            className={`p-1 rounded border text-xs transition-colors ${isDark ? 'border-slate-700 bg-slate-800/60 text-slate-300' : 'border-[#dcd3c3] bg-white text-slate-700'}`}
                            title="-5 Azalt"
                          >
                            <Minus size={11} />
                          </button>

                          <div className={`px-2 py-0.5 rounded border font-mono font-bold text-xs flex items-center gap-1 ${isDark ? 'bg-black/30 border-slate-700 text-slate-100' : 'bg-white border-[#dcd3c3] text-slate-800'}`}>
                            <span>{currentScore}</span>
                            <span className="text-[10px] opacity-40 font-normal">/100</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeltaScore(key, +5)}
                            className={`p-1 rounded border text-xs transition-colors ${isDark ? 'border-slate-700 bg-slate-800/60 text-slate-300' : 'border-[#dcd3c3] bg-white text-slate-700'}`}
                            title="+5 Artır"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Presets & Slider in one compact line */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Preset Chips */}
                        <div className={`flex items-center p-0.5 rounded-lg border ${isDark ? 'bg-[#161a22] border-slate-800' : 'bg-[#f4efe6] border-[#ded5c5]'}`}>
                          {def.presets.map(preset => {
                            const isActive = Math.abs(currentScore - preset.score) <= 12;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => handleApplyScore(key, preset.score, autoAdvance && activeMetrics.length === 1)}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                                  isActive
                                    ? (isDark ? 'bg-slate-700 text-white font-bold' : 'bg-[#334155] text-white font-bold')
                                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                                }`}
                                title={`${preset.desc} (${preset.score})`}
                              >
                                {preset.label} <span className="text-[9px] opacity-60">{preset.score}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Slider */}
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={currentScore}
                          onChange={(e) => handleApplyScore(key, parseInt(e.target.value) || 50, false)}
                          className="w-20 sm:w-28 cursor-pointer accent-slate-600 dark:accent-slate-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. SCENE LIST & COMBINED MULTI-METRIC TABLE */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter Toolbar */}
            <div className={`px-5 py-2 border-b flex items-center justify-between gap-3 text-xs shrink-0 ${borderSubtle}`}>
              {/* Tab Filters */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'all', label: `Tüm Sahneler (${sceneData.length})` },
                  { id: 'act1', label: '1. Perde' },
                  { id: 'act2', label: '2. Perde' },
                  { id: 'act3', label: '3. Perde' },
                  { id: 'climax', label: `Doruk Sahneler (80+)` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      actFilter === tab.id 
                        ? (isDark ? 'bg-slate-800 text-white font-semibold' : 'bg-[#e2d8c7] text-slate-900 font-semibold')
                        : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex items-center w-48 sm:w-60">
                <Search size={12} className="absolute left-2.5 opacity-40 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sahne veya karakter ara..."
                  className={`w-full pl-7 pr-2.5 py-1 rounded text-xs border outline-none transition-colors ${
                    isDark ? 'bg-[#12161f] border-slate-700/80 text-slate-200' : 'bg-white border-[#ded5c5] text-slate-800'
                  }`}
                />
              </div>
            </div>

            {/* List / Table Rows */}
            <div ref={sceneListRef} className="flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
              {filteredScenes.length === 0 ? (
                <div className="p-8 text-center opacity-50 text-xs">
                  Arama kriterlerine uygun sahne bulunamadı.
                </div>
              ) : (
                filteredScenes.map((s) => {
                  const isSelected = s.id === selectedSceneId;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSceneId(s.id)}
                      className={`px-5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected 
                          ? (isDark ? 'bg-white/[0.07]' : 'bg-black/[0.04]') 
                          : (isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]')
                      }`}
                    >
                      {/* Left: Number & Scene Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={`font-mono text-xs w-7 shrink-0 opacity-60 ${isSelected ? 'font-bold opacity-100' : ''}`}>
                          #{s.sceneNumber}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                              {s.title}
                            </span>
                            <span className="text-[10px] opacity-40 shrink-0 hidden sm:inline">
                              {s.act}
                            </span>
                          </div>
                          <div className="text-[11px] opacity-50 truncate mt-0.5">
                            <span>{s.location || 'Genel'}</span>
                            <span className="mx-1">•</span>
                            <span>~{s.approxPage}. Sayfa</span>
                            {s.characters.length > 0 && (
                              <>
                                <span className="mx-1">•</span>
                                <span className="truncate">{s.characters.join(', ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Scores & Sliders for each selected metric */}
                      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {activeMetrics.map(key => {
                          const def = getMetricDef(key);
                          const val = (s as any)[key] || 50;

                          return (
                            <div key={key} className="flex items-center gap-1.5 text-xs font-mono">
                              <span className="text-[11px] opacity-60 hidden md:inline" style={{ color: def.curveColor }}>
                                {def.shortLabel}:
                              </span>
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={val}
                                onChange={(e) => {
                                  const newVal = parseInt(e.target.value) || 50;
                                  setSelectedSceneId(s.id);
                                  handleApplyScore(key, newVal, false);
                                }}
                                className="w-14 sm:w-16 cursor-pointer accent-slate-600 dark:accent-slate-400"
                                title={`Sahne #${s.sceneNumber} ${def.label} Seviyesini Ayarla`}
                              />
                              <span className={`w-7 text-right font-bold text-xs ${isSelected ? 'opacity-100' : 'opacity-80'}`} style={{ color: def.curveColor }}>
                                {val}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 7. FOOTER (COMBINED EXPORTS & CLOSE) */}
          <div className={`px-5 py-2.5 border-t flex items-center justify-between gap-3 shrink-0 ${borderSubtle}`}>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportMD}
                disabled={sceneData.length === 0}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                  isDark ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300' : 'border-[#ded5c5] bg-white hover:bg-[#ebe3d5] text-slate-700'
                }`}
                title="Seçili tüm türlerin puanlarını içeren Markdown raporu indirir"
              >
                <FileText size={12} className="opacity-60" />
                <span>Markdown</span>
              </button>
              <button
                type="button"
                onClick={handleExportDOCX}
                disabled={sceneData.length === 0}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                  isDark ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300' : 'border-[#ded5c5] bg-white hover:bg-[#ebe3d5] text-slate-700'
                }`}
                title="Ritim grafiği ve seçili türlerin sütunlarını içeren Word (.docx) belgesi indirir"
              >
                <TableIcon size={12} className="opacity-60" />
                <span>Word (.docx)</span>
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={sceneData.length === 0}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                  isDark ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300' : 'border-[#ded5c5] bg-white hover:bg-[#ebe3d5] text-slate-700'
                }`}
                title="Seçili tüm türlerin grafiği ve çizelgesini PDF / Yazdır formatında açar"
              >
                <Download size={12} className="opacity-60" />
                <span>PDF / Yazdır</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isDark ? 'bg-slate-200 text-slate-900 hover:bg-white' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              Tamam
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
