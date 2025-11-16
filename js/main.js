console.log("🌳 Showtime v3.9 Dynamic Tree loaded");

// ==================== CLEAN OLD LOCALSTORAGE ====================
if (localStorage.getItem("giaPhaData")) {
    console.log("🧹 Xóa localStorage cũ để tránh cache media/clip cũ");
    localStorage.removeItem("giaPhaData");
}

// ==================== LOAD DATA TỪ JSON ====================
// Thêm query string timestamp để tránh cache GitHub Pages / browser
fetch("data/genealogy.json?" + Date.now())
  .then(res => res.json())
  .then(store => {
      localStorage.setItem("giaPhaData", JSON.stringify(store));
      initApp(store);
  })
  .catch(err => {
      console.warn("Không thể load JSON, dùng dữ liệu localStorage cũ:", err);
      const store = JSON.parse(localStorage.getItem("giaPhaData") || "{}");
      initApp(store);
  });

// ==================== INIT APP ====================
function initApp(store) {
    if (!store.people) store = { people: [], adminPass: "1234" };
    const people = store.people || [];

    // ==================== MEDIA ====================
    const eventImg = document.getElementById("eventImageDisplay");
    const youtubeFrame = document.getElementById("youtubeDisplay");

    if (store.eventImage) {
        eventImg.src = store.eventImage + "?ts=" + Date.now();
    } else eventImg.src = "";

    if (store.youtubeLink) {
        youtubeFrame.src = store.youtubeLink + "?ts=" + Date.now();
    } else youtubeFrame.src = "";

    // ==================== DROPDOWNS ====================
    const chiSelect = document.getElementById("chiSelect");
    const doiSelect = document.getElementById("doiSelect");
    const tenSelect = document.getElementById("tenSelect");

    const chiList = ["Văn", "Bá", "Mạnh", "Trọng", "Quý", "Thúc"];
    chiSelect.innerHTML = chiList.map(c => `<option>${c}</option>`).join("");

    function refreshDropdowns() {
        const chi = chiSelect.value || "Mạnh";
        const list = people.filter(p => p.chi === chi);

        const doiSet = [...new Set(list.map(p => +p.generation))].sort((a, b) => a - b);
        const oldVal = +doiSelect.value;
        doiSelect.innerHTML = doiSet.map(d => `<option value="${d}">${d}</option>`).join("");
        if (doiSet.includes(oldVal)) doiSelect.value = oldVal;
        const doi = +doiSelect.value || doiSet[0];

        const tenList = list.filter(p => +p.generation === doi).map(p => p.fullName);
        tenSelect.innerHTML = tenList.map(t => `<option>${t}</option>`).join("");
    }

    chiSelect.onchange = doiSelect.onchange = refreshDropdowns;

    // ==================== INFO PANEL ====================
    function showInfo(p) {
        const box = document.getElementById("infoDetail");
        if (!p) {
            box.innerHTML = "<p>Không tìm thấy!</p>";
            return;
        }

        box.innerHTML = `
            ${p.anhCaNhan ? `<img src="${p.anhCaNhan}?ts=${Date.now()}" style="max-width:120px;border-radius:8px;float:right;margin-left:10px;">` : ""}
            <h3>${p.fullName}</h3>
            <p><strong>Thường gọi:</strong> ${p.nickname || ""}</p>
            <p><strong>Chi:</strong> ${p.chi}</p>
            <p><strong>Đời thứ:</strong> ${p.generation}</p>
            <p><strong>Cha:</strong> ${p.parent || ""}</p>
            <p><strong>Chức nghiệp:</strong> ${p.job || ""}</p>
            <p><strong>Sinh:</strong> ${p.birth || ""}</p>
            <p><strong>Mất(kỵ):</strong> ${p.death || ""}</p>
            <p><strong>Mộ táng:</strong> ${p.grave || ""}</p>
            <p><strong>Vị trí Maps:</strong> ${p.map ? `<a href="${p.map}" target="_blank">Tìm mộ</a>` : ""}</p>
            <p><strong>Ghi chú:</strong> ${p.note || ""}</p>
            <p><strong>Sanh Hạ:</strong> ${p.ky || ""}</p>
            ${p.wives?.length ? `
                <h4>VỢ (CHỒNG) - CON</h4>
                ${p.wives.map(w => `
                    <div style="margin:5px 0;padding:5px;border-left:3px solid #8B0000">
                        <p><strong>Vợ:</strong> ${w.name || ""}</p>
                        <p><strong>Nguyên quán:</strong> ${w.origin || ""}</p>
                        <p><strong>Sinh:</strong> ${w.birth || ""}</p>
                        <p><strong>Mất:</strong> ${w.death || ""}</p>
                        <p><strong>Mộ táng:</strong> ${w.grave || ""}</p>
                        <p><strong>Con:</strong></p>
                        <ul>${(w.children || []).map(c => `<li>${c}</li>`).join("")}</ul>
                    </div>
                `).join("")}
            ` : ""}
        `;
    }

    document.getElementById("searchBtn").onclick = () => {
        const p = people.find(x => x.fullName === tenSelect.value);
        if (!p) return alert("Không tìm thấy!");
        showInfo(p);
        drawTree(p.fullName);
    };

    // ==================== TREE ====================
    function resetChildren() {
        people.forEach(p => p.children = []);
    }

    function renderFullTree() {
        resetChildren();
        const byName = Object.fromEntries(people.map(p => [p.fullName, p]));
        const roots = [];
        people.forEach(p => {
            const parent = byName[p.parent];
            if (parent) parent.children.push(p);
            else roots.push(p);
        });
        renderTree({ name: "Gia phả", children: roots });
    }

    function getChildren(nodeName) {
        return people.filter(p => p.parent === nodeName).map(child => ({ ...child, children: [] }));
    }

    // Chỉ show 1 node khi load, tất cả các node xếp chồng
    function drawTree(centerName = null) {
        resetChildren();
        if (!centerName) {
            // Nếu chưa chọn ai → show 1 node chính giữa
            renderTree({ name: "Gia phả", children: [] });
            return;
        }

        const center = people.find(p => p.fullName === centerName);
        if (!center) { renderFullTree(); return; }

        const byName = Object.fromEntries(people.map(p => [p.fullName, p]));

        let parent = null;
        if (center.parent && byName[center.parent]) parent = JSON.parse(JSON.stringify(byName[center.parent]));

        const centerNode = JSON.parse(JSON.stringify(center));
        centerNode.children = getChildren(center.fullName);

        const treeData = parent
            ? { name: "Gia phả", children: [{ ...parent, children: [centerNode] }] }
            : { name: "Gia phả", children: [centerNode] };

        renderTree(treeData);
        showInfo(center);
    }

    function renderTree(treeData) {
        const svg = d3.select("#genealogyTree");
        svg.selectAll("*").remove();

        const width = document.querySelector(".tree-panel").offsetWidth;
        const height = 700;

        const root = d3.hierarchy(treeData);
        const treeLayout = d3.tree().size([height, width - 200]);
        treeLayout(root);

        svg.append("g")
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("fill", "none")
            .attr("stroke", "#8B0000")
            .attr("stroke-width", 2)
            .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

        const node = svg.append("g")
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", (e, d) => { if (d.data.fullName) { drawTree(d.data.fullName); showInfo(d.data); } });

        node.append("rect")
            .attr("width", 210)
            .attr("height", 60)
            .attr("x", -105)
            .attr("y", -30)
            .attr("rx", 10)
            .attr("fill", "#fff4cc")
            .attr("stroke", "#8B0000");

        node.filter(d => d.data.anhCaNhan)
            .append("image")
            .attr("xlink:href", d => d.data.anhCaNhan + "?ts=" + Date.now())
            .attr("x", -100)
            .attr("y", -25)
            .attr("width", 50)
            .attr("height", 50)
            .attr("clip-path", "circle(25px at 25px 25px)");

        node.append("text")
            .attr("x", -40)
            .attr("dy", 5)
            .attr("text-anchor", "start")
            .text(d => d.data.fullName || "(Chưa nhập)");
    }

    // ==================== ZOOM ====================
    let zoom = 1;
    zoomIn.onclick = () => { zoom += .1; genealogyTree.style.transform = `scale(${zoom})`; };
    zoomOut.onclick = () => { zoom = Math.max(.5, zoom - .1); genealogyTree.style.transform = `scale(${zoom})`; };

    // ==================== TOÀN BỘ ====================
    document.getElementById("allBtn").onclick = () => { drawTree(null); };

    // ==================== CHATBOX ====================
    const chatboxBody = document.getElementById("chatbox-body");
    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");
    const chatboxToggle = document.getElementById("chatbox-toggle");
    const apiKey = "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";

    async function askAI(q) {
        try {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "mistralai/mistral-small-3.1-24b-instruct:free", messages: [{ role: "system", content: "Bạn là trợ lý gia phả, trả lời ngắn gọn, dễ hiểu." }, { role: "user", content: q }] })
            });
            const data = await res.json();
            return data.choices?.[0]?.message?.content || "Không có phản hồi.";
        } catch (err) { console.error("Chatbox AI Error:", err); return "Không kết nối AI."; }
    }

    chatSend.onclick = async () => {
        const text = chatInput.value.trim(); if (!text) return;
        chatboxBody.innerHTML += `<div><b>Bạn:</b> ${text}</div>`;
        const reply = await askAI(text);
        chatboxBody.innerHTML += `<div><em>AI:</em> ${reply}</div>`;
        chatboxBody.scrollTop = chatboxBody.scrollHeight;
        chatInput.value = "";
    };

    chatboxToggle.onclick = () => { document.getElementById("chatbox").classList.toggle("minimized"); };

    // ==================== ADMIN PASS ====================
    btnAdmin.onclick = () => {
        const pass = prompt("🔑 Nhập mật khẩu quản trị:");
        if (pass === store.adminPass || pass === "1234") window.location.href = "admin.html";
        else alert("❌ Sai mật khẩu!");
    };

    // ==================== INIT ====================
    refreshDropdowns();
    drawTree(null);
}
