/* ============================================================
   MAIN.JS – FULL CHUẨN PC + MOBILE
   Load JSON → Lưu LocalStorage → Vẽ Cây Gia Phả Responsive
   + Media, YouTube, Dropdowns, Zoom, Chatbox AI
   ============================================================ */

/* ==================== LOAD DATA ==================== */
async function loadGenealogyData() {
    let cached = localStorage.getItem("giaPhaData");

    // Nếu đã có trong localStorage → dùng luôn
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.people && Array.isArray(parsed.people)) {
                return parsed;
            }
        } catch (e) {}
    }

    // Nếu chưa có → fetch từ GitHub
    try {
        const res = await fetch("data/genealogy.json?v=" + Date.now());
        const json = await res.json();

        localStorage.setItem("giaPhaData", JSON.stringify(json));
        return json;

    } catch (err) {
        console.error("Không load được genealogy.json:", err);
        return { people: [], eventImage: "", youtubeLink: "" };
    }
}

/* ==================== INIT ==================== */
let store = { people: [] };
let people = [];

async function init() {
    store = await loadGenealogyData();
    people = store.people || [];

    // Load media
    if (store.eventImage) document.getElementById("eventImageDisplay").src = store.eventImage;
    if (store.youtubeLink) document.getElementById("youtubeDisplay").src = store.youtubeLink;

    // Dropdowns
    initDropdowns();

    // Vẽ toàn bộ cây
    drawTree();

    // Resize responsive
    window.addEventListener("resize", () => drawTree());
}

init();

/* ==================== DROPDOWN ==================== */
function initDropdowns() {
    const chiSelect = document.getElementById("chiSelect");
    const doiSelect = document.getElementById("doiSelect");
    const tenSelect = document.getElementById("tenSelect");

    const chiList = [...new Set(people.map(p => p.chi))];
    chiSelect.innerHTML = chiList.map(c => `<option>${c}</option>`).join("");

    function refreshDropdowns() {
        const chi = chiSelect.value || chiList[0];
        const list = people.filter(p => p.chi === chi);

        const doiSet = [...new Set(list.map(p => +p.generation))].sort((a,b)=>a-b);
        doiSelect.innerHTML = doiSet.map(d => `<option value="${d}">${d}</option>`).join("");

        const doi = +doiSelect.value || doiSet[0];
        const tenList = list.filter(p => +p.generation === doi).map(p => p.fullName);
        tenSelect.innerHTML = tenList.map(t => `<option>${t}</option>`).join("");
    }

    chiSelect.onchange = doiSelect.onchange = refreshDropdowns;
    refreshDropdowns();

    document.getElementById("searchBtn").onclick = () => {
        const name = tenSelect.value;
        const person = people.find(p => p.fullName === name);
        if (!person) return alert("Không tìm thấy!");
        showInfo(person);
        drawTree(person.fullName);
    };

    document.getElementById("allBtn").onclick = () => drawTree();
}

/* ==================== BUILD TREE DATA ==================== */
function buildTreeData(centerName = null) {
    if (!people || people.length === 0) return null;

    const map = {};
    people.forEach(p => map[p.fullName] = { ...p, children: [] });

    let roots = [];
    people.forEach(p => {
        if (p.parent && map[p.parent]) {
            map[p.parent].children.push(map[p.fullName]);
        } else {
            roots.push(map[p.fullName]);
        }
    });

    if (!centerName) return { name: "Gia phả", children: roots };
    return map[centerName] || { name: "Gia phả", children: roots };
}

