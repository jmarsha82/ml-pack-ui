import React, { useMemo, useState } from 'react';
// Icons are imported as a namespace because catalog records select them by string name.
import * as Icons from 'lucide-react';
import { groups, taskById, buildDemoResult, formatFileSize, validateCsvFile } from './catalog';
import { downloadChartPng, downloadResultsCsv } from './export';

// Resolve a catalog icon name while using Circle as a safe fallback for future typos.
const Icon = ({name, size=17}) => { const C = Icons[name] || Icons.Circle; return <C size={size}/>; };

// Render grouped task navigation; App remains the sole owner of selection state.
function Sidebar({selected,onSelect,open,onClose}) {
  return <aside className={`sidebar ${open?'open':''}`}>
    <div className="brand"><span>mlpack</span><b>Studio</b><button onClick={onClose} aria-label="Close menu"><Icons.X/></button></div>
    <div className="nav-scroll"><button className="overview"><Icons.LayoutDashboard/> Overview</button>
      {groups.map(group=><section key={group.name}><h3>{group.name}</h3>{group.tasks.map(task=><button key={task.id} className={selected===task.id?'active':''} onClick={()=>onSelect(task.id)}><Icon name={task.icon}/><span>{task.name}</span>{selected===task.id&&<i/>}</button>)}</section>)}
    </div>
    <div className="side-foot"><Icons.Cpu/> C++ mlpack backend</div>
  </aside>
}

// Generate a practical control from a task field's position and semantic label.
function Field({label,index,task,uploadedFile,uploadError,onFileLoaded}) {
  // The first field is always the data source, so it becomes the accessible CSV picker.
  if (index===0) return <div className="field"><span>{label}</span><label className={`drop ${uploadedFile?'loaded':uploadError?'failed':''}`}>{uploadedFile?<Icons.CheckCircle2/>:uploadError?<Icons.CircleAlert/>:<Icons.UploadCloud/>}<b>{uploadedFile?'CSV loaded successfully':uploadError?'CSV could not be loaded':'Choose a CSV file'}</b><small>{uploadedFile?`${uploadedFile.name} · ${formatFileSize(uploadedFile.size)}`:(uploadError || 'or drag it here')}</small>{uploadedFile&&<em>Click to replace file</em>}<input aria-label={label} type="file" accept=".csv,text/csv" onChange={event=>onFileLoaded(event.target.files?.[0] || null)}/></label>{!uploadedFile&&<button className="sample-data" type="button" onClick={()=>onFileLoaded(new File(['sepal_length,sepal_width,species\n5.1,3.5,setosa'], 'iris_sample.csv', {type:'text/csv'}))}>Use sample CSV</button>}</div>;
  // Quantity-like labels receive editable defaults suitable for a first experiment.
  if (/seed|clusters|neighbors|dimensions|folds|horizon|ratio|split|threshold|regularization/i.test(label)) return <label className="field"><span>{label}</span><input defaultValue={/seed/i.test(label)?'42':/ratio|split/i.test(label)?'0.8':'3'}/></label>;
  // Remaining categorical values use a select to prevent unknown-column submissions.
  return <label className="field"><span>{label}</span><select defaultValue=""><option value="" disabled>Select {label.toLowerCase()}</option><option>All numeric columns</option><option>species</option><option>feature_1</option></select></label>;
}

// Draw a dependency-free SVG result visualization appropriate to the active workflow.
function Chart({task}) {
  // Clustering displays separated point groups; other workflows display a validation curve.
  const points = task.id==='clustering' ? [[65,180],[90,155],[115,170],[135,135],[155,150],[250,95],[275,75],[300,110],[325,85],[350,100],[440,170],[470,145],[490,185],[515,155]] : [[45,205],[65,150],[85,118],[115,82],[150,62],[190,48],[250,36],[320,29],[390,25],[470,22],[535,20]];
  return <div className="chart"><div className="chart-title"><span>{task.id==='clustering'?'Cluster projection':'Validation curve'}</span><small>Interactive preview</small></div><svg id="model-result-chart" viewBox="0 0 580 240" role="img" aria-label="Model result chart"><g className="grid">{[40,80,120,160,200].map(y=><line key={y} x1="36" y1={y} x2="550" y2={y}/>)}</g>{task.id==='clustering'?points.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="6" className={`c${Math.floor(i/5)}`}/>):<><path d={'M'+points.map(p=>p.join(',')).join(' L')} className="curve"/><path d="M45,205 L535,20 L535,220 L45,220 Z" className="area"/></>}</svg></div>;
}

