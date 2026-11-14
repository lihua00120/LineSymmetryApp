import React, { useState, useRef, useEffect } from 'react';
import { MousePointer2, CheckCircle2, XCircle, RotateCcw, Trash2, ArrowRight, Lightbulb, PenTool, PlayCircle, Star, Target, Edit3 } from 'lucide-react';

const GRID_SIZE = 12;

// --- Utility Functions ---

const getGridCoords = (e, svgRef) => {
  if (!svgRef.current) return null;
  const svg = svgRef.current;
  const pt = svg.createSVGPoint();
  if (e.touches && e.touches.length > 0) {
    pt.x = e.touches[0].clientX;
    pt.y = e.touches[0].clientY;
  } else {
    pt.x = e.clientX;
    pt.y = e.clientY;
  }
  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
  return {
    x: Math.max(0, Math.min(GRID_SIZE, Math.round(svgP.x))),
    y: Math.max(0, Math.min(GRID_SIZE, Math.round(svgP.y)))
  };
};

const getMirror = (p, axisType = 'vertical', axisPos = 6) => {
  if (axisType === 'vertical') {
    return { x: axisPos + (axisPos - p.x), y: p.y };
  } else {
    return { x: p.x, y: axisPos + (axisPos - p.y) };
  }
};

const arePointsEqual = (p1, p2) => p1.x === p2.x && p1.y === p2.y;

// --- Shared UI Components ---

const SvgGrid = ({ axisType = 'vertical', axisPos = 6 }) => {
  const lines = [];
  for (let i = 0; i <= GRID_SIZE; i++) {
    lines.push(<line key={`h${i}`} x1="0" y1={i} x2={GRID_SIZE} y2={i} stroke="#e5e7eb" strokeWidth="0.05" />);
    lines.push(<line key={`v${i}`} x1={i} y1="0" x2={i} y2={GRID_SIZE} stroke="#e5e7eb" strokeWidth="0.05" />);
  }
  return (
    <g>
      {lines}
      {axisType === 'vertical' ? (
        <line x1={axisPos} y1="0" x2={axisPos} y2={GRID_SIZE} stroke="#ef4444" strokeWidth="0.15" />
      ) : (
        <line x1="0" y1={axisPos} x2={GRID_SIZE} y2={axisPos} stroke="#ef4444" strokeWidth="0.15" />
      )}
    </g>
  );
};

const Feedback = ({ msg }) => (
  <div className={`p-4 rounded-xl border-2 font-bold text-center mb-4 transition-colors flex items-center justify-center gap-2 shadow-sm ${
    msg.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' :
    msg.type === 'success' ? 'bg-green-50 border-green-300 text-green-700' :
    'bg-blue-50 border-blue-300 text-blue-700'
  }`}>
    {msg.type === 'error' && <XCircle className="w-5 h-5" />}
    {msg.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
    {msg.type === 'info' && <Lightbulb className="w-5 h-5" />}
    {msg.text}
  </div>
);

const ShapePolygon = ({ points, color, strokeColor, closed = true }) => {
  if (points.length === 0) return null;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + (closed && points.length > 2 ? ' Z' : '');
  return (
    <g>
      <path d={d} fill={closed ? color : "none"} stroke={strokeColor} strokeWidth="0.15" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="0.2" fill={strokeColor} />
      ))}
    </g>
  );
};

const PathLine = ({ points, strokeColor, closed = false, fill = "none" }) => {
  if (points.length === 0) return null;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + (closed ? ' Z' : '');
  return <path d={d} fill={closed ? fill : "none"} stroke={strokeColor} strokeWidth="0.15" strokeLinejoin="round" />;
};


// --- Tab 1: Tutorial Demo ---

