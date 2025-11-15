/* ============================================================
   MAIN.JS – Phiên bản FULL cho PC + MOBILE (1 lần dán)
   ============================================================ */

/* ==================== LOAD DATA ==================== */
async function loadGenealogyData() {
    let cached = localStorage.getItem("giaPhaData");
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.people && Array.isArray(parsed.people)) return parsed;
        } catch {}
    }
    try {
        const res = await fetch("data/genealogy.json?v=" + Date.now());
        const json = await res.json();
        localStorage.setItem("giaPhaData", JSON.stringify(json));
        return json;
    } catch (err) {
        console.error("Không load được genealogy.json:", err);
        return { people: [] };
    }
}

/* ==================== KHỞI TẠO ==================== */
let store = { people: [] };
let people = [];
const chiSelect = document.getElementById("chiSelect");
const doiSelect = document.getElementById("doiSelect");
const tenSelect = document.getElementById("tenSelect");

const chiList = ["Văn", "Bá", "Mạnh", "Trọng", "Quý", "Thúc"];

async function init() {
    store = await loadGenealogyData();
    people = store.people || [];

    chiSelect.innerHTML = chiList.map(c => `<option>${c}</option>`).join("");

    // Bind onchange sau khi DOM sẵn sàng
    chiSelect.onchange = doiSelect.onchange = refreshDropdowns;

    refreshDropdowns();
    drawTree();

    window.addEventListener("resize", () => drawTree());
}

document.addEventListener("DOMContentLoaded", init);

/* ==================== REFRESH DROPDOWNS ==================== */
function refreshDropdowns() {
    const chi = chiSelect.value || chiList[0];
    const list = people.filter(p => p.chi === chi);

    // Lấy danh sách đời
    const doiSet = [...new Set(list.map(p => +p.generation))].sort((a, b) => a - b);
    const oldVal = +doiSelect.value;

    doiSelect.innerHTML = doiSet.map(d => `<option value="${d}">${d}</option>`).join("");
    doiSelect.value = doiSet.includes(oldVal) ? oldVal : doiSet[0];

    const doi = +doiSelect.value;
    const tenList = list.filter(p => +p.generation === doi).map(p => p.fullName);
    tenSelect.innerHTML = tenList.map(t => `<option>${t}</option>`).join("");
}

/* ==================== SHOW INFO ==================== */
function showInfo(p) {
    if (!p) return;
    const box = document.getElementById("infoDetail");
    box.innerHTML = `
        ${p.anhCaNhan ? `<img src="${fixImageURL(p.anhCaNhan)}" style="max-width:120px;border-radius:8px;float:right;margin-left:10px;">` : ""}
        <h3>${p.fullName}</h3>
        <p><strong>Đời:</strong> ${p.generation || ""}</p>
        <p><strong>Chi:</strong> ${p.chi || ""}</p>
        <p><strong>Tên gọi khác:</strong> ${p.nickname || ""}</p>
        <p><strong>Nghề nghiệp:</strong> ${p.job || ""}</p>
        <p><strong>Năm sinh:</strong> ${p.birth || ""}</p>
        <p><strong>Năm mất:</strong> ${p.death || ""}</p>
        <p><strong>Ghi chú:</strong> ${p.note || ""}</p>
        <h4>Vợ/Con:</h4>
        ${(p.wives && p.wives.length) ? p.wives.map(w => `
            <div style="margin:5px 0;padding:5px;border-left:3px solid #8B0000">
                <p><strong>Vợ:</strong> ${w.name || ""}</p>
                <p><strong>Nguyên quán:</strong> ${w.origin || ""}</p>
                <p><strong>Sinh:</strong> ${w.birth || ""}</p>
                <p><strong>Mất:</strong> ${w.death || ""}</p>
                <p><strong>Mộ táng:</strong> ${w.grave || ""}</p>
                <p><strong>Con:</strong> <ul>${(w.children||[]).map(c=>`<li>${c}</li>`).join("")}</ul></p>
            </div>
        `).join("") : "Không có"}
        <h4>Cha/Mẹ:</h4>
        <p>${p.parent || "Không có dữ liệu"}</p>
    `;
}

/* ==================== FIX IMAGE URL ==================== */
function fixImageURL(url){
    if(!url) return "";
    if(url.startsWith("file:///")) return ""; // Không load được trên GitHub
    return url;
}

/* ==================== BUILD TREE DATA ==================== */
function buildTreeData(centerName=null){
    if(!people || people.length===0) return null;

    const map = {};
    people.forEach(p=>map[p.fullName] = { ...p, children: [] });

    let roots = [];
    people.forEach(p=>{
        if(p.parent && map[p.parent]) map[p.parent].children.push(map[p.fullName]);
        else roots.push(map[p.fullName]);
    });

    if(!centerName) return { name:"Gia phả", children: roots };
    return map[centerName] || { name:"Gia phả", children: roots };
}

