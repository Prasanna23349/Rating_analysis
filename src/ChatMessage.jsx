// src/ChatMessage.jsx
import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
// We keep all your imports
import { FileText, BarChart2, Sparkles, PieChart, Activity, Grid, Download, Maximize2, X } from 'lucide-react';

// --- 1. TYPEWRITER COMPONENT ---
const Typewriter = ({ text, speed = 5 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText(''); 
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index === text.length) clearInterval(intervalId);
    }, speed);
    return () => clearInterval(intervalId);
  }, [text, speed]);

  return (
    <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
      {displayedText}
      <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-indigo-500 animate-pulse"></span>
    </p>
  );
};

// --- 2. MAIN CHAT COMPONENT ---
const ChatMessage = ({ message }) => {
  const [activeTab, setActiveTab] = useState('text');
  const [chartType, setChartType] = useState('bar');
  const [isExpanded, setIsExpanded] = useState(false); // New: State for Full Screen
  const plotRef = useRef(null); // New: Ref to handle downloads

  const isBot = message.role === 'bot';
  const hasData = message.data && message.data.length > 0;

  useEffect(() => {
    if (hasData) {
      const years = [...new Set(message.data.map(r => r.year))];
      const companies = [...new Set(message.data.map(r => r.marketing_name))];
      const measures = [...new Set(message.data.map(r => r.measure_name))];

      if (years.length > 1) setChartType('line');
      else if (companies.length > 2 && measures.length > 2) setChartType('heatmap');
      else setChartType('bar');
    }
  }, [message.data, hasData]);

  // --- NEW: Download Function ---
  const handleDownload = () => {
    // This triggers the built-in Plotly download
    const plotDiv = document.querySelector('.js-plotly-plot'); 
    if (plotDiv && plotDiv.data) {
       // A workaround since direct ref access to downloadImage can be tricky in React wrapper
       alert("To download: Hover over the graph and click the Camera icon in the top right toolbar.");
    }
  };

  const renderChart = () => {
    if (!hasData) return null;
    
    const apiData = message.data;
    const companies = [...new Set(apiData.map(r => r.marketing_name))];
    const measures = [...new Set(apiData.map(r => r.measure_name))];
    
    // --- DYNAMIC HEIGHT CALCULATION ---
    let dynamicHeight = 400;
    if (companies.length > 10 || measures.length > 10) {
      dynamicHeight = 550; 
    }
    // If expanded, force full screen height
    if (isExpanded) dynamicHeight = 600;

    let plotData = [];
    
    // Base Layout
    let layout = {
      autosize: true, 
      height: dynamicHeight, 
      margin: { l: 50, r: 20, t: 60, b: 120 },
      font: { size: 11, color: '#64748b', family: 'Inter, sans-serif' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      showlegend: true,
      legend: { orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center' },
      xaxis: { 
        automargin: true,
        tickangle: -45,  
        title: { standoff: 20 }
      }
    };

    if (chartType === 'line') {
      plotData = companies.map(company => {
        const companyData = apiData.filter(r => r.marketing_name === company);
        return {
          x: companyData.map(r => r.year),
          y: companyData.map(r => r.star_rating_numeric),
          name: company,
          mode: 'lines+markers',
          type: 'scatter',
          line: { width: 3, shape: 'spline' }
        };
      });
      layout.title = 'Performance Trend';
    } else if (chartType === 'bar') {
      plotData = companies.map(company => {
        const companyData = apiData.filter(r => r.marketing_name === company);
        return {
          x: companyData.map(r => r.measure_name),
          y: companyData.map(r => r.star_rating_numeric),
          name: company,
          type: 'bar',
          marker: { opacity: 0.9, line: { width: 0 } }
        };
      });
      layout.title = 'Rating Comparison';
      layout.barmode = 'group';
    } else if (chartType === 'heatmap') {
      const zValues = measures.map(m => {
        return companies.map(c => {
          const record = apiData.find(r => r.measure_name === m && r.marketing_name === c);
          return record ? record.star_rating_numeric : null;
        });
      });
      plotData = [{
        z: zValues, x: companies, y: measures,
        type: 'heatmap', colorscale: 'Viridis', showscale: true
      }];
      layout.title = 'Heatmap Overview';
      layout.margin.l = 180;
    } else if (chartType === 'pie') {
      const ratings = apiData.map(r => Math.round(r.star_rating_numeric || 0));
      const counts = {};
      ratings.forEach(r => counts[r + ' Stars'] = (counts[r + ' Stars'] || 0) + 1);
      plotData = [{
        labels: Object.keys(counts), values: Object.values(counts),
        type: 'pie', hole: 0.5,
        marker: { colors: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'] }
      }];
      layout.title = 'Rating Distribution';
    }

    return (
      <div className="w-full h-full relative" style={{ height: dynamicHeight }}>
        <Plot
          ref={plotRef}
          data={plotData}
          layout={layout}
          config={{ displayModeBar: true, responsive: true, displaylogo: false }} // Enabled ModeBar for Download
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true} 
        />
      </div>
    );
  };

  return (
    // Added 'z-50' when expanded to pop over everything
    <div className={`flex w-full mb-8 animate-fade-in ${isBot ? 'justify-start' : 'justify-end'} ${isExpanded ? 'fixed inset-0 z-50 bg-black/50 items-center justify-center p-4 backdrop-blur-sm' : ''}`}>
      
      {/* Bot Avatar (Hidden in Full Screen Mode) */}
      {isBot && !isExpanded && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 mr-4 flex-shrink-0 mt-1 ring-2 ring-white z-10">
          <Sparkles size={18} strokeWidth={2} />
        </div>
      )}

      {/* Main Container */}
      <div className={`flex flex-col ${isBot ? 'w-full max-w-full' : 'max-w-[85%] md:max-w-2xl items-end'} ${isExpanded ? 'w-full max-w-5xl h-auto' : ''}`}>
        
        {!isExpanded && (
          <span className={`text-[11px] font-bold text-slate-400 mb-1.5 ml-1 tracking-wider uppercase`}>
            {isBot ? 'Medicare AI Analysis' : 'You'}
          </span>
        )}

        {/* Bubble */}
        <div className={`relative p-0 overflow-hidden shadow-sm transition-all duration-300 group
          ${isBot 
            ? 'bg-white border border-gray-200/60 rounded-2xl rounded-tl-none w-full' 
            : 'bg-indigo-600 text-white rounded-2xl rounded-tr-none shadow-indigo-500/30 px-5 py-3' 
          } ${isExpanded ? 'rounded-2xl shadow-2xl border-none ring-1 ring-white/20' : ''}`}>
          
          {/* Header */}
          {isBot && hasData && (
            <div className="flex items-center justify-between bg-slate-50/50 border-b border-slate-100 px-4 py-2">
               <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                  <button onClick={() => setActiveTab('text')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'text' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                    <FileText size={14} /> Report
                  </button>
                  <button onClick={() => setActiveTab('graph')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'graph' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                    <BarChart2 size={14} /> Visuals
                  </button>
               </div>
               
               <div className="flex items-center gap-2">
                 {/* ADDED: Maximize / Minimize Button */}
                 <button 
                   onClick={() => setIsExpanded(!isExpanded)} 
                   className="text-slate-400 hover:text-indigo-600 transition p-1 hover:bg-slate-100 rounded"
                   title={isExpanded ? "Close Full Screen" : "Expand Graph"}
                 >
                   {isExpanded ? <X size={18} /> : <Maximize2 size={16}/>}
                 </button>
                 
                 {/* ADDED: Download Button */}
                 <button 
                   onClick={handleDownload} 
                   className="text-slate-400 hover:text-indigo-600 transition p-1 hover:bg-slate-100 rounded"
                   title="Download Graph"
                 >
                   <Download size={16}/>
                 </button>
               </div>
            </div>
          )}

          {/* Content */}
          <div className={`${isBot ? 'p-5' : ''} w-full`}>
            
            {(activeTab === 'text' || !isBot) && !isExpanded && (
              isBot ? <Typewriter text={message.text} speed={5} /> : <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
            )}

            {(activeTab === 'graph' || isExpanded) && hasData && (
              <div className="mt-2 w-full animate-fade-in">
                
                {/* Toolbar */}
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => setChartType('bar')} className={`p-2 rounded-md transition ${chartType === 'bar' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><BarChart2 size={18}/></button>
                      <button onClick={() => setChartType('line')} className={`p-2 rounded-md transition ${chartType === 'line' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><Activity size={18}/></button>
                      <button onClick={() => setChartType('heatmap')} className={`p-2 rounded-md transition ${chartType === 'heatmap' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><Grid size={18}/></button>
                      <button onClick={() => setChartType('pie')} className={`p-2 rounded-md transition ${chartType === 'pie' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><PieChart size={18}/></button>
                  </div>
                </div>

                {/* GRAPH CONTAINER */}
                <div className="w-full border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
                  {renderChart()}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;