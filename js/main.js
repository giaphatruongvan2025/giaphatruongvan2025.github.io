/* ============================================================
   MAIN.JS FINAL – PC + MOBILE, Index + Admin, Responsive
   ============================================================ */

// ==================== LOAD DATA ====================
async function loadGenealogyData() {
    localStorage.removeItem("giaPhaData"); // Xóa cache cũ để load dữ liệu mới
    try {
        const res = await fetch("data/genealogy.json?v=" + Date.now());
        const json = await res.json();

        // Fix ảnh local và YouTube embed
        json.people.forEach(p => {
            if(p.anhCaNhan && p.anhCaNhan.startsWith("file:///")){
                p.anhCaNhan = ""; // Hoặc thay bằng relative path repo
            }
        });
        if(json.youtubeLink && !json.youtubeLink.includes("embed")){
            const id = json.youtubeLink.split("v=")[1];
            if(id) json.youtubeLink = "https://www.youtube.com/embed/" + id;
        }

        localStorage.setItem("giaPhaData", JSON.stringify(json));
        return json;
    } catch(err) {
        console.error("Không load được genealogy.json:", err);
        return { people: [], youtubeLink: "" };
    }
}

// ==================== KHỞI TẠO ====================
let store = { people: [], youtubeLink: "" };
let people = [];

async function init() {
    store = await loadGenealogyData();
    people = store.people || [];

    // Gán YouTube + eventImage ở Index
    const evtImg = document.getElementById("eventImageDisplay");
    const yt = document.getElementById("youtubeDisplay");
    if(evtImg && store.eventImage) evtImg.src = store.eventImage;
    if(yt && store.youtubeLink) yt.src = store.youtubeLink;

    initDropdowns();
    drawTree();

    window.addEventListener("resize", () => {
        drawTree();
    });
}

init();

// ==================== DROPDOWNS ====================
function initDropdowns(){
    const chiSelect = document.getElementById("chiSelect");
    const doiSelect = document.getElementById("doiSelect");
    const tenSelect = document.getElementById("tenSelect");

    if(!chiSelect || !doiSelect || !tenSelect) return;

    const chiList = [...new Set(people.map(p=>p.chi))];
    chiSelect.innerHTML = chiList.map(c => `<option>${c}</option>`).join("");

    function refreshDropdowns(){
        const chi = chiSelect.value || chiList[0];
        const list = people.filter(p => p.chi === chi);
        const doiSet = [...new Set(list.map(p=>+p.generation))].sort((a,b)=>a-b);
        const oldVal = +doiSelect.value;

        doiSelect.innerHTML = doiSet.map(d => `<option value="${d}">${d}</option>`).join("");
        if(doiSet.includes(oldVal)) doiSelect.value = oldVal;
        const doi = +doiSelect.value || doiSet[0];

        const tenList = list.filter(p => +p.generation === doi).map(p=>p.fullName);
        tenSelect.innerHTML = tenList.map(t => `<option>${t}</option>`).join("");
    }

    chiSelect.onchange = doiSelect.onchange = refreshDropdowns;
    refreshDropdowns();

    document.getElementById("searchBtn")?.addEventListener("click", ()=>{
        const name = tenSelect.value;
        const p = people.find(x=>x.fullName===name);
        if(!p) return alert("Không tìm thấy!");
        showInfo(p);
        drawTree(p.fullName);
    });

    document.getElementById("allBtn")?.addEventListener("click", ()=>{
        drawTree(null);
    });
}

// ==================== SHOW INFO ====================
function showInfo(p){
    if(!p) return;
    const box = document.getElementById("infoDetail");
    if(!box) return;

    box.innerHTML = `
        ${p.anhCaNhan ? `<img src="${p.anhCaNhan}" style="max-width:120px;border-radius:8px;float:right;margin-left:10px;">` : ""}
        <h3>${p.fullName}</h3>
        <p><strong>Đời:</strong> ${p.generation||""}</p>
        <p><strong>Chi:</strong> ${p.chi||""}</p>
        <p><strong>Nickname:</strong> ${p.nickname||""}</p>
        <p><strong>Nghề:</strong> ${p.job||""}</p>
        <p><strong>Sinh:</strong> ${p.birth||""}</p>
        <p><strong>Mất:</strong> ${p.death||""}</p>
        <p><strong>Ghi chú:</strong> ${p.note||""}</p>
        <h4>Vợ/Chồng:</h4>
        ${(p.wives && p.wives.length) ? p.wives.map(w=>`<p>- ${w.name||""}</p>`).join("") : "Không có"}
        <h4>Cha/Mẹ:</h4>
        <p>${p.parent || "Không có dữ liệu"}</p>
    `;
}