/* ==================== DRAW TREE ==================== */
function drawTree(centerName=null){
    const treeData = buildTreeData(centerName);
    if(!treeData) return;

    const svg = d3.select("#genealogyTree");
    svg.selectAll("*").remove();

    const treePanel = document.querySelector(".tree-panel");
    const width = treePanel.clientWidth;
    const height = window.innerHeight*0.8;

    svg.attr("width", width).attr("height", height);

    const root = d3.hierarchy(treeData);
    d3.tree().size([height-40, width-200])(root);

    // Vẽ đường
    svg.append("g")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("fill","none")
        .attr("stroke","#8B0000")
        .attr("stroke-width",2)
        .attr("d", d3.linkHorizontal().x(d=>d.y).y(d=>d.x));

    // Vẽ node
    const node = svg.append("g")
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("class","node")
        .attr("transform", d=>`translate(${d.y},${d.x})`)
        .on("click",(evt,d)=>{
            showInfo(d.data);
            drawTree(d.data.fullName);
        });

    node.append("rect")
        .attr("width",210)
        .attr("height",60)
        .attr("x",-105).attr("y",-30)
        .attr("rx",10)
        .attr("fill","#fff4cc")
        .attr("stroke","#8B0000")
        .attr("stroke-width",2);

    node.filter(d=>d.data.anhCaNhan)
        .append("image")
        .attr("xlink:href", d=>fixImageURL(d.data.anhCaNhan))
        .attr("x",-100).attr("y",-25)
        .attr("width",50).attr("height",50)
        .attr("clip-path","circle(25px at 25px 25px)");

    node.append("text")
        .attr("x",-40).attr("dy",5)
        .attr("text-anchor","start")
        .style("font-size","14px")
        .style("font-weight","600")
        .text(d=>d.data.fullName||"(Chưa nhập)");
}

/* ==================== ZOOM ==================== */
let zoom = 1;
document.getElementById("zoomIn").onclick = ()=>{zoom+=0.1; document.getElementById("genealogyTree").style.transform=`scale(${zoom})`;};
document.getElementById("zoomOut").onclick = ()=>{zoom=Math.max(0.5,zoom-0.1); document.getElementById("genealogyTree").style.transform=`scale(${zoom})`;};

/* ==================== TOÀN BỘ ==================== */
document.getElementById("allBtn").onclick = ()=>drawTree();

/* ==================== SEARCH ==================== */
document.getElementById("searchBtn").onclick = ()=>{
    const p = people.find(x=>x.fullName===tenSelect.value);
    if(!p) return alert("Không tìm thấy!");
    showInfo(p);
    drawTree(p.fullName);
};

/* ==================== ADMIN ==================== */
document.getElementById("btnAdmin").onclick = ()=>{
    const pass = prompt("Nhập mật khẩu quản trị:");
    if(pass===store.adminPass || pass==="1234") window.location.href="admin.html";
    else alert("Sai mật khẩu!");
};

/* ==================== MEDIA (INDEX) ==================== */
if(store.eventImage) document.getElementById("eventImageDisplay").src=store.eventImage;
if(store.youtubeLink) document.getElementById("youtubeDisplay").src=store.youtubeLink;

/* ==================== CHATBOX AI (OpenRouter) ==================== */
const API_KEY = "sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const REFERER_DOMAIN = "https://giaphatruongvan2025.github.io";

async function sendAIMessage(userMessage){
    try{
        const res = await fetch(API_URL,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${API_KEY}`,
                "HTTP-Referer": REFERER_DOMAIN,
                "X-Title":"Gia Pha AI Chatbox"
            },
            body:JSON.stringify({
                model:"openai/gpt-4.1-mini",
                messages:[
                    {role:"system",content:"Bạn là trợ lý AI của Gia Phả, trả lời ngắn gọn dễ hiểu."},
                    {role:"user",content:userMessage}
                ]
            })
        });
        if(!res.ok){
            console.error("Lỗi API:",res.status,await res.text());
            return "AI gặp sự cố.";
        }
        const result = await res.json();
        return result.choices?.[0]?.message?.content || "Không có phản hồi.";
    }catch(e){
        console.error(e);
        return "Không thể kết nối AI.";
    }
}

document.getElementById("chatSend").onclick = async ()=>{
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if(!msg) return;
    addMessage("Bạn",msg);
    input.value="";
    const reply = await sendAIMessage(msg);
    addMessage("AI",reply);
};

function addMessage(sender,text){
    const box = document.getElementById("chatbox-body");
    const div = document.createElement("div");
    div.className="chat-msg";
    div.innerHTML=`<b>${sender}:</b> ${text}`;
    box.appendChild(div);
    box.scrollTop=box.scrollHeight;
}
