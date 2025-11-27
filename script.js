const carConfigs = {
  A12: { lowMin: 112, lowMax: 125 },
  A12x: { lowMin: 113, lowMax: 120 },
  Metriks: { lowMin: 106, lowMax: 115 }
};

const gridContainer = document.getElementById("gridContainer");
const unitNote = document.getElementById("unitNote");

function detectUnit(value) {
  // Heuristic: <= 3 means inches, otherwise millimeters
  if (value <= 3) return "inch";
  return "mm";
}

function createGrid(car, tireValue, spurStart, pinionStart, spurRange, pinionRange) {
  const unit = detectUnit(tireValue);
  let tireInches, tireMm;

  if (unit === "inch") {
    tireInches = tireValue;
    tireMm = tireInches * 25.4;
  } else {
    tireMm = tireValue;
    tireInches = tireMm / 25.4;
  }

  const config = carConfigs[car];
  const spurValues = [];
  const pinionValues = [];

  for (let s = spurStart - spurRange; s <= spurStart + spurRange; s++) {
    if (s > 0) spurValues.push(s);
  }
  for (let p = pinionStart - pinionRange; p <= pinionStart + pinionRange; p++) {
    if (p > 0) pinionValues.push(p);
  }

  const table = document.createElement("table");

  // Header rows
  const thead = document.createElement("thead");
  const topHeaderRow = document.createElement("tr");
  const topCorner = document.createElement("th");
  topCorner.classList.add("sticky-left");
  topCorner.innerText = "";
  topHeaderRow.appendChild(topCorner);
  const spurLabel = document.createElement("th");
  spurLabel.colSpan = spurValues.length;
  spurLabel.innerText = "Spur Gear";
  topHeaderRow.appendChild(spurLabel);
  thead.appendChild(topHeaderRow);

  const headerRow = document.createElement("tr");
  const cornerTh = document.createElement("th");
  cornerTh.classList.add("sticky-left");
  cornerTh.innerText = "Pinion";
  headerRow.appendChild(cornerTh);

  spurValues.forEach((spur) => {
    const th = document.createElement("th");
    th.innerText = spur + "T";
    if (spur === spurStart) {
      th.classList.add("selected-spur-header");
    }
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  pinionValues.forEach((pinion) => {
    const row = document.createElement("tr");

    const rowHeader = document.createElement("th");
    rowHeader.classList.add("sticky-left");
    rowHeader.innerText = pinion + "T";
    if (pinion === pinionStart) {
      rowHeader.classList.add("selected-pinion-header");
    }
    row.appendChild(rowHeader);

    spurValues.forEach((spur) => {
      const ratio = spur / pinion;
      const rolloutInches = Math.PI * tireInches / ratio;
      const rolloutMm = Math.PI * tireMm / ratio;
      const totalTeeth = spur + pinion; // used only for highlighting

      const td = document.createElement("td");
      td.innerHTML =
        `<span class="rollout-sae">${rolloutInches.toFixed(3)} in</span><br>` +
        `<span class="rollout-metric">${rolloutMm.toFixed(1)} mm</span>`;

      if (pinion === pinionStart && spur === spurStart) {
        td.classList.add("selected-gear");
      }

      // Highlight based on combined tooth count
      if (totalTeeth >= config.lowMin && totalTeeth <= config.lowMax) {
        td.classList.add("highlight");
      }

      row.appendChild(td);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  // Clear and rebuild container
  gridContainer.innerHTML = "";

  const swipeNote = document.createElement("div");
  swipeNote.classList.add("table-note");
  swipeNote.innerText = "Swipe horizontally to see all gear options on mobile.";
  gridContainer.appendChild(swipeNote);

  const legend = document.createElement("div");
  legend.classList.add("legend");

  const pill1 = document.createElement("div");
  pill1.classList.add("legend-pill");
  const box1 = document.createElement("div");
  box1.classList.add("color-box", "highlight");
  pill1.appendChild(box1);
  const label1 = document.createElement("span");
  label1.innerText = `Preferred total teeth range for ${car}: ${config.lowMin}-${config.lowMax}`;
  pill1.appendChild(label1);
  legend.appendChild(pill1);

  const pill2 = document.createElement("div");
  pill2.classList.add("legend-pill");
  const label2 = document.createElement("span");
  label2.innerHTML =
    `<span class="rollout-sae">SAE (in)</span> on top, ` +
    `<span class="rollout-metric">Metric (mm)</span> below`;
  pill2.appendChild(label2);
  legend.appendChild(pill2);

  gridContainer.appendChild(legend);
  gridContainer.appendChild(table);
  gridContainer.style.display = "block";

  // Keep header widths aligned with body cells across narrow viewports
  syncHeaderWidths(table);

  unitNote.textContent =
    unit === "inch"
      ? `Detected tire unit: inches (SAE). Metric values are converted from inches.`
      : `Detected tire unit: millimeters (metric). SAE values are converted from mm.`;

  // Center the view on the currently selected spur/pinion combo
  const selectedCell = table.querySelector(".selected-gear");
  if (selectedCell) {
    const cellRect = selectedCell.getBoundingClientRect();
    const containerRect = gridContainer.getBoundingClientRect();
    const targetLeft =
      gridContainer.scrollLeft +
      (cellRect.left - containerRect.left) -
      (containerRect.width / 2 - cellRect.width / 2);
    const targetTop =
      gridContainer.scrollTop +
      (cellRect.top - containerRect.top) -
      (containerRect.height / 2 - cellRect.height / 2);

    gridContainer.scrollTo({
      left: Math.max(0, targetLeft),
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }
}

function syncHeaderWidths(table) {
  const thead = table.querySelector("thead");
  const firstBodyRow = table.querySelector("tbody tr");
  if (!thead || !firstBodyRow) return;

  const bodyCells = Array.from(firstBodyRow.children);
  const headerRows = thead.querySelectorAll("tr");
  if (headerRows.length < 2) return;

  const topHeaderRow = headerRows[0];
  const spurHeaderRow = headerRows[1];

  const cornerWidth = bodyCells[0].getBoundingClientRect().width;
  [topHeaderRow.children[0], spurHeaderRow.children[0]].forEach((cell) => {
    if (cell) cell.style.width = `${cornerWidth}px`;
  });

  let spurTotal = 0;
  for (let i = 1; i < bodyCells.length; i++) {
    const w = bodyCells[i].getBoundingClientRect().width;
    spurTotal += w;
    const headerCell = spurHeaderRow.children[i];
    if (headerCell) headerCell.style.width = `${w}px`;
  }

  const spurLabelCell = topHeaderRow.children[1];
  if (spurLabelCell) {
    spurLabelCell.style.width = `${spurTotal}px`;
  }
}

// Central function: read inputs & rebuild grid
function updateGrid() {
  const car = document.getElementById("car").value;
  const tireValue = parseFloat(document.getElementById("tireDiameter").value);
  const spurStart = parseInt(document.getElementById("spurStart").value, 10);
  const pinionStart = parseInt(document.getElementById("pinionStart").value, 10);

  if (!tireValue || tireValue <= 0 || !spurStart || !pinionStart) {
    // Don't show alerts on live updates; just avoid crashing
    return;
  }

  const isSmallScreen = window.matchMedia("(max-width: 480px)").matches;
  const spurRange = isSmallScreen ? 1 : 3;
  const pinionRange = 5;

  createGrid(car, tireValue, spurStart, pinionStart, spurRange, pinionRange);
}

/**
 * Initialize a wheel picker.
 * containerId: id of .wheel div
 * inputId: id of hidden input to update
 * values: array of JS numbers
 * formatFn: function(v) -> string for display
 * onChange: callback invoked after value changes
 */
function initWheel(containerId, inputId, values, formatFn, onChange) {
  const wheel = document.getElementById(containerId);
  const list = wheel.querySelector(".wheel-list");
  const hiddenInput = document.getElementById(inputId);

  // Build items
  list.innerHTML = "";
  values.forEach((v) => {
    const item = document.createElement("div");
    item.className = "wheel-item";
    item.textContent = formatFn(v);
    item.dataset.value = v;
    list.appendChild(item);
  });

  const items = Array.from(list.children);
  if (!items.length) return;

  const itemHeight = items[0].offsetHeight;
  const viewHeight = list.clientHeight;
  const style = window.getComputedStyle(list);
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const viewCenterOffset = viewHeight / 2;

  let currentIndex = 0;

  function valueFromIndex(idx) {
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    return values[clamped];
  }

  function updateSelected(idx) {
    items.forEach((el, i) => {
      el.classList.toggle("selected", i === idx);
    });
  }

  function applyIndex(idx, smooth) {
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    currentIndex = clamped;

    const itemCenter =
      paddingTop + clamped * itemHeight + itemHeight / 2;
    const targetScroll = itemCenter - viewCenterOffset;

    list.scrollTo({
      top: targetScroll,
      behavior: smooth ? "smooth" : "auto",
    });

    const newVal = valueFromIndex(clamped);
    hiddenInput.value = newVal;
    updateSelected(clamped);
    if (typeof onChange === "function") {
      onChange(newVal);
    }
  }

  // Initialize to current hidden input or nearest
  const currentVal = parseFloat(hiddenInput.value);
  let startIndex = values.findIndex((v) => v === currentVal);
  if (startIndex === -1) {
    let nearestIdx = 0;
    let bestDiff = Infinity;
    values.forEach((v, i) => {
      const d = Math.abs(v - currentVal);
      if (d < bestDiff) {
        bestDiff = d;
        nearestIdx = i;
      }
    });
    startIndex = nearestIdx;
  }
  applyIndex(startIndex, false);

  let scrollTimeout = null;

  function snapToNearest() {
    const scrollTop = list.scrollTop;
    const viewCenter = scrollTop + viewCenterOffset;
    const approxIndex =
      (viewCenter - paddingTop - itemHeight / 2) / itemHeight;
    const idx = Math.round(approxIndex);
    applyIndex(idx, true);
  }

  // Snap after touch/drag scroll stops
  list.addEventListener("scroll", () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(snapToNearest, 80);
  });

  // Click to select
  items.forEach((item, idx) => {
    item.addEventListener("click", () => {
      applyIndex(idx, true);
    });
  });

  // Mouse wheel: step exactly one item at a time
  wheel.addEventListener("wheel", (e) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    applyIndex(currentIndex + direction, false);
  });
}

// Init wheels and wiring on load
window.addEventListener("load", () => {
  // Prevent form submission (Enter key) from resetting values
  document.getElementById("rollout-form").addEventListener("submit", (e) => e.preventDefault());

  // Ranges (tweak as needed)
  const pinionValues = [];
  for (let v = 30; v <= 80; v++) {
    pinionValues.push(v);
  }
  const spurValues = [];
  for (let v = 60; v <= 90; v++) {
    spurValues.push(v);
  }

  // Initialize wheels with updateGrid as onChange callback
  initWheel("pinionWheel", "pinionStart", pinionValues, (v) => v.toString(), updateGrid);
  initWheel("spurWheel", "spurStart", spurValues, (v) => v.toString(), updateGrid);

  // Live updates from car + tire fields
  document.getElementById("car").addEventListener("change", updateGrid);
  document.getElementById("tireDiameter").addEventListener("input", updateGrid);
  window.addEventListener("resize", updateGrid);

  // Initial grid
  updateGrid();
});