const DemoTab = () => {
  const originalShape = [{x: 2, y: 3}, {x: 4, y: 7}, {x: 2, y: 9}];
  const svgRef = useRef(null);
  
  const [phase, setPhase] = useState('plot'); // 'plot', 'connect', 'done'
  const [targetIndex, setTargetIndex] = useState(0);
  const [plottedPoints, setPlottedPoints] = useState([]);
  const [connectedPoints, setConnectedPoints] = useState([]);
  const [msg, setMsg] = useState({ text: '步驟一：數格子。你看發亮的點距離紅線有幾格？請在對面相同距離畫點！', type: 'info' });

  const handlePointerDown = (e) => {
    const pt = getGridCoords(e, svgRef);
    if (!pt) return;

    if (phase === 'plot') {
      const origPt = originalShape[targetIndex];
      const expected = getMirror(origPt, 'vertical', 6);
      
      if (arePointsEqual(pt, expected)) {
        const nextIdx = targetIndex + 1;
        setPlottedPoints([...plottedPoints, pt]);
        if (nextIdx === originalShape.length) {
          setPhase('connect');
          setMsg({ text: '步驟三：描線。點都找齊了！現在請依照原本圖形的順序，把它們連起來。', type: 'success' });
        } else {
          setTargetIndex(nextIdx);
          setMsg({ text: '步驟二：畫點答對了！繼續找下一個點的對應位置。', type: 'success' });
        }
      } else {
        const dist = Math.abs(origPt.x - 6);
        setMsg({ text: `再數一次！原本的點距離對稱軸有 ${dist} 格喔。`, type: 'error' });
      }
    } else if (phase === 'connect') {
      const expectedIdx = connectedPoints.length;
      const expectedPt = plottedPoints[expectedIdx];
      
      if (arePointsEqual(pt, expectedPt)) {
        const newConnected = [...connectedPoints, pt];
        setConnectedPoints(newConnected);
        if (newConnected.length === plottedPoints.length) {
          setPhase('done');
          setMsg({ text: '恭喜完成線對稱圖形！這就是完整的鏡像圖形。', type: 'success' });
        } else {
          setMsg({ text: '很好！請繼續連接下一個點。', type: 'info' });
        }
      } else {
        setMsg({ text: '請按照原圖形頂點的順序來連線喔！', type: 'error' });
      }
    }
  };

  const handleReset = () => {
    setPhase('plot');
    setTargetIndex(0);
    setPlottedPoints([]);
    setConnectedPoints([]);
    setMsg({ text: '步驟一：數格子。你看發亮的點距離紅線有幾格？請在對面相同距離畫點！', type: 'info' });
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in">
      <Feedback msg={msg} />
      
      <div className="mb-4">
        <button onClick={handleReset} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-bold shadow flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> 重新示範
        </button>
      </div>

      <svg ref={svgRef} onPointerDown={handlePointerDown} viewBox="-1 -1 14 14" className="w-full max-w-md bg-white rounded-lg shadow-inner border-2 border-gray-300 touch-none cursor-crosshair">
        <SvgGrid />
        
        {/* Original Shape */}
        <ShapePolygon points={originalShape} color="rgba(59, 130, 246, 0.2)" strokeColor="#3b82f6" />
        
        {/* Distance Helper */}
        {phase === 'plot' && (
          <g>
            <circle cx={originalShape[targetIndex].x} cy={originalShape[targetIndex].y} r="0.4" fill="none" stroke="#f59e0b" strokeWidth="0.1" className="animate-ping" />
            <line 
              x1={originalShape[targetIndex].x} y1={originalShape[targetIndex].y} 
              x2={6} y2={originalShape[targetIndex].y} 
              stroke="#f59e0b" strokeWidth="0.1" strokeDasharray="0.2 0.2" 
            />
            <rect x="2.5" y={originalShape[targetIndex].y - 0.7} width="3" height="0.6" fill="white" opacity="0.8" rx="0.2"/>
            <text x="4" y={originalShape[targetIndex].y - 0.25} fontSize="0.4" fill="#d97706" textAnchor="middle" fontWeight="bold">
              距離 {Math.abs(originalShape[targetIndex].x - 6)} 格
            </text>
          </g>
        )}

        {/* Plotted Points */}
        {plottedPoints.map((p, i) => (
          <circle key={`plot-${i}`} cx={p.x} cy={p.y} r="0.25" fill="#10b981" />
        ))}
        {/* Connected Path */}
        <PathLine points={connectedPoints} strokeColor="#10b981" closed={phase === 'done'} fill="rgba(16, 185, 129, 0.2)" />
        {phase === 'connect' && connectedPoints.length > 0 && connectedPoints.map((p, i) => (
          <circle key={`conn-${i}`} cx={p.x} cy={p.y} r="0.25" fill="#10b981" />
        ))}
      </svg>
    </div>
  );
};


