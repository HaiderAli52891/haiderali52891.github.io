const yearEl=document.getElementById("year");
if(yearEl){yearEl.textContent=String(new Date().getFullYear())}
const toggle=document.getElementById("themeToggle");
const prefersDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;
const key="ha-theme";
const setTheme=v=>{document.documentElement.dataset.theme=v};
const saved=localStorage.getItem(key);
if(saved){setTheme(saved)}else{setTheme(prefersDark?"dark":"light")}
if(toggle){toggle.addEventListener("click",()=>{const next=document.documentElement.dataset.theme==="dark"?"light":"dark";setTheme(next);localStorage.setItem(key,next)})}
