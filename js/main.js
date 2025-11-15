/* ============================================================
   MAIN.JS – FULL chuẩn cho PC + Mobile – v1.0 FINAL
   Load JSON → LocalStorage → Vẽ Cây Gia Phả → Dropdown hoạt động
   ============================================================ */

console.log("🌳 Gia phả v1.0 FINAL loaded");

// ==================== DOM & SELECTORS ====================
const chiSelect = document.getElementById("chiSelect");
const doiSelect = document.getElementById("doiSelect");
const tenSelect = document.getElementById("tenSelect");
const zoomIn = document.getElementById("zoomIn");
const zoomOut = document.getElementById("zoomOut");

let store = { people: [] };
let people = [];

// ==================== LOAD DATA ====================
async function loadGenealogyData() {
    let cached = localStorage.getItem("giaPhaData");
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.people && Array.isArray(parsed.people)) return parsed;
        } catch(e){}
    }
    try {
        const res = await fetch("data/genealogy.json?v=" + Date.now());
        const json = await res.json();
        localStorage.setItem("giaPhaData", JSON.stringify(json));
        return json;
    } catch(err) {
        console.error("Không load được genealogy.json:", err);
        return { people: [] };
    }
}

// ==================== DROPDOWNS ====================
const chiList = ["Văn", "Bá", "Mạnh", "Trọng", "Quý", "Thúc"];

function refreshDropdowns() {
    const chi = chiSelect.value || "Mạnh";
    const list = people.filter(p => p.chi === chi);

    const doiSet = [...new Set(list.map(p => +p.generation))].sort((a,b)=>a-b);
    const oldVal = +doiSelect.value;
    doiSelect.innerHTML = doiSet.map(d => `<option value="${d}">${d}</option>`).join("");
    doiSelect.value = doiSet.includes(oldVal) ? oldVal : doiSet[0];

    const doi = +doiSelect.value || doiSet[0];
    const tenList = list.filter(p => +p.generation === doi).map(p => p.fullName);
    tenSelect.innerHTML = tenList.map(t => `<option>${t}</option>`).join("");
}

function initDropdowns() {
    chiSelect.innerHTML = chiList.map(c=>`<option>${c}</option>`).join("");
    chiSelect.addEventListener("change", refreshDropdowns);
    doiSelect.addEventListener("change", refreshDropdowns);
    refreshDropdowns();
}

// ==================== SHOW INFO ====================
function showInfo(p){
    if(!p) return;
    const box = document.getElementById("infoDetail");
    box.innerHTML = `
        ${p.anhCaNhan ? `<img src="${fixImageURL(p.anhCaNhan)}" style="max-width:120px;border-radius:8px;float:right;margin-left:10px;">` : ""}
        <h3>${p.fullName}</h3>
        <p><strong>Đời:</strong> ${p.generation||""}</p>
        <p><strong>Chi:</strong> ${p.chi||""}</p>
        <p><strong>Tên gọi khác:</strong> ${p.nickname||""}</p>
        <p><strong>Nghề nghiệp:</strong> ${p.job||""}</p>
        <p><strong>Năm sinh:</strong> ${p.birth||""}</p>
        <p><strong>Năm mất:</strong> ${p.death||""}</p>
        <p><strong>Ghi chú:</strong> ${p.note||""}</p>
        <h4>Vợ/Con:</h4>
        ${(p.wives?.length) ? p.wives.map(w=>`<p>- ${w.name}</p>`).join("") : "Không có"}
        <h4>Cha/Mẹ:</h4>
        <p>${p.parent||"Không có dữ liệu"}</p>
    `;
}

// ==================== BUILD TREE DATA ====================
function buildTreeData(centerName=null){
    if(!people.length) return null;
    const map = {};
    people.forEach(p => map[p.fullName] = {...p, children: []});
    let root = null;
    people.forEach(p=>{
        if(p.parent && map[p.parent]) map[p.parent].children.push(map[p.fullName]);
        else if(!root) root = map[p.fullName];
    });
    return centerName ? (map[centerName] || root) : root;
}

// ==================== DRAW TREE ====================
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
    const treeLayout = d3.tree().size([height-40, width-200]);
    treeLayout(root);

    // ---- Lines
    svg.append("g").selectAll("path")
        .data(root.links())
        .join("path")
        .attr("fill","none")
        .attr("stroke","#8B0000")
        .attr("stroke-width",2)
        .attr("d",d3.linkHorizontal().x(d=>d.y).y(d=>d.x));

    // ---- Nodes
    const node = svg.append("g").selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("class","node")
        .attr("transform",d=>`translate(${d.y},${d.x})`)
        .on("click",(e,d)=>{
            showInfo(d.data);
            drawTree(d.data.fullName);
        });

    node.append("rect")
        .attr("width",210).attr("height",60).attr("x",-105).attr("y",-30)
        .attr("rx",10).attr("fill","#fff4cc").attr("stroke","#8B0000").attr("stroke-width",2);

    node.filter(d=>d.data.anhCaNhan)
        .append("image")
        .attr("xlink:href",d=>fixImageURL(d.data.anhCaNhan))
        .attr("x",-100).attr("y",-25).attr("width",50).attr("height",50)
        .attr("clip-path","circle(25px at 25px 25px)");

    node.append("text")
        .attr("x",-40).attr("dy",5).attr("text-anchor","start")
        .style("font-size","14px").style("font-weight","600")
        .text(d=>d.data.fullName||"(Chưa nhập)");
}

// ==================== FIX IMAGE URL ====================
function fixImageURL(url){
    if(!url) return "";
    if(url.startsWith("file:///")) return ""; // local file không load trên GitHub
    return url;
}

// ==================== INIT ====================
async function init(){
    store = await loadGenealogyData();
    people = store.people || [];
    initDropdowns();
    drawTree();

    window.addEventListener("resize", ()=>drawTree());

    // search button
    document.getElementById("searchBtn").addEventListener("click",()=>{
        const p = people.find(x=>x.fullName===tenSelect.value);
        if(!p) return alert("Không tìm thấy!");
        showInfo(p);
        drawTree(p.fullName);
    });

    // all button
    document.getElementById("allBtn").addEventListener("click",()=>drawTree());
    
    // zoom
    let zoom=1;
    zoomIn.addEventListener("click",()=>{ zoom+=0.1; document.getElementById("genealogyTree").style.transform=`scale(${zoom})`; });
    zoomOut.addEventListener("click",()=>{ zoom=Math.max(0.5,zoom-0.1); document.getElementById("genealogyTree").style.transform=`scale(${zoom})`; });
}

init();