// --- Tab 2: Guided Practice ---

const PracticeTab = () => {
  const originalShape = [{x: 2, y: 3}, {x: 4, y: 5}, {x: 4, y: 8}, {x: 1, y: 10}];
  const svgRef = useRef(null);

  const [phase, setPhase] = useState('select'); // 'select', 'plot', 'connect', 'done'
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [plottedMap, setPlottedMap] = useState({}); // { origIndex: {x,y} }
  const [connectedSeq, setConnectedSeq] = useState([]);
  const [msg, setMsg] = useState({ text: '請先點擊左邊圖形上的一個藍色頂點，開始數格子！', type: 'info' });

  const handlePointerDown = (e) => {
    const pt = getGridCoords(e, svgRef);
    if (!pt) return;

    if (phase === 'select') {
      const idx = originalShape.findIndex(p => arePointsEqual(p, pt));
      if (idx !== -1) {
        if (plottedMap[idx]) {
          setMsg({ text: '這個點已經找過囉！請選其他還沒找過的藍色點。', type: 'error' });
        } else {
          setSelectedIdx(idx);
          setPhase('plot');
          const dist = Math.abs(originalShape[idx].x - 6);
          setMsg({ text: `數格子：這個點距離紅線 ${dist} 格。請在右邊找到對應點並點擊！`, type: 'info' });
        }
      } else {
        setMsg({ text: '請點擊圖形上的「頂點」(藍色的圓點)。', type: 'error' });
      }
    } else if (phase === 'plot') {
      const origPt = originalShape[selectedIdx];
      const expected = getMirror(origPt, 'vertical', 6);
      
      if (arePointsEqual(pt, expected)) {
        const newMap = { ...plottedMap, [selectedIdx]: pt };
        setPlottedMap(newMap);
        setSelectedIdx(null);
        
        if (Object.keys(newMap).length === originalShape.length) {
          setPhase('connect');
          setMsg({ text: '點都找齊了！最後一步：依照左邊原圖形的連線順序，把右邊的點連起來。', type: 'success' });
        } else {
          setPhase('select');
          setMsg({ text: '畫點成功！請點擊下一個左邊的藍色頂點。', type: 'success' });
        }
      } else {
        const dist = Math.abs(origPt.x - 6);
        setMsg({ text: `錯囉！原本的點距離紅線 ${dist} 格，另一邊也要 ${dist} 格喔。`, type: 'error' });
      }
    } else if (phase === 'connect') {
      const expectedIdx = connectedSeq.length;
      const expectedPt = plottedMap[expectedIdx];
      
      if (expectedPt && arePointsEqual(pt, expectedPt)) {
        const newSeq = [...connectedSeq, pt];
        setConnectedSeq(newSeq);
        if (newSeq.length === originalShape.length) {
          setPhase('done');
          setMsg({ text: '太厲害了！你完全掌握了三步驟，完成對稱圖形！', type: 'success' });
        }
      } else {
        setMsg({ text: '順序不對喔！請觀察左邊圖形的連接順序，依序點擊。', type: 'error' });
      }
    }
  };

  const handleReset = () => {
    setPhase('select');
    setSelectedIdx(null);
    setPlottedMap({});
    setConnectedSeq([]);
    setMsg({ text: '請先點擊左邊圖形上的一個藍色頂點，開始數格子！', type: 'info' });
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in">
      <Feedback msg={msg} />
      
      <div className="mb-4">
        <button onClick={handleReset} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-bold shadow flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> 重新開始
        </button>
      </div>

      <svg ref={svgRef} onPointerDown={handlePointerDown} viewBox="-1 -1 14 14" className="w-full max-w-md bg-white rounded-lg shadow-inner border-2 border-gray-300 touch-none cursor-crosshair">
        <SvgGrid />
        
        <ShapePolygon points={originalShape} color="rgba(59, 130, 246, 0.2)" strokeColor="#3b82f6" />
        
        {/* Highlight unselected original points in 'select' phase */}
        {phase === 'select' && originalShape.map((p, i) => (
          !plottedMap[i] && <circle key={`hl-${i}`} cx={p.x} cy={p.y} r="0.4" fill="none" stroke="#3b82f6" strokeWidth="0.1" className="animate-ping" />
        ))}

        {/* Show active distance line */}
        {phase === 'plot' && selectedIdx !== null && (
          <g>
            <circle cx={originalShape[selectedIdx].x} cy={originalShape[selectedIdx].y} r="0.3" fill="#f59e0b" />
            <line x1={originalShape[selectedIdx].x} y1={originalShape[selectedIdx].y} x2={6} y2={originalShape[selectedIdx].y} stroke="#f59e0b" strokeWidth="0.1" strokeDasharray="0.2 0.2" />
          </g>
        )}

        {/* Plotted Points */}
        {Object.values(plottedMap).map((p, i) => (
          <circle key={`plot-${i}`} cx={p.x} cy={p.y} r="0.25" fill="#10b981" />
        ))}

        {/* Connected Path */}
        <PathLine points={connectedSeq} strokeColor="#10b981" closed={phase === 'done'} fill="rgba(16, 185, 129, 0.2)" />
      </svg>
    </div>
  );
};


