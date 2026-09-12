import React, { useState, useEffect, useRef } from 'react';
import { Layers, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { topicService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import { TopicCluster, WordCloudWord } from '@/types';

interface TopicNode {
  id: string;
  word: WordCloudWord;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  topic: string;
}

interface TopicEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'topic' | 'document';
}

function computeTopicGraph(
  words: WordCloudWord[],
  viewWidth: number,
  viewHeight: number
): { nodes: TopicNode[]; edges: TopicEdge[] } {
  if (!words || words.length === 0) return { nodes: [], edges: [] };

  const maxCount = Math.max(...words.map((w) => w.weight ?? w.count ?? 1), 1);
  const minCount = Math.min(...words.map((w) => w.weight ?? w.count ?? 1), 1);
  const spread = Math.max(maxCount - minCount, 1);

  // Take top 32 words
  const sorted = [...words]
    .sort((a, b) => (b.weight ?? b.count ?? 0) - (a.weight ?? a.count ?? 0))
    .slice(0, 32);

  // Group by topic
  const topicGroups = new Map<string, WordCloudWord[]>();
  sorted.forEach((w) => {
    const top = w.topic || 'General Mining';
    if (!topicGroups.has(top)) {
      topicGroups.set(top, []);
    }
    topicGroups.get(top)!.push(w);
  });

  const topicsList = Array.from(topicGroups.keys());
  const numTopics = topicsList.length;

  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;
  const radiusX = Math.max(viewWidth * 0.32, 160);
  const radiusY = Math.max(viewHeight * 0.28, 100);

  const initialNodes: TopicNode[] = [];

  topicsList.forEach((topicName, tIdx) => {
    const angle = (tIdx / numTopics) * 2 * Math.PI - Math.PI / 2;
    const clusterX = centerX + radiusX * Math.cos(angle);
    const clusterY = centerY + radiusY * Math.sin(angle);

    const groupWords = topicGroups.get(topicName)!;
    groupWords.forEach((w, wIdx) => {
      const cnt = w.weight ?? w.count ?? 1;
      const normalized = (cnt - minCount) / spread;
      const fontSize = Math.round(11 + normalized * 14); // 11px to 25px

      // Color scheme
      let color = '#8B929E';
      if (wIdx === 0 && tIdx === 0) color = '#1F8A5C';
      else if (wIdx === 0 && tIdx === 1) color = '#2D9CA8';
      else if (wIdx === 0 && tIdx === 2) color = '#D9A441';
      else if (normalized > 0.6) color = '#E8EAED';

      const textLen = w.text.length;
      const width = Math.max(Math.ceil(textLen * (fontSize * 0.58) + 24), 54);
      const height = Math.ceil(fontSize + 14);

      // Distribute words in cluster around cluster center
      let nodeX: number;
      let nodeY: number;
      if (wIdx === 0) {
        nodeX = clusterX;
        nodeY = clusterY;
      } else {
        const itemAngle = angle + (wIdx * 1.35);
        const itemRadius = 38 + (wIdx * 20);
        nodeX = clusterX + itemRadius * Math.cos(itemAngle);
        nodeY = clusterY + (itemRadius * 0.75) * Math.sin(itemAngle);
      }

      // Clamp inside SVG view area
      nodeX = Math.max(width / 2 + 12, Math.min(viewWidth - width / 2 - 12, nodeX));
      nodeY = Math.max(height / 2 + 12, Math.min(viewHeight - height / 2 - 12, nodeY));

      initialNodes.push({
        id: w.raw_term || w.text,
        word: w,
        x: Math.round(nodeX),
        y: Math.round(nodeY),
        width,
        height,
        fontSize,
        color,
        topic: topicName,
      });
    });
  });

  // Soft collision resolution passes (15 iterations)
  for (let iter = 0; iter < 15; iter++) {
    for (let i = 0; i < initialNodes.length; i++) {
      for (let j = i + 1; j < initialNodes.length; j++) {
        const na = initialNodes[i];
        const nb = initialNodes[j];
        const dx = nb.x - na.x;
        const dy = nb.y - na.y;
        const minDistX = (na.width + nb.width) / 2 + 8;
        const minDistY = (na.height + nb.height) / 2 + 6;

        if (Math.abs(dx) < minDistX && Math.abs(dy) < minDistY) {
          const overlapX = minDistX - Math.abs(dx);
          const overlapY = minDistY - Math.abs(dy);
          const shiftX = (dx === 0 ? 1 : Math.sign(dx)) * overlapX * 0.45;
          const shiftY = (dy === 0 ? 1 : Math.sign(dy)) * overlapY * 0.45;

          na.x = Math.max(na.width / 2 + 10, Math.min(viewWidth - na.width / 2 - 10, na.x - shiftX));
          na.y = Math.max(na.height / 2 + 10, Math.min(viewHeight - na.height / 2 - 10, na.y - shiftY));
          nb.x = Math.max(nb.width / 2 + 10, Math.min(viewWidth - nb.width / 2 - 10, nb.x + shiftX));
          nb.y = Math.max(nb.height / 2 + 10, Math.min(viewHeight - nb.height / 2 - 10, nb.y + shiftY));
        }
      }
    }
  }

  // Derive real relationship edges only from existing data
  const edges: TopicEdge[] = [];
  const edgeSet = new Set<string>();

  // 1. Connect words belonging to the same non-empty topic
  topicsList.forEach((topicName) => {
    const group = initialNodes.filter((n) => n.topic === topicName);
    if (group.length > 1) {
      const hub = group[0];
      for (let i = 1; i < group.length; i++) {
        const edgeKey = `${hub.id}__${group[i].id}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            id: edgeKey,
            sourceId: hub.id,
            targetId: group[i].id,
            type: 'topic',
          });
        }
      }
    }
  });

  // 2. Connect words that share common source documents (co-occurrence)
  for (let i = 0; i < initialNodes.length; i++) {
    for (let j = i + 1; j < initialNodes.length; j++) {
      const na = initialNodes[i];
      const nb = initialNodes[j];
      if (na.topic === nb.topic) continue; // already connected via topic

      const docsA = na.word.documents || [];
      const docsB = nb.word.documents || [];
      const shared = docsA.filter((d) => docsB.includes(d));
      if (shared.length > 0) {
        const edgeKey = `${na.id}__${nb.id}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            id: edgeKey,
            sourceId: na.id,
            targetId: nb.id,
            type: 'document',
          });
        }
      }
    }
  }

  return { nodes: initialNodes, edges };
}