// Switch between progress, empty, and complete result states.
function Results({result,task,running}) {
  // Immediate progress feedback prevents repeated submissions while native work runs.
  if (running) return <div className="empty loading"><span/><h2>Running native experiment…</h2><p>Preparing matrices and training the selected algorithm.</p></div>;
  // Before the first run, teach the user which action produces output.
  if (!result) return <div className="empty"><Icons.FlaskConical/><h2>Your results will appear here</h2><p>Configure the experiment, then run it to see metrics, plots, and row-level output.</p></div>;
  // Native and demo results intentionally share one contract and one renderer.
  return <div className="results"><div className="result-head"><div><h2>{result.title}</h2><p>{result.demo?'Demo result · start the C++ service for native execution':'Computed by the mlpack C++ backend'}</p></div><div className="export-actions"><button onClick={()=>downloadResultsCsv(result)}><Icons.FileSpreadsheet/> Download CSV</button><button onClick={()=>downloadChartPng(document.getElementById('model-result-chart'),result.title)}><Icons.ImageDown/> Save graph PNG</button></div></div><div className="metrics">{result.metrics.map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div><Chart task={task}/><div className="table-wrap"><div className="table-title">Row-level output <span>{result.rows.length} rows</span></div><table><thead><tr><th>#</th><th>Actual</th><th>Prediction</th><th>Confidence</th></tr></thead><tbody>{result.rows.map(row=><tr key={row.id}><td>{row.id}</td><td>{row.actual}</td><td>{row.predicted}</td><td><div className="confidence"><i style={{width:`${row.confidence*100}%`}}/><span>{Math.round(row.confidence*100)}%</span></div></td></tr>)}</tbody></table></div></div>;
}

// Own the workbench's state and coordinate navigation, native execution, and rendering.
export default function App() {
  // These states track workflow, algorithm, output, progress, mobile navigation, and search.
  const [selected,setSelected]=useState('classification'), [algorithm,setAlgorithm]=useState('Random Forest'), [result,setResult]=useState(null), [running,setRunning]=useState(false), [menu,setMenu]=useState(false), [query,setQuery]=useState(''), [uploadedFile,setUploadedFile]=useState(null), [uploadError,setUploadError]=useState(''), [showUploadNotice,setShowUploadNotice]=useState(false);
  // Resolve the active record and compute the static task total only once.
  const task=taskById(selected); const taskCount=useMemo(()=>groups.reduce((n,g)=>n+g.tasks.length,0),[]);
  // A workflow change resets stale results and selects that workflow's first algorithm.
  const select=id=>{setSelected(id); const next=taskById(id);setAlgorithm(next.algorithms[0]);setResult(null);setUploadedFile(null);setUploadError('');setShowUploadNotice(false);setMenu(false)};
  // Store only browser metadata; the file itself remains local until an experiment is submitted.
  const fileLoaded=file=>{const error=validateCsvFile(file);setUploadedFile(error?null:file);setUploadError(error || '');setShowUploadNotice(true)};
  // Prefer the real local C++ API; use an honest demo response when it is unavailable.
  // A short timeout prevents a blocked socket from leaving the screen spinning forever.
  async function run(){setRunning(true);let data;try{const response=await fetch('http://127.0.0.1:7312/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:selected,algorithm}),signal:AbortSignal.timeout(900)});if(!response.ok)throw new Error();data=await response.json()}catch{data=buildDemoResult(task,algorithm)}setResult(data);setRunning(false)}
  // Compose the sidebar, configuration form, analysis surface, and activity console.
  return <div className="app"><Sidebar selected={selected} onSelect={select} open={menu} onClose={()=>setMenu(false)}/><main><header><button className="menu" onClick={()=>setMenu(true)} aria-label="Open menu"><Icons.Menu/></button><div><h1>{task.name}</h1><p>{task.description}</p></div><div className="header-actions"><label className="search"><Icons.Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${taskCount} tasks`}/></label><span className="engine"><i/> Engine auto-detect</span></div></header><div className="workspace"><section className="setup"><div className="section-title"><span>01</span><div><h2>Configure</h2><p>Inputs passed to the native runner</p></div></div><label className="field"><span>Algorithm</span><select value={algorithm} onChange={e=>setAlgorithm(e.target.value)}>{task.algorithms.map(a=><option key={a}>{a}</option>)}</select></label>{task.fields.map((f,i)=><Field label={f} index={i} task={task} uploadedFile={uploadedFile} uploadError={uploadError} onFileLoaded={fileLoaded} key={f}/>)}<div className="actions"><button className="run" onClick={run} disabled={running}><Icons.Play/> {running?'Running…':'Run experiment'}</button><button onClick={()=>setResult(null)}><Icons.RotateCcw/></button></div></section><section className="output"><div className="section-title"><span>02</span><div><h2>Analyze</h2><p>Metrics, visualization, and predictions</p></div></div><Results result={result} task={task} running={running}/></section></div><footer><div><i/><span>Activity</span></div><code>{result?.log || `Ready · select one of ${taskCount} workflows and run an experiment`}</code></footer></main>{showUploadNotice&&(uploadedFile||uploadError)&&<div className={`upload-notice ${uploadError?'error':''}`} role={uploadError?'alert':'status'}>{uploadError?<Icons.CircleAlert/>:<Icons.CheckCircle2/>}<div><strong>{uploadError?'Upload failed':'Dataset ready'}</strong><span>{uploadError || `${uploadedFile.name} loaded successfully`}</span></div><button aria-label="Dismiss upload notification" onClick={()=>setShowUploadNotice(false)}><Icons.X/></button></div>}{menu&&<div className="scrim" onClick={()=>setMenu(false)}/>}</div>;
}
