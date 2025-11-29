const yearEl=document.getElementById("year");
if(yearEl){yearEl.textContent=String(new Date().getFullYear())}
const toggle=document.getElementById("themeToggle");
const prefersDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;
const key="ha-theme";
const setTheme=v=>{document.documentElement.dataset.theme=v};
const saved=localStorage.getItem(key);
if(saved){setTheme(saved)}else{setTheme(prefersDark?"dark":"light")}
if(toggle){toggle.addEventListener("click",()=>{const next=document.documentElement.dataset.theme==="dark"?"light":"dark";setTheme(next);localStorage.setItem(key,next)})}

async function extractCvText(){
  try{
    const loadingTask=pdfjsLib.getDocument("assets/Haider_Ali_CV.pdf");
    const pdf=await loadingTask.promise;
    let fullText="";
    const pages=Math.min(pdf.numPages,3);
    for(let i=1;i<=pages;i++){
      const page=await pdf.getPage(i);
      const content=await page.getTextContent();
      const strings=content.items.map(it=>it.str);
      fullText+="\n"+strings.join(" ");
    }
    return fullText;
  }catch(e){
    return "";
  }
}

function setText(id, text){const el=document.getElementById(id); if(el&&text){el.textContent=text}}
function addChip(text){const grid=document.getElementById("skillsGrid"); if(grid&&text){const s=document.createElement("span"); s.className="chip"; s.textContent=text; grid.appendChild(s)}}
function addTimeline(id, time, desc){const ul=document.getElementById(id); if(!ul) return; const li=document.createElement("li"); const t=document.createElement("div"); t.className="time"; t.textContent=time; const d=document.createElement("div"); d.className="desc"; d.textContent=desc; li.appendChild(t); li.appendChild(d); ul.appendChild(li)}

function parseAndPopulate(raw){
  const text=raw.replace(/\s+/g," ").trim();
  // Name
  const nameMatch=text.match(/(Muhammad\s+Haider\s+Ali[^\n]*)/i);
  if(nameMatch) setText("name", nameMatch[1].trim());

  // Email
  const emailMatch=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(emailMatch) setText("email", emailMatch[0]);

  // Phone (generic)
  const phoneMatch=text.match(/(?:\+\d{1,3}\s?)?\d{3}[\s-]?\d{3}[\s-]?\d{4}/);
  if(phoneMatch) setText("phone", phoneMatch[0]);

  // Summary: section near top until Skills/Experience
  const summaryMatch=text.match(/(?:Summary|Profile|About)[^:]*:\s*([^]*?)(?:Skills|Experience|Education)/i);
  if(summaryMatch){ setText("aboutText", summaryMatch[1].trim()) }

  // Skills: after 'Skills' heading
  const skillsSection=text.match(/Skills[^:]*:\s*([^]*?)(?:Experience|Education|Projects)/i);
  if(skillsSection){
    const rawSkills=skillsSection[1].split(/[•\-,;\n]/).map(s=>s.trim()).filter(s=>s.length>1);
    const grid=document.getElementById("skillsGrid");
    if(grid){ grid.innerHTML="" }
    rawSkills.slice(0,12).forEach(addChip);
  }

  // Experience: find lines with year ranges
  const expRegex=/(\b20\d{2}\b)\s?-\s?(\b20\d{2}\b|Present)[^]*?([A-Za-z][^\n]{10,60})/g;
  let m; let added=0;
  while((m=expRegex.exec(text)) && added<6){
    const range=`${m[1]} – ${m[2]}`;
    const desc=m[3].trim();
    addTimeline("expTimeline", range, desc);
    added++;
  }

  // Education: include FAST NUCES if present
  const eduFast=text.match(/FAST\s+NUCES[^\n]*/i);
  if(eduFast){ addTimeline("eduTimeline", "FAST NUCES", eduFast[0].trim()) }
}

(async()=>{
  const cvText=await extractCvText();
  if(cvText){ parseAndPopulate(cvText) }
})();