export const TopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<TopicCluster[]>([]);
  const [words, setWords] = useState<WordCloudWord[]>([]);
  const [subsidiary, setSubsidiary] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<WordCloudWord | null>(null);
  const [activeTab, setActiveTab] = useState<'cloud' | 'clusters'>('cloud');
  const [searchQuery, setSearchQuery] = useState('');

  // SVG Topic Map State
  const [nodes, setNodes] = useState<TopicNode[]>([]);
  const [edges, setEdges] = useState<TopicEdge[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    hasMoved: boolean;
  } | null>(null);

  const toast = useToast();

  const [svgDimensions, setSvgDimensions] = useState({ width: 680, height: 380 });

  useEffect(() => {
    loadTopicsAndCloud();
  }, [subsidiary]);

  const loadTopicsAndCloud = async () => {
    setLoading(true);
    try {
      const [topRes, cloudRes] = await Promise.allSettled([
        topicService.getTopics({ subsidiary: subsidiary || undefined }),
        topicService.getWordCloud({ subsidiary: subsidiary || undefined }),
      ]);

      if (topRes.status === 'fulfilled' && topRes.value?.topics) {
        setTopics(topRes.value.topics);
      }
      if (cloudRes.status === 'fulfilled' && cloudRes.value?.words) {
        const rawWords = cloudRes.value.words;
        setWords(rawWords);
        if (rawWords.length > 0 && !selectedTerm) {
          setSelectedTerm(rawWords[0]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading topics';
      toast.error('Topics Load Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Measure container and compute initial graph layout
  useEffect(() => {
    const updateDimensionsAndLayout = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(rect.width > 0 ? Math.floor(rect.width - 40) : 640, 480);
      const h = 380;
      setSvgDimensions({ width: w, height: h });

      if (words.length > 0) {
        const graph = computeTopicGraph(words, w, h);
        setNodes(graph.nodes);
        setEdges(graph.edges);
      }
    };

    updateDimensionsAndLayout();

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(rect.width > 0 ? Math.floor(rect.width - 40) : 640, 480);
      setSvgDimensions((prev) => (prev.width !== w ? { width: w, height: 380 } : prev));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [words]);

  const handleResetLayout = () => {
    const graph = computeTopicGraph(words, svgDimensions.width, svgDimensions.height);
    setNodes(graph.nodes);
    setEdges(graph.edges);
  };

  // Pointer event handlers for node dragging and clicking
  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    dragRef.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      origX: node.x,
      origY: node.y,
      hasMoved: false,
    };
    setDraggingNodeId(nodeId);
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = svgDimensions.width / rect.width;
    const scaleY = svgDimensions.height / rect.height;

    const deltaX = (e.clientX - dragRef.current.startX) * scaleX;
    const deltaY = (e.clientY - dragRef.current.startY) * scaleY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      dragRef.current.hasMoved = true;
    }

    const nodeId = dragRef.current.nodeId;
    const origX = dragRef.current.origX;
    const origY = dragRef.current.origY;

    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.id === nodeId) {
          const nextX = Math.max(
            n.width / 2 + 8,
            Math.min(svgDimensions.width - n.width / 2 - 8, origX + deltaX)
          );
          const nextY = Math.max(
            n.height / 2 + 8,
            Math.min(svgDimensions.height - n.height / 2 - 8, origY + deltaY)
          );
          return { ...n, x: Math.round(nextX), y: Math.round(nextY) };
        }
        return n;
      })
    );
  };

  const handleSvgPointerUp = () => {
    dragRef.current = null;
    setDraggingNodeId(null);
  };

  const handleNodeClick = (node: TopicNode) => {
    if (dragRef.current && dragRef.current.hasMoved) return;
    setSelectedTerm(node.word);
  };

  // Node Map lookup for lines
  const nodeMap = new Map<string, TopicNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Neighbors of hovered node
  const connectedNodeIds = new Set<string>();
  if (hoveredNodeId) {
    connectedNodeIds.add(hoveredNodeId);
    edges.forEach((e) => {
      if (e.sourceId === hoveredNodeId) connectedNodeIds.add(e.targetId);
      if (e.targetId === hoveredNodeId) connectedNodeIds.add(e.sourceId);
    });
  }

  const filteredWords = words.filter((w) =>
    searchQuery ? w.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header & Filter Controls */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(31, 138, 92, 0.1)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Geological & Mining Topic Discovery
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Empirical TF-IDF keyword clusters and term frequency distributions linked directly to source documents.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Tab Selector */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface-2)',
              borderRadius: 'var(--radius-sm)',
              padding: 2,
              border: '1px solid var(--border-hairline)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('cloud')}
              className={`btn btn-sm ${activeTab === 'cloud' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: 11 }}
            >
              Strata Word Cloud
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clusters')}
              className={`btn btn-sm ${activeTab === 'clusters' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: 11 }}
            >
              Domain Clusters ({topics.length})
            </button>
          </div>

          <select
            value={subsidiary}
            onChange={(e) => setSubsidiary(e.target.value)}
            className="input-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
          >
            <option value="">All CIL Subsidiaries</option>
            <option value="ECL">Eastern Coalfields (ECL)</option>
            <option value="BCCL">Bharat Coking Coal (BCCL)</option>
            <option value="CCL">Central Coalfields (CCL)</option>
            <option value="WCL">Western Coalfields (WCL)</option>
            <option value="SECL">South Eastern Coalfields (SECL)</option>
            <option value="MCL">Mahanadi Coalfields (MCL)</option>
            <option value="NCL">Northern Coalfields (NCL)</option>
            <option value="CMPDI">CMPDI Corporate</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadTopicsAndCloud}
            loading={loading}
            icon={<RefreshCw size={13} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {words.length === 0 && !loading ? (
        <EmptyState
          type="topics"
          title="No Mining Topics Extracted Yet"
          description="Upload geological or production reports in the Document Center to extract semantic topic clusters and term clouds."
        />
      ) : activeTab === 'cloud' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: 24 }}>
          {/* Left: Crisp Interactive SVG Topic Map */}
          <div
            ref={containerRef}
            className="card-level-1"
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div className="card-header-clean">
              <div>
                <h3 className="card-title">Interactive Keyword Strata Topic Map</h3>
                <span className="card-subtitle">
                  Crisp vector topic nodes with real data links. Drag nodes to explore or click to inspect.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetLayout}
                  icon={<RotateCcw size={12} />}
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >
                  Reset Layout
                </Button>
                <Badge variant="teal">{words.length} TERMS INDEXED</Badge>
              </div>
            </div>

            {/* SVG Interactive Topic Map Container */}
            <div
              style={{
                position: 'relative',
                minHeight: 380,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                overflow: 'hidden',
                userSelect: 'none',
              }}
            >
              {loading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Computing TF-IDF vector matrix...</div>
              ) : (
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
                  style={{
                    width: '100%',
                    height: `${svgDimensions.height}px`,
                    display: 'block',
                    cursor: draggingNodeId ? 'grabbing' : 'default',
                  }}
                  onPointerMove={handleSvgPointerMove}
                  onPointerUp={handleSvgPointerUp}
                  onPointerCancel={handleSvgPointerUp}
                >
                  <defs>
                    <radialGradient id="mapBgGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(31, 138, 92, 0.05)" />
                      <stop offset="100%" stopColor="rgba(31, 138, 92, 0)" />
                    </radialGradient>
                  </defs>

                  {/* Background Radial Glow */}
                  <rect
                    x="0"
                    y="0"
                    width={svgDimensions.width}
                    height={svgDimensions.height}
                    fill="url(#mapBgGlow)"
                  />

                  {/* Geological Strata Contour Lines in Background */}
                  {[60, 130, 200, 270, 340].map((y, idx) => (
                    <path
                      key={idx}
                      d={`M 0,${y} C ${svgDimensions.width * 0.3},${y - 15} ${svgDimensions.width * 0.7},${y + 20} ${svgDimensions.width},${y - 5}`}
                      stroke="rgba(255, 255, 255, 0.035)"
                      strokeWidth="1"
                      fill="none"
                    />
                  ))}

                  {/* Connected Relation Lines between related nodes */}
                  {edges.map((edge) => {
                    const sourceNode = nodeMap.get(edge.sourceId);
                    const targetNode = nodeMap.get(edge.targetId);
                    if (!sourceNode || !targetNode) return null;

                    const isHovered =
                      hoveredNodeId === edge.sourceId || hoveredNodeId === edge.targetId;
                    const isSelected =
                      selectedTerm?.text === sourceNode.word.text ||
                      selectedTerm?.text === targetNode.word.text;

                    let strokeColor = 'rgba(255, 255, 255, 0.08)';
                    let strokeWidth = 1;
                    let strokeDasharray: string | undefined =
                      edge.type === 'document' ? '3 3' : undefined;

                    if (isHovered) {
                      strokeColor = 'var(--accent-primary)';
                      strokeWidth = 2;
                    } else if (hoveredNodeId) {
                      strokeColor = 'rgba(255, 255, 255, 0.02)';
                      strokeWidth = 0.8;
                    } else if (isSelected) {
                      strokeColor = 'rgba(31, 138, 92, 0.5)';
                      strokeWidth = 1.5;
                    }

                    return (
                      <line
                        key={edge.id}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeLinecap="round"
                        style={{
                          transition: draggingNodeId ? 'none' : 'stroke 0.15s ease, stroke-width 0.15s ease',
                          pointerEvents: 'none',
                        }}
                      />
                    );
                  })}

                  {/* Topic Nodes (Crisp Vector Pills + Text) */}
                  {nodes.map((node) => {
                    const isSelected = selectedTerm?.text === node.word.text;
                    const isHovered = hoveredNodeId === node.id;
                    const isNeighbor = connectedNodeIds.has(node.id);
                    const isDimmed = Boolean(hoveredNodeId && !isHovered && !isNeighbor);

                    let fillColor = 'rgba(24, 28, 34, 0.92)';
                    let strokeColor = 'rgba(255, 255, 255, 0.1)';
                    let strokeWidth = 1;
                    let textColor = node.color;
                    let opacity = 1;

                    if (isSelected) {
                      fillColor = 'rgba(31, 138, 92, 0.2)';
                      strokeColor = '#1F8A5C';
                      strokeWidth = 1.8;
                      textColor = '#1F8A5C';
                    }

                    if (isHovered) {
                      fillColor = 'rgba(31, 138, 92, 0.28)';
                      strokeColor = '#2D9CA8';
                      strokeWidth = 2;
                      textColor = '#FFFFFF';
                    } else if (isNeighbor && hoveredNodeId) {
                      fillColor = 'rgba(45, 156, 168, 0.14)';
                      strokeColor = 'rgba(45, 156, 168, 0.6)';
                      strokeWidth = 1.4;
                    }

                    if (isDimmed) {
                      opacity = 0.35;
                    }

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`}
                        onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                        onClick={() => handleNodeClick(node)}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        style={{
                          cursor: draggingNodeId === node.id ? 'grabbing' : 'grab',
                          opacity,
                          transition: draggingNodeId ? 'opacity 0.15s ease' : 'all 0.15s ease',
                        }}
                      >
                        {/* Pill Background */}
                        <rect
                          x="0"
                          y="0"
                          width={node.width}
                          height={node.height}
                          rx={4}
                          ry={4}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                        />

                        {/* Crisp Vector Text */}
                        <text
                          x={node.width / 2}
                          y={node.height / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={textColor}
                          fontSize={node.fontSize}
                          fontWeight={600}
                          style={{
                            fontFamily: 'var(--font-ui)',
                            pointerEvents: 'none',
                            userSelect: 'none',
                          }}
                        >
                          {node.word.text}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Selected Term Detail Card */}
            {selectedTerm && (
              <div
                style={{
                  marginTop: 16,
                  padding: '14px 18px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-hairline-alt)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      className="text-mono"
                      style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-primary)' }}
                    >
                      {selectedTerm.text}
                    </span>
                    <Badge variant="primary">
                      {selectedTerm.weight ?? selectedTerm.count} occurrences
                    </Badge>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Associated Domain: <strong style={{ color: 'var(--text-primary)' }}>{selectedTerm.topic || 'Mining Operations'}</strong>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Linked to {selectedTerm.documents?.length || 1} verified source documents
                </div>
              </div>
            )}
          </div>

          {/* Right: Ranked Term-Frequency Distribution List */}
          <div
            className="card-level-1"
            style={{ display: 'flex', flexDirection: 'column', maxHeight: 540 }}
          >
            <div className="card-header-clean">
              <div>
                <h3 className="card-title">Ranked Term Frequency</h3>
                <span className="card-subtitle">By Occurrence Weight</span>
              </div>
              <Badge variant="slate">{filteredWords.length} ITEMS</Badge>
            </div>

            {/* Search Filter */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter extracted terms..."
                className="input-text"
                style={{ padding: '6px 10px', fontSize: 12 }}
              />
            </div>

            <div
              style={{
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                paddingRight: 4,
              }}
            >
              {filteredWords.map((w, idx) => {
                const isSelected = selectedTerm?.text === w.text;
                const count = w.weight ?? w.count ?? 1;
                return (
                  <div
                    key={w.raw_term || w.text}
                    onClick={() => setSelectedTerm(w)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: isSelected ? 'rgba(31, 138, 92, 0.1)' : 'var(--bg-surface-2)',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-hairline)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-muted)', width: 20 }}>
                        #{idx + 1}
                      </span>
                      <strong style={{ fontSize: 12, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {w.text}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {w.topic ? w.topic.split(' ')[0] : 'Mining'}
                      </span>
                      <span
                        className="text-mono"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '1px 6px',
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-hairline)',
                          color: idx < 3 ? 'var(--accent-primary)' : 'var(--text-primary)',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Domain Topic Clusters (TF-IDF N-Grams) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          {topics.map((top) => (
            <div key={top.topic_name} className="card-level-1">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {top.topic_name}
                </h4>
                <Badge variant="primary">{top.frequency} CHUNKS</Badge>
              </div>

              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Keywords:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {top.keywords.map((kw) => (
                    <Badge key={kw} variant="slate">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Related Documents ({top.related_documents?.length || 0}):
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                  {top.related_documents?.slice(0, 3).map((d) => (
                    <div
                      key={d}
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      • {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
