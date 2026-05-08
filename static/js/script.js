(() => {
  const storageKey = "nw_theme";

  function setTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem(storageKey, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-bs-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  function showLoading() {
    const spinner = document.getElementById("loadingSpinner");
    const text = document.getElementById("loadingText");
    const btn = document.getElementById("analyzeBtn");
    if (spinner) spinner.classList.remove("d-none");
    if (text) text.classList.remove("d-none");
    if (btn) btn.setAttribute("disabled", "disabled");
  }

  function hideLoading() {
    const spinner = document.getElementById("loadingSpinner");
    const text = document.getElementById("loadingText");
    const btn = document.getElementById("analyzeBtn");
    if (spinner) spinner.classList.add("d-none");
    if (text) text.classList.add("d-none");
    if (btn) btn.removeAttribute("disabled");
  }

  function normalizeSeq(val) {
    // Remove FASTA headers (lines starting with '>'), then strip whitespace
    const raw = String(val || "");
    const noHeaders = raw
      .split(/\r?\n/)
      .filter((ln) => !ln.trimStart().startsWith(">"))
      .join("");
    return noHeaders.replace(/\s+/g, "").toUpperCase();
  }

  function getAllowedRegex(type, allowAmbiguous) {
    const ambNuc = "RYSWKMBDHVN";
    const ambProt = "BXZ";
    if (type === "DNA") return new RegExp("^[" + "ATCG" + (allowAmbiguous ? ambNuc : "") + "]+$");
    if (type === "RNA") return new RegExp("^[" + "AUCG" + (allowAmbiguous ? ambNuc : "") + "]+$");
    return new RegExp("^[" + "ACDEFGHIKLMNPQRSTVWY" + (allowAmbiguous ? ambProt : "") + "]+$");
  }

  function attachIndexHandlers() {
    const form = document.getElementById("analyzeForm");
    if (!form) return;

    const seq1 = document.getElementById("sequence1");
    const seq2 = document.getElementById("sequence2");
    const type = document.getElementById("sequence_type");
    const allowAmbiguous = document.getElementById("allow_ambiguous");
    const resetBtn = document.getElementById("resetBtn");

    function setInvalid(el, message) {
      el.classList.add("is-invalid");
      el.setCustomValidity(message || "Invalid");
    }
    function clearInvalid(el) {
      el.classList.remove("is-invalid");
      el.setCustomValidity("");
    }

    function validate() {
      let ok = true;
      const t = type.value;
      const amb = allowAmbiguous ? allowAmbiguous.checked : false;
      const r = getAllowedRegex(t, amb);

      const s1 = normalizeSeq(seq1.value);
      const s2 = normalizeSeq(seq2.value);

      if (!s1) {
        setInvalid(seq1, "Sequence 1 required");
        ok = false;
      } else if (!r.test(s1)) {
        setInvalid(seq1, "Contains invalid characters for selected type");
        ok = false;
      } else {
        clearInvalid(seq1);
      }

      if (!s2) {
        setInvalid(seq2, "Sequence 2 required");
        ok = false;
      } else if (!r.test(s2)) {
        setInvalid(seq2, "Contains invalid characters for selected type");
        ok = false;
      } else {
        clearInvalid(seq2);
      }
      return ok;
    }

    form.addEventListener("submit", (e) => {
      hideLoading();
      if (!validate()) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      showLoading();
    });

    [seq1, seq2, type, allowAmbiguous].filter(Boolean).forEach((el) => {
      el.addEventListener("input", () => {
        el.classList.remove("is-invalid");
        el.setCustomValidity("");
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        form.reset();
        [seq1, seq2].forEach((el) => {
          el.classList.remove("is-invalid");
          el.setCustomValidity("");
        });
        hideLoading();
        seq1.focus();
      });
    }
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "readonly");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  function attachResultsHandlers() {
    const alignmentEl = document.getElementById("alignmentText");
    if (!alignmentEl) return;

    const copyBtn = document.getElementById("copyAlignmentBtn");
    const dlBtn = document.getElementById("downloadTxtBtn");
    const toast = document.getElementById("copyToast");

    const alignmentText = alignmentEl.textContent || "";

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        await copyToClipboard(alignmentText.trim() + "\n");
        if (toast) {
          toast.classList.remove("d-none");
          window.setTimeout(() => toast.classList.add("d-none"), 1600);
        }
      });
    }

    if (dlBtn) {
      dlBtn.addEventListener("click", () => {
        const blob = new Blob([alignmentText.trim() + "\n"], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "needleman_wunsch_alignment.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    const toggle = document.getElementById("themeToggle");
    if (toggle) toggle.addEventListener("click", toggleTheme);
    attachIndexHandlers();
    attachResultsHandlers();
    hideLoading();
  });
})();