// --- Tab 3: Challenges ---

const ChallengeL1 = () => {
  const origShape = [{x: 2, y: 2}, {x: 5, y: 5}, {x: 2, y: 9}];
  const svgRef = useRef(null);
  
  const [phase, setPhase] = useState('plot');
  const [plotted, setPlotted] = useState([]);
  const [connected, setConnected] = useState([]);
  const [msg, setMsg] = useState({ text: '第一關：請運用三步驟，自己在右側點擊畫出對應點。畫完後點擊「檢查對應點」。', type: 'info' });

  const handlePointerDown = (e) => {
    const pt = getGridCoords(e, svgRef);
    if (!pt) return;

    if (phase === 'plot') {
      if (pt.x <= 6) {
        setMsg({ text: '對應點要畫在紅線的右邊喔！', type: 'error' });
        return;
      }
      if (plotted.some(p => arePointsEqual(p, pt))) {
        setPlotted(plotted.filter(p => !arePointsEqual(p, pt))); // toggle off
      } else {
        setPlotted([...plotted, pt]);
      }
    } else if (phase === 'connect') {
      const expectedIdx = connected.length;
      const origPt = origShape[expectedIdx];
      const expectedPt = getMirror(origPt, 'vertical', 6);
      
      if (arePointsEqual(pt, expectedPt)) {
        const newConnected = [...connected, pt];
        setConnected(newConnected);
        if (newConnected.length === origShape.length) {
          setPhase('done');
          setMsg({ text: '恭喜通過第一關！完美對稱！', type: 'success' });
        }
      } else {
        setMsg({ text: '請依照左邊圖形的頂點順序來連線。', type: 'error' });
      }
    }
  };

  const handleCheck = () => {
    if (plotted.length !== origShape.length) {
      setMsg({ text: `點的數量不對喔！圖形有 ${origShape.length} 個頂點。`, type: 'error' });
      return;
    }
    const expected = origShape.map(p => getMirror(p, 'vertical', 6));
    for (let ep of expected) {
      if (!plotted.some(p => arePointsEqual(p, ep))) {
        setMsg({ text: '有標錯的點喔！請仔細檢查每一個點距離對稱軸的格數。', type: 'error' });
        return;
      }
    }
    setPhase('connect');
    setMsg({ text: '點的位置全對！現在請把點依序連起來完成圖形。', type: 'success' });
  };

  const handleReset = () => {
    setPhase('plot');
    setPlotted([]);
    setConnected([]);
    setMsg({ text: '第一關：請運用三步驟，自己在右側點擊畫出對應點。畫完後點擊「檢查對應點」。', type: 'info' });
  };

  return (
    <div className="flex flex-col items-center">
      <Feedback msg={msg} />
      <div className="flex gap-4 mb-4">
        {phase === 'plot' && (
          <button onClick={handleCheck} className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-bold shadow flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> 檢查對應點
          </button>
        )}
        <button onClick={handleReset} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-bold shadow flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> 清除重來
        </button>
      </div>
      <svg ref={svgRef} onPointerDown={handlePointerDown} viewBox="-1 -1 14 14" className="w-full max-w-md bg-white rounded-lg shadow-inner border-2 border-gray-300 touch-none cursor-crosshair">
        <SvgGrid />
        <ShapePolygon points={origShape} color="rgba(59, 130, 246, 0.2)" strokeColor="#3b82f6" />
        {plotted.map((p, i) => <circle key={`p-${i}`} cx={p.x} cy={p.y} r="0.25" fill="#10b981" />)}
        <PathLine points={connected} strokeColor="#10b981" closed={phase === 'done'} fill="rgba(16, 185, 129, 0.2)" />
      </svg>
    </div>
  );
};