/* ==================== DRAW TREE ==================== */
function drawTree(centerName = null) {
    const treeData = buildTreeData(centerName);
    if (!treeData) return;

    const svg = d3.select("#genealogyTree");
    svg.selectAll("*").remove();

    const treePanel = document.querySelector(".tree-panel");
    const width = treePanel.clientWidth;
    const height = window.innerHeight * 0.75;

    svg.attr("width", width).attr("height", height);

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().size([height, width - 200]);
    treeLayout(root);

    // Links
    svg.append("g")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "#8B0000")
        .attr("stroke-width", 2)
        .attr("d", d3.linkHorizontal().x(d=>d.y).y(d=>d.x));

    // Nodes
    const node = svg.append("g")
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .on("click", (evt, d) => {
            showInfo(d.data);
            drawTree(d.data.fullName);
        });

    node.append("rect")
        .attr("width", 210)
        .attr("height", 60)
        .attr("x", -105)
        .attr("y", -30)
        .attr("rx", 10)
        .attr("fill", "#fff4cc")
        .attr("stroke", "#8B0000");

    node.filter(d=>d.data.anhCaNhan)
        .append("image")
        .attr("xlink:href", d => fixImageURL(d.data.anhCaNhan))
        .attr("x",-100)
        .attr("y",-25)
        .attr("width",50)
        .attr("height",50)
        .attr("clip-path","circle(25px at 25px 25px)");

    node.append("text")
        .attr("x",-40)
        .attr("dy",5)
        .attr("text-anchor","start")
        .style("font-size","14px")
        .style("font-weight","600")
        .text(d=>d.data.fullName || "(Chưa nhập)");
}

function fixImageURL(url){
    if (!url) return "";
    if (url.startsWith("file:///")) return "";
    return url;
}

/* ==================== SHOW INFO ==================== */
function showInfo(p){
    if(!p) return;
    const box = document.getElementById("infoDetail");
    box.innerHTML = `
        <h3>${p.fullName}</h3>
        <p><strong>Đời:</strong> ${p.generation||""}</p>
        <p><strong>Chi:</strong> ${p.chi||""}</p>
        <p><strong>Tên gọi khác:</strong> ${p.nickname||""}</p>
        <p><strong>Nghề nghiệp:</strong> ${p.job||""}</p>
        <p><strong>Năm sinh:</strong> ${p.birth||""}</p>
        <p><strong>Năm mất:</strong> ${p.death||""}</p>
        <p><strong>Ghi chú:</strong> ${p.note||""}</p>
        <h4>Vợ:</h4>
        ${(p.wives && p.wives.length)?p.wives.map(w=>`<p>- ${w.name||w}</p>`).join(""):"Không có"}
        <h4>Cha/Mẹ:</h4>
        <p>${p.parent||"Không có dữ liệu"}</p>
    `;
}

/* ==================== ZOOM ==================== */
let zoom = 1;
document.getElementById("zoomIn").onclick = ()=>{zoom+=0.1; document.getElementById("genealogyTree").style.transform=`scale(${zoom})`;};
document.getElementById("zoomOut").onclick = ()=>{zoom=Math.max(0.5, zoom-0.1); document.getElementById("genealogyTree").style.transform=`scale(${zoom})`;};

/* ==================== CHATBOX AI (OpenRouter) ==================== */
const API_KEY = "sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const REFERER_DOMAIN = "https://giaphatruongvan2025.github.io";

async function sendAIMessage(msg){
    try {
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
                    {role:"system",content:"Bạn là trợ lý AI gia phả, trả lời ngắn gọn."},
                    {role:"user",content:msg}
                ]
            })
        });
        if(!res.ok){
            console.error("API ERROR:", res.status, await res.text());
            return "Xin lỗi, AI đang gặp sự cố.";
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "Không có phản hồi.";
    } catch(e){
        console.error(e);
        return "Không thể kết nối AI.";
    }
}

document.getElementById("chatSend").onclick = async ()=>{
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if(!msg) return;
    addChatMessage("Bạn", msg);
    input.value="";
    const reply = await sendAIMessage(msg);
    addChatMessage("AI", reply);
};

function addChatMessage(sender,text){
    const box = document.getElementById("chatbox-body");
    const div = document.createElement("div");
    div.innerHTML=`<b>${sender}:</b> ${text}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

/* ==================== ADMIN BUTTON ==================== */
document.getElementById("btnAdmin").onclick = ()=>{
    const pass = prompt("🔑 Nhập mật khẩu quản trị:");
    if(pass===store.adminPass || pass==="1234") window.location.href="admin.html";
    else alert("❌ Sai mật khẩu!");
};
