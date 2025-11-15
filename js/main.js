/* ============================================================
   MAIN.JS – Phiên bản FULL cho PC + MOBILE
   Load JSON → Lưu LocalStorage → Vẽ Cây Gia Phả Responsive
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
        return { people: [] };
    }
}

/* ==================== KHỞI TẠO ==================== */
let store = { people: [] };
let people = [];

async function init() {
    store = await loadGenealogyData();
    people = store.people || [];

    // Vẽ toàn bộ cây
    drawTree();

    // Fix resize Mobile/PC
    window.addEventListener("resize", () => {
        drawTree();
    });
}

init();

/* ==================== TẠO CÂY DỮ LIỆU ==================== */
function buildTreeData(centerName = null) {
    if (!people || people.length === 0) return null;

    // Tạo dictionary theo fullName
    const map = {};
    people.forEach(p => map[p.fullName] = { ...p, children: [] });

    let root = null;

    people.forEach(p => {
        if (p.parent && map[p.parent]) {
            map[p.parent].children.push(map[p.fullName]);
        } else {
            if (!root) root = map[p.fullName]; // Thế hệ đầu tiên
        }
    });

    if (!centerName) return root;
    return map[centerName] || root;
}

/* ==================== VẼ CÂY ==================== */
function drawTree(centerName = null) {
    const treeData = buildTreeData(centerName);
    if (!treeData) return;

    const svg = d3.select("#genealogyTree");
    svg.selectAll("*").remove();

    const treePanel = document.querySelector(".tree-panel");
    const width = treePanel.clientWidth;
    const height = window.innerHeight * 0.8;

    svg.attr("width", width);
    svg.attr("height", height);

    const root = d3.hierarchy(treeData);

    const treeLayout = d3.tree().size([height - 40, width - 200]);
    treeLayout(root);

    /* ---- Vẽ đường nối ---- */
    svg.append("g")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "#8B0000")
        .attr("stroke-width", 2)
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)
        );

    /* ---- Vẽ node ---- */
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

    // Hộp
    node.append("rect")
        .attr("width", 210)
        .attr("height", 60)
        .attr("x", -105)
        .attr("y", -30)
        .attr("rx", 10)
        .attr("fill", "#fff4cc")
        .attr("stroke", "#8B0000")
        .attr("stroke-width", 2);

    // Ảnh đại diện
    node.filter(d => d.data.anhCaNhan)
        .append("image")
        .attr("xlink:href", d => fixImageURL(d.data.anhCaNhan))
        .attr("x", -100)
        .attr("y", -25)
        .attr("width", 50)
        .attr("height", 50)
        .attr("clip-path", "circle(25px at 25px 25px)");

    // Tên
    node.append("text")
        .attr("x", -40)
        .attr("dy", 5)
        .attr("text-anchor", "start")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text(d => d.data.fullName || "(Chưa nhập)");
}

/* ==================== FIX ẢNH LOCAL ==================== */
function fixImageURL(url) {
    if (!url) return "";
    if (url.startsWith("file:///")) return "";  // Không load được trên GitHub
    return url;
}

/* ==================== SHOW INFO ==================== */
function showInfo(p) {
    if (!p) return;

    const box = document.querySelector(".info-detail");
    box.innerHTML = `
        <h3>${p.fullName}</h3>
        <p><strong>Đời:</strong> ${p.generation || ""}</p>
        <p><strong>Chi:</strong> ${p.chi || ""}</p>
        <p><strong>Tên gọi khác:</strong> ${p.nickname || ""}</p>
        <p><strong>Nghề nghiệp:</strong> ${p.job || ""}</p>
        <p><strong>Năm sinh:</strong> ${p.birth || ""}</p>
        <p><strong>Năm mất:</strong> ${p.death || ""}</p>
        <p><strong>Ghi chú:</strong> ${p.note || ""}</p>

        <h4>Vợ:</h4>
        ${(p.wives && p.wives.length) ? p.wives.map(w => `<p>- ${w}</p>`).join("") : "Không có"}

        <h4>Cha/Mẹ:</h4>
        <p>${p.parent || "Không có dữ liệu"}</p>
    `;
}