const ChallengeL2 = () => {
  const origShape = [{x: 2, y: 1}, {x: 6, y: 3}, {x: 10, y: 1}, {x: 8, y: 5}]; // horizontal axis at y=6
  const svgRef = useRef(null);
  const [phase, setPhase] = useState('plot');
  const [plotted, setPlotted] = useState([]);
  const [connected, setConnected] = useState([]);
  const [msg, setMsg] = useState({ text: '第二關：這次對稱軸是水平的！請在下方畫出對應點。', type: 'info' });

  const handlePointerDown = (e) => {
    const pt = getGridCoords(e, svgRef);
    if (!pt) return;

    if (phase === 'plot') {
      if (pt.y <= 6) {
        setMsg({ text: '對應點要畫在紅線的下方喔！', type: 'error' });
        return;
      }
      if (plotted.some(p => arePointsEqual(p, pt))) {
        setPlotted(plotted.filter(p => !arePointsEqual(p, pt)));
      } else {
        setPlotted([...plotted, pt]);
      }
    } else if (phase === 'connect') {
      const expectedIdx = connected.length;
      const expectedPt = getMirror(origShape[expectedIdx], 'horizontal', 6);
      if (arePointsEqual(pt, expectedPt)) {
        const newConnected = [...connected, pt];
        setConnected(newConnected);
        if (newConnected.length === origShape.length) {
          setPhase('done');
          setMsg({ text: '太棒了！進階水平對稱也難不倒你！', type: 'success' });
        }
      } else {
        setMsg({ text: '請依照上半部圖形的連接順序來連線喔！', type: 'error' });
      }
    }
  };

  const handleCheck = () => {
    if (plotted.length !== origShape.length) {
      setMsg({ text: `點的數量不對，應該要有 ${origShape.length} 個點。`, type: 'error' });
      return;
    }
    const expected = origShape.map(p => getMirror(p, 'horizontal', 6));
    for (let ep of expected) {
      if (!plotted.some(p => arePointsEqual(p, ep))) {
        setMsg({ text: '有標錯的點，記得計算點到「水平紅線」的距離！', type: 'error' });
        return;
      }
    }
    setPhase('connect');
    setMsg({ text: '對應點完全正確！請依序連線。', type: 'success' });
  };

  const handleReset = () => {
    setPhase('plot'); setPlotted([]); setConnected([]);
    setMsg({ text: '第二關：這次對稱軸是水平的！請在下方畫出對應點。', type: 'info' });
  };

  return (
    <div className="flex flex-col items-center">
      <Feedback msg={msg} />
      <div className="flex gap-4 mb-4">
        {phase === 'plot' && (
          <button onClick={handleCheck} className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-bold shadow flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> 檢查對應點
          </button>
        )}
        <button onClick={handleReset} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-bold shadow flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> 清除重來
        </button>
      </div>
      <svg ref={svgRef} onPointerDown={handlePointerDown} viewBox="-1 -1 14 14" className="w-full max-w-md bg-white rounded-lg shadow-inner border-2 border-gray-300 touch-none cursor-crosshair">
        <SvgGrid axisType="horizontal" />
        <ShapePolygon points={origShape} color="rgba(59, 130, 246, 0.2)" strokeColor="#3b82f6" />
        {plotted.map((p, i) => <circle key={`p-${i}`} cx={p.x} cy={p.y} r="0.25" fill="#10b981" />)}
        <PathLine points={connected} strokeColor="#10b981" closed={phase === 'done'} fill="rgba(16, 185, 129, 0.2)" />
      </svg>
    </div>
  );
};

