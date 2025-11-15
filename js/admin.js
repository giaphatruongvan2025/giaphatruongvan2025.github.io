document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Admin v3.4 FINAL loaded");

  const lsKey = "giaPhaData";
  let store = JSON.parse(localStorage.getItem(lsKey) || "{}");
  if (!store.people) store = { people: [], eventImage: "", youtubeLink: "", adminPass: "1234" };

  const people = store.people;

  /* ====================== SAVE ====================== */
  function saveStore() {
    localStorage.setItem(lsKey, JSON.stringify(store));
  }

  /* ===================================================
     ================ ẢNH SỰ KIỆN ======================
     =================================================== */
  const eventImageInput = document.getElementById("eventImageInput");
  const eventImagePreview = document.getElementById("eventImagePreview");

  if (store.eventImage) eventImagePreview.src = store.eventImage;

  eventImageInput?.addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      store.eventImage = ev.target.result;
      eventImagePreview.src = ev.target.result;
      saveStore();
    };
    r.readAsDataURL(f);
  });

  document.getElementById("btnDeleteEventImage").onclick = () => {
    store.eventImage = "";
    eventImagePreview.src = "";
    saveStore();
  };

  /* ===================================================
     ==================== YOUTUBE ======================
     =================================================== */
  const youtubeInput = document.getElementById("youtubeInput");
  const youtubePreview = document.getElementById("youtubePreview");

  if (store.youtubeLink) {
    youtubePreview.src = store.youtubeLink;
    youtubeInput.value = store.youtubeLink;
  }

  youtubeInput?.addEventListener("change", () => {
    const link = youtubeInput.value.trim();
    const m = link.match(/(?:v=|be\/)([a-zA-Z0-9_-]{11})/);
    if (!m) return;

    const embed = `https://www.youtube.com/embed/${m[1]}`;
    store.youtubeLink = embed;
    youtubePreview.src = embed;
    saveStore();
  });

  document.getElementById("btnDeleteYoutube").onclick = () => {
    youtubeInput.value = "";
    youtubePreview.src = "";
    store.youtubeLink = "";
    saveStore();
  };

  /* ===================================================
     ===================== ĐỔI PASS ====================
     =================================================== */
  document.getElementById("btnChangePass").onclick = () => {
    const old = prompt("Nhập mật khẩu hiện tại:");
    if (old !== store.adminPass) return alert("❌ Sai mật khẩu!");

    const np = prompt("Nhập mật khẩu mới:");
    if (!np) return;

    store.adminPass = np;
    saveStore();
    alert("✅ Đổi mật khẩu thành công!");
  };

  /* ===================================================
     ===================== DROPDOWN ====================
     =================================================== */
  const chiSelect = document.getElementById("chiSelect");
  const chiInput = document.getElementById("chiInput");
  const doiSelect = document.getElementById("doiSelect");
  const tenSelect = document.getElementById("tenSelect");
  const parentSelect = document.getElementById("parentSelect");

  const chiList = ["Văn", "Bá", "Mạnh", "Trọng", "Quý", "Thúc"];
  chiSelect.innerHTML = chiList.map(c => `<option>${c}</option>`).join("");
  chiInput.innerHTML = chiList.map(c => `<option>${c}</option>`).join("");

  function refreshDropdowns() {
    const validPeople = people.filter(p => p.fullName?.trim());

    const doiSet = [...new Set(
      validPeople.map(p => parseInt(p.generation, 10))
    )].filter(n => n > 0).sort((a, b) => a - b);

    if (doiSet.length === 0) doiSet.push(1);

    const oldDoi = parseInt(doiSelect.value || "0", 10);
    doiSelect.innerHTML = doiSet.map(d => `<option>${d}</option>`).join("");

    if (doiSet.includes(oldDoi)) doiSelect.value = oldDoi;

    const chi = chiSelect.value || chiList[0];
    const doi = parseInt(doiSelect.value || doiSet[0], 10);

    const list = validPeople.filter(p =>
      p.chi === chi && parseInt(p.generation, 10) === doi
    ).map(p => p.fullName);

    tenSelect.innerHTML =
      list.length ? list.map(n => `<option>${n}</option>`).join("") :
      `<option>--Không có--</option>`;
  }

  chiSelect.addEventListener("change", refreshDropdowns);
  doiSelect.addEventListener("change", refreshDropdowns);

  refreshDropdowns();

  /* ===================================================
     ===================== FORM ========================
     =================================================== */
  function v(id) {
    return document.getElementById(id)?.value.trim() || "";
  }

  function s(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? "";
  }

  /* ===================================================
     ================== UPDATE CHA/MẸ ==================
     =================================================== */
  function updateParentDropdown() {
    const chi = document.getElementById("chiInput")?.value || "Văn";
    const doi = parseInt(document.getElementById("generation")?.value || "0", 10);

    if (!parentSelect) return;

    if (doi <= 1) {
      parentSelect.innerHTML = `<option value="">(Không có người đời trước)</option>`;
      return;
    }

    const parents = people.filter(p =>
      p.chi === chi &&
      parseInt(p.generation, 10) === doi - 1 &&
      p.fullName?.trim()
    );

    parentSelect.innerHTML =
      parents.length === 0
        ? `<option value="">(Không có người đời trước)</option>`
        : `<option value="">(Không chọn)</option>` +
          parents.map(p => `<option value="${p.fullName}">${p.fullName}</option>`).join("");
  }

  document.getElementById("chiInput")?.addEventListener("change", updateParentDropdown);
  document.getElementById("generation")?.addEventListener("input", updateParentDropdown);

  /* ===================================================
     ================= COLLECT FORM ====================
     =================================================== */
  function collectFormData() {
    const p = {
      fullName: v("fullName"),
      nickname: v("nickname"),
      chi: v("chiInput"),
      generation: parseInt(v("generation"), 10) || 1,
      job: v("job"),
      birth: v("birth"),
      death: v("death"),
      ky: v("ky"),
      grave: v("grave"),
      map: v("map"),
      sanh: v("sanh"),
      note: v("note"),
      parent: v("parentSelect"),
      anhCaNhan: personalImagePreview.src || "",
      wives: []
    };

    document.querySelectorAll(".wife-card").forEach(w => {
      const wife = {
        name: w.querySelector(".wifeName")?.value.trim(),
        origin: w.querySelector(".wifeOrigin")?.value.trim(),
        job: w.querySelector(".wifeJob")?.value.trim(),
        birth: w.querySelector(".wifeBirth")?.value.trim(),
        death: w.querySelector(".wifeDeath")?.value.trim(),
        ky: w.querySelector(".wifeKy")?.value.trim(),
        grave: w.querySelector(".wifeGrave")?.value.trim(),
        map: w.querySelector(".wifeMap")?.value.trim(),
        children: []
      };

      w.querySelectorAll(".childName").forEach(c => {
        if (c.value.trim()) wife.children.push(c.value.trim());
      });

      p.wives.push(wife);
    });

    return p;
  }

  /* ===================================================
     ==================== FILL FORM ====================
     =================================================== */
  function fillForm(p) {
    s("fullName", p.fullName);
    s("nickname", p.nickname);
    s("chiInput", p.chi);
    s("generation", p.generation);
    s("job", p.job);
    s("birth", p.birth);
    s("death", p.death);
    s("ky", p.ky);
    s("grave", p.grave);
    s("map", p.map);
    s("sanh", p.sanh);
    s("note", p.note);

    // Ảnh cá nhân
    if (p.anhCaNhan) {
      personalImagePreview.src = p.anhCaNhan;
      personalImagePreview.style.display = "block";
    } else {
      personalImagePreview.src = "";
      personalImagePreview.style.display = "none";
    }

    // Update dropdown cha/mẹ TRƯỚC khi gán value
    setTimeout(() => {
      updateParentDropdown();
      parentSelect.value = p.parent || "";
    }, 50);

    // Vợ - Con
    wivesContainer.innerHTML = "";
    if (Array.isArray(p.wives)) {
      p.wives.forEach(w => {
        const wDiv = addWifeForm(w);
        if (w.children) {
          w.children.forEach(c => {
            const cDiv = document.createElement("div");
            cDiv.className = "form-group";
            cDiv.innerHTML = `
              <label>Con:</label>
              <input type="text" class="childName" value="${c}">
              <button type="button" class="btn btn-del remove-child">❌</button>
            `;
            wDiv.querySelector(".children").appendChild(cDiv);
            cDiv.querySelector(".remove-child").onclick = () => cDiv.remove();
          });
        }
      });
    }
  }

  /* ===================================================
     =================== NÚT CHÍNH =====================
     =================================================== */
  document.getElementById("btnAdd").onclick = () => {
    const p = collectFormData();
    p.id = Date.now();

    people.push(p);
    saveStore();
    refreshDropdowns();

    alert("➕ Đã thêm người mới!");

    document.getElementById("personForm").reset();
    wivesContainer.innerHTML = "";
    personalImagePreview.src = "";
    updateParentDropdown();
  };

  document.getElementById("btnSave").onclick = () => {
    const p = collectFormData();
    const i = people.findIndex(x => x.fullName === p.fullName && x.chi === p.chi);

    if (i >= 0) people[i] = p;
    else people.push(p);

    saveStore();
    refreshDropdowns();
    alert("💾 Đã lưu!");
  };

  document.getElementById("btnDelete").onclick = () => {
    const name = v("fullName");
    const chi = v("chiInput");

    const i = people.findIndex(p => p.fullName === name && p.chi === chi);
    if (i < 0) return alert("❌ Không tìm thấy người để xóa");

    people.splice(i, 1);
    saveStore();
    refreshDropdowns();
    alert("🗑 Đã xóa!");

    document.getElementById("personForm").reset();
    wivesContainer.innerHTML = "";
    personalImagePreview.src = "";
    updateParentDropdown();
  };

  document.getElementById("btnQuickSearch").onclick = () => {
    const chi = chiSelect.value;
    const doi = +doiSelect.value;
    const ten = tenSelect.value;

    const p = people.find(
      x => x.chi === chi &&
      +x.generation === doi &&
      x.fullName === ten
    );

    if (!p) return alert("Không tìm thấy!");

    fillForm(p);
  };

  document.getElementById("btnExport").onclick = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "giaPha.json";
    a.click();
  };

  document.getElementById("btnImport").onclick = () => {
    const i = document.createElement("input");
    i.type = "file";
    i.accept = ".json";
    i.onchange = e => {
      const f = e.target.files[0];
      const r = new FileReader();
      r.onload = ev => {
        store = JSON.parse(ev.target.result);
        localStorage.setItem(lsKey, JSON.stringify(store));
        alert("📥 Nạp JSON thành công!");
        location.reload();
      };
      r.readAsText(f);
    };
    i.click();
  };

  document.getElementById("btnSaveLocal").onclick = () => {
    saveStore();
    alert("💾 Đã lưu LocalStorage!");
  };

  document.getElementById("btnHome").onclick = () => {
    window.location.href = "index.html";
  };

  /* ===================================================
     ===================== VỢ / CON ====================
     =================================================== */
  const wivesContainer = document.getElementById("wivesContainer");
  document.getElementById("btnAddWife").onclick = () => addWifeForm();

  function addWifeForm(w = {}) {
    const d = document.createElement("div");
    d.className = "wife-card";

    d.innerHTML = `
      <h4>Vợ
        <button type="button" class="btn btn-del remove-wife">❌</button>
      </h4>

      <div class="form-group"><label>Họ tên:</label><input type="text" class="wifeName" value="${w.name || ""}"></div>
      <div class="form-group"><label>Nguyên quán:</label><input type="text" class="wifeOrigin" value="${w.origin || ""}"></div>
      <div class="form-group"><label>Chức tước:</label><input type="text" class="wifeJob" value="${w.job || ""}"></div>
      <div class="form-group"><label>Sinh:</label><input type="text" class="wifeBirth" value="${w.birth || ""}"></div>
      <div class="form-group"><label>Mất:</label><input type="text" class="wifeDeath" value="${w.death || ""}"></div>
      <div class="form-group"><label>Kỵ:</label><input type="text" class="wifeKy" value="${w.ky || ""}"></div>
      <div class="form-group"><label>Mộ táng:</label><input type="text" class="wifeGrave" value="${w.grave || ""}"></div>
      <div class="form-group"><label>Vị trí maps:</label><input type="text" class="wifeMap" value="${w.map || ""}"></div>

      <button type="button" class="btn btn-add add-child">➕ Thêm con</button>
      <div class="children"></div>
    `;

    wivesContainer.appendChild(d);

    d.querySelector(".remove-wife").onclick = () => d.remove();

    d.querySelector(".add-child").onclick = () => {
      const c = document.createElement("div");
      c.className = "form-group";
      c.innerHTML = `
        <label>Con:</label>
        <input type="text" class="childName">
        <button type="button" class="btn btn-del remove-child">❌</button>
      `;
      d.querySelector(".children").appendChild(c);
      c.querySelector(".remove-child").onclick = () => c.remove();
    };

    return d;
  }

  /* ===================================================
     ================== ẢNH CÁ NHÂN ====================
     =================================================== */
  const personalImageInput = document.getElementById("personalImageInput");
  const personalImagePreview = document.getElementById("personalImagePreview");

  personalImageInput?.addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;

    const r = new FileReader();
    r.onload = ev => {
      personalImagePreview.src = ev.target.result;
      personalImagePreview.style.display = "block";
    };
    r.readAsDataURL(f);
  });

  document.getElementById("btnDeletePersonalImage")?.addEventListener("click", () => {
    personalImagePreview.src = "";
    personalImagePreview.style.display = "none";
    personalImageInput.value = "";
  });

});