// ==================== BUILD TREE ====================
function buildTreeData(centerName=null){
    if(!people || people.length===0) return null;
    const map = {};
    people.forEach(p=>map[p.fullName] = {...p, children:[]});
    let root = null;

    people.forEach(p=>{
        if(p.parent && map[p.parent]){
            map[p.parent].children.push(map[p.fullName]);
        } else {
            if(!root) root = map[p.fullName];
        }
    });

    if(!centerName) return root;
    return map[centerName] || root;
}

// ==================== DRAW TREE ====================
function drawTree(centerName=null){
    const treeData = buildTreeData(centerName);
    if(!treeData) return;

    const svg = d3.select("#genealogyTree");
    if(svg.empty()) return;
    svg.selectAll("*").remove();

    const treePanel = document.querySelector(".tree-panel");
    const width = treePanel.clientWidth;
    const height = window.innerHeight*0.8;

    svg.attr("width", width).attr("height", height);

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().size([height-40, width-200]);
    treeLayout(root);

    svg.append("g")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("fill","none")
        .attr("stroke","#8B0000")
        .attr("stroke-width",2)
        .attr("d",d3.linkHorizontal().x(d=>d.y).y(d=>d.x));

    const node = svg.append("g")
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("class","node")
        .attr("transform",d=>`translate(${d.y},${d.x})`)
        .on("click",(evt,d)=>{
            showInfo(d.data);
            drawTree(d.data.fullName);
        });

    node.append("rect")
        .attr("width",210).attr("height",60).attr("x",-105).attr("y",-30)
        .attr("rx",10).attr("fill","#fff4cc").attr("stroke","#8B0000");

    node.filter(d=>d.data.anhCaNhan)
        .append("image")
        .attr("xlink:href",d=>d.data.anhCaNhan)
        .attr("x",-100).attr("y",-25)
        .attr("width",50).attr("height",50)
        .attr("clip-path","circle(25px at 25px 25px)");

    node.append("text")
        .attr("x",-40).attr("dy",5).attr("text-anchor","start")
        .style("font-size","14px").style("font-weight","600")
        .text(d=>d.data.fullName||"(Chưa nhập)");
}

// ==================== ZOOM ====================
let zoom=1;
document.getElementById("zoomIn")?.addEventListener("click",()=>{zoom+=0.1; document.getElementById("genealogyTree").style.transform=`scale(${zoom})`;});
document.getElementById("zoomOut")?.addEventListener("click",()=>{zoom=Math.max(0.5,zoom-0.1); document.getElementById("genealogyTree").style.transform=`scale(${zoom})`;});

// ==================== ADMIN ====================
document.getElementById("btnAdmin")?.addEventListener("click",()=>{
    const pass=prompt("🔑 Nhập mật khẩu quản trị:");
    if(pass===store.adminPass || pass==="1234") window.location.href="admin.html";
    else alert("❌ Sai mật khẩu!");
});

// ==================== CHATBOX AI ====================
const API_KEY = "YOUR_OPENROUTER_KEY";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const REFERER_DOMAIN = "https://giaphatruongvan2025.github.io";

async function sendAIMessage(msg){
    try{
        const res=await fetch(API_URL,{
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
                    {role:"system", content:"Bạn là trợ lý AI của trang Gia Phả, trả lời ngắn gọn, dễ hiểu."},
                    {role:"user", content:msg}
                ]
            })
        });
        if(!res.ok) return "Xin lỗi, AI đang gặp sự cố.";
        const data=await res.json();
        return data.choices?.[0]?.message?.content||"Không có phản hồi.";
    }catch(e){return "Không thể kết nối AI.";}
}

document.getElementById("sendBtn")?.addEventListener("click",async ()=>{
    const input=document.getElementById("chatInput");
    const msg=input.value.trim();
    if(!msg) return;
    addMessageToUI("Bạn",msg);
    input.value="";
    const aiReply=await sendAIMessage(msg);
    addMessageToUI("AI",aiReply);
});

function addMessageToUI(sender,text){
    const chatBox=document.getElementById("chatBox");
    const div=document.createElement("div");
    div.className="chat-message";
    div.innerHTML=`<b>${sender}:</b> ${text}`;
    chatBox.appendChild(div);
    chatBox.scrollTop=chatBox.scrollHeight;
}