const ChallengeL3 = () => {
  const svgRef = useRef(null);
  const [phase, setPhase] = useState('design'); // design, plot, connect, done
  const [origShape, setOrigShape] = useState([]);
  const [plotted, setPlotted] = useState([]);
  const [connected, setConnected] = useState([]);
  const [msg, setMsg] = useState({ text: '第三關創意挑戰：請先在紅線左邊，點擊設計出你專屬的半邊圖形！', type: 'info' });

  const handlePointerDown = (e) => {
    const pt = getGridCoords(e, svgRef);
    if (!pt) return;

    if (phase === 'design') {
      if (pt.x > 6) {
        setMsg({ text: '設計階段請在紅線左半邊畫圖喔！', type: 'error' });
        return;
      }
      setOrigShape([...origShape, pt]);
      setMsg({ text: '繼續點擊設計，完成後點擊「設計完成」。', type: 'info' });
    } else if (phase === 'plot') {
      if (pt.x <= 6) {
        setMsg({ text: '對應點要畫在紅線右邊。', type: 'error' });
        return;
      }
      if (plotted.some(p => arePointsEqual(p, pt))) {
        setPlotted(plotted.filter(p => !arePointsEqual(p, pt)));
      } else {
        setPlotted([...plotted, pt]);
      }
    } else if (phase === 'connect') {
      const expectedIdx = connected.length;
      const expectedPt = getMirror(origShape[expectedIdx], 'vertical', 6);
      if (arePointsEqual(pt, expectedPt)) {
        const newConnected = [...connected, pt];
        setConnected(newConnected);
        if (newConnected.length === origShape.length) {
          setPhase('done');
          setMsg({ text: '太厲害了！你完成了自己的創意線對稱圖形作品！', type: 'success' });
        }
      }
    }
  };

  const handleFinishDesign = () => {
    if (origShape.length < 3) {
      setMsg({ text: '至少需要 3 個頂點才能構成形狀喔！', type: 'error' });
      return;
    }
    setPhase('plot');
    setMsg({ text: '設計完成！現在請在右邊畫出它的對應點。', type: 'success' });
  };

  const handleCheck = () => {
    if (plotted.length !== origShape.length) {
      setMsg({ text: '點的數量跟左邊不一樣喔！', type: 'error' });
      return;
    }
    const expected = origShape.map(p => getMirror(p, 'vertical', 6));
    for (let ep of expected) {
      if (!plotted.some(p => arePointsEqual(p, ep))) {
        setMsg({ text: '有標錯位置的點，請再數一次格子檢查！', type: 'error' });
        return;
      }
    }
    setPhase('connect');
    setMsg({ text: '對應點完全正確！請把右邊的點依序連起來。', type: 'success' });
  };

  const handleReset = () => {
    setPhase('design'); setOrigShape([]); setPlotted([]); setConnected([]);
    setMsg({ text: '第三關創意挑戰：請先在紅線左邊，點擊設計出你專屬的半邊圖形！', type: 'info' });
  };

  return (
    <div className="flex flex-col items-center">
      <Feedback msg={msg} />
      <div className="flex gap-4 mb-4">
        {phase === 'design' && (
          <button onClick={handleFinishDesign} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> 設計完成
          </button>
        )}
        {phase === 'plot' && (
          <button onClick={handleCheck} className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-bold shadow flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> 檢查對應點
          </button>
        )}
        <button onClick={handleReset} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-bold shadow flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> 清除重來
        </button>
      </div>
      <svg ref={svgRef} onPointerDown={handlePointerDown} viewBox="-1 -1 14 14" className="w-full max-w-md bg-white rounded-lg shadow-inner border-2 border-gray-300 touch-none cursor-crosshair">
        <SvgGrid />
        <PathLine points={origShape} strokeColor="#3b82f6" closed={phase !== 'design'} fill="rgba(59, 130, 246, 0.2)" />
        {origShape.map((p, i) => <circle key={`o-${i}`} cx={p.x} cy={p.y} r="0.2" fill="#3b82f6" />)}
        
        {plotted.map((p, i) => <circle key={`p-${i}`} cx={p.x} cy={p.y} r="0.25" fill="#10b981" />)}
        <PathLine points={connected} strokeColor="#10b981" closed={phase === 'done'} fill="rgba(16, 185, 129, 0.2)" />
      </svg>
    </div>
  );
};

const ChallengeTab = () => {
  const [level, setLevel] = useState(1);
  return (
    <div className="w-full animate-in fade-in">
      <div className="flex justify-center gap-3 mb-6">
        {[1, 2, 3].map(l => (
          <button key={l} onClick={() => setLevel(l)} className={`px-5 py-2 rounded-full font-bold transition-all shadow-sm ${level === l ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'}`}>
            {l === 1 ? '第一關 (簡單)' : l === 2 ? '第二關 (進階)' : '第三關 (創意)'}
          </button>
        ))}
      </div>
      {level === 1 && <ChallengeL1 />}
      {level === 2 && <ChallengeL2 />}
      {level === 3 && <ChallengeL3 />}
    </div>
  );
};


// --- Main Shell ---

export default function App() {
  const [activeTab, setActiveTab] = useState('demo');

  const tabs = [
    { id: 'demo', label: '教學示範', icon: PlayCircle, color: 'blue' },
    { id: 'practice', label: '跟著練習', icon: Target, color: 'green' },
    { id: 'challenge', label: '挑戰區', icon: Star, color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12 selection:bg-blue-200">
      <header className="bg-white shadow-sm pt-8 pb-6 mb-8 border-b-4 border-blue-400">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-slate-800 tracking-tight">
          🎨 線對稱圖形<span className="text-blue-600">三步驟</span>教室
        </h1>
        <div className="flex justify-center gap-4 mt-4 text-sm sm:text-base font-bold text-slate-600">
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200">1. 數格子</span>
          <ArrowRight className="w-5 h-5 text-slate-400 self-center" />
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">2. 畫點</span>
          <ArrowRight className="w-5 h-5 text-slate-400 self-center" />
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">3. 描線</span>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  isActive 
                  ? `bg-${tab.color}-500 text-white shadow-lg shadow-${tab.color}-200 scale-105` 
                  : `bg-white text-slate-600 hover:bg-slate-100 shadow border border-slate-200`
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : `text-${tab.color}-500`}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-4 sm:p-8 min-h-[600px] flex justify-center">
          {activeTab === 'demo' && <DemoTab />}
          {activeTab === 'practice' && <PracticeTab />}
          {activeTab === 'challenge' && <ChallengeTab />}
        </div>
      </main>
    </div>
  );
}