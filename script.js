fetch("data.json")
  .then((res) => res.json())
  .then((data) => {
    createTable(data);
  })
  .catch((error) => {
    console.error("Error fetching data.json:", error);
  });

// Exceldeki kimi ortaq maddeleri qruplamaq ve coxlu maddeleri birleştirmek ucun
function groupByArticle(data) {
  return data.reduce((acc, item) => {
    if (!acc[item.madde]) acc[item.madde] = [];
    acc[item.madde].push(item);
    return acc;
  }, {});
}

let isPointHidden = false;
let isPenaltyHidden = false;
let currentBalSortOrder = "none"; // 'none', 'asc', 'desc'
let currentPenaltySortOrder = "none"; // 'none', 'asc', 'desc'
let originalData = [];

function getNumericValue(valueString, hasDecimals = false) {
  if (!valueString || valueString === "" || valueString === "-") {
    return 0;
  }

  const regex = hasDecimals ? /(\d+(?:\.\d+)?)/ : /(\d+)/;
  const match = valueString.match(regex);
  return match ? (hasDecimals ? parseFloat(match[1]) : parseInt(match[1])) : 0;
}

function sortData(data, order, field, hasDecimals = false) {
  if (order === "none") {
    return [...originalData];
  }

  return [...data].sort((a, b) => {
    const aVal = getNumericValue(a[field], hasDecimals);
    const bVal = getNumericValue(b[field], hasDecimals);

    return order === "asc" ? aVal - bVal : bVal - aVal;
  });
}

function createTable(data) {
  if (originalData.length === 0) {
    originalData = [...data];
  }

  const container = document.getElementById("table-container");
  if (document.querySelector("table")) {
    container.innerHTML = "";
  }

  const table = document.createElement("table");
  let tbodyHTML = "";

  //   Sorting olanda maddeleri merge etmirik
  if (currentBalSortOrder !== "none" || currentPenaltySortOrder !== "none") {
    data.forEach((item) => {
      tbodyHTML += `<tr>
        <td>${item.madde}</td>
        <td>${item.alt_madde}</td>
        <td>${item.ad}</td>
        <td class="points">${item.bal || "-"}</td>
        <td class="penaltys">${item.cerime}</td>
        <td>${item.inzibati_həbs || "-"}</td>
        <td>${item.əlavə || "-"}</td>
        </tr>`;
    });
  } else {
    const maddeGroups = groupByArticle(data);

    for (const madde in maddeGroups) {
      const group = maddeGroups[madde];
      group.forEach((item, index) => {
        tbodyHTML += `<tr>`;
        if (index === 0) {
          tbodyHTML += `<td rowspan="${group.length}" class="merged-madde">${item.madde}</td>`;
        }
        tbodyHTML += `
          <td>${item.alt_madde}</td>
          <td>${item.ad}</td>
          <td class="points">${item.bal || "-"}</td>
          <td class="penaltys">${item.cerime}</td>
          <td>${item.inzibati_həbs || "-"}</td>
          <td>${item.əlavə || "-"}</td>
          </tr>`;
      });
    }
  }

  // Sort ediləndə bal və cərimə sütunlarının simvollarını sort növünə görə dəyişirik
  function getSortButtonText(column, order) {
    const baseText = column === "bal" ? "Bal" : "Cərimə";
    switch (order) {
      case "asc":
        return baseText + " ↑";
      case "desc":
        return baseText + " ↓";
      default:
        return baseText;
    }
  }

  table.innerHTML = `
    <thead>
      <tr>
        <th>Madde</th>
        <th>Alt Madde</th>
        <th>Açıqlama</th>
        <th id="table-point" style="cursor: pointer; user-select: none;">${getSortButtonText(
          "bal",
          currentBalSortOrder
        )}</th>
        <th id="table-penalty" style="cursor: pointer; user-select: none;">${getSortButtonText(
          "penalty",
          currentPenaltySortOrder
        )}</th>
        <th>İnzibati Həbs</th>
        <th>Əlavə</th>
      </tr>
    </thead>
    <tbody>
      ${tbodyHTML}
    </tbody>
  `;

  container.appendChild(table);

  document
    .getElementById("table-point")
    .addEventListener("click", handleBalSort);
  document
    .getElementById("table-penalty")
    .addEventListener("click", handlePenaltySort);
}

function handleBalSort() {
  currentPenaltySortOrder = "none";

  if (currentBalSortOrder === "none") {
    currentBalSortOrder = "asc";
  } else if (currentBalSortOrder === "asc") {
    currentBalSortOrder = "desc";
  } else {
    currentBalSortOrder = "none";
  }

  const sortedData = sortData(originalData, currentBalSortOrder, "bal", false);
  createTable(sortedData);

  if (isPointHidden) {
    togglePoint();
  }
  if (isPenaltyHidden) {
    togglePenalty();
  }
}

// Cəriməyə görə sıralama (Əsas funksiya bu deyil, bu controllerdi bir növ)
function handlePenaltySort() {
  currentBalSortOrder = "none";

  // Sort növləri arasında cycle: none -> artan -> azalan -> none
  if (currentPenaltySortOrder === "none") {
    currentPenaltySortOrder = "asc";
  } else if (currentPenaltySortOrder === "asc") {
    currentPenaltySortOrder = "desc";
  } else {
    currentPenaltySortOrder = "none";
  }

  const sortedData = sortData(
    originalData,
    currentPenaltySortOrder,
    "cerime",
    true
  );
  createTable(sortedData);

  // Sort etmək istədiyimiz zaman hansısa sütün gizlidirsə, onu aktivləşdiririk
  if (isPointHidden) {
    togglePoint();
  }
  if (isPenaltyHidden) {
    togglePenalty();
  }
}

let pointContentBackup = [];
function togglePoint() {
  const points = document.querySelectorAll(".points");
  if (!isPointHidden) {
    pointContentBackup = [];
    points.forEach((cell, idx) => {
      pointContentBackup[idx] = cell.textContent;
      cell.textContent = "";
    });
  } else {
    points.forEach((cell, idx) => {
      cell.textContent = pointContentBackup[idx];
    });
  }
  isPointHidden = !isPointHidden;
}

// Biz DOM'dan silirik ki developer toolsdan belə baxıla bilməsin gizlənilmiş cərimə vəya bal dəyərinə, bu silmə əməliyyatının birdə tərsi, restore əməliyyatı var deyə başqa bir arraydə saxlayırıq
let penaltyContentBackup = [];
function togglePenalty() {
  const penalties = document.querySelectorAll(".penaltys");
  if (!isPenaltyHidden) {
    penaltyContentBackup = [];
    penalties.forEach((cell, idx) => {
      penaltyContentBackup[idx] = cell.textContent;
      // Burda için sildik
      cell.textContent = "";
    });
  } else {
    penalties.forEach((cell, idx) => {
      // Burda isə geri qaytardıq
      cell.textContent = penaltyContentBackup[idx];
    });
  }
  // State dəyişirik
  isPenaltyHidden = !isPenaltyHidden;
}

// Bal vəya Cərimə sütununa sağ kunopka ilə basılanda dəyərlər gizlənir
document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("contextmenu", function (e) {
    if (e.target.id === "table-penalty") {
      e.preventDefault();
      togglePenalty();
    }
    if (e.target.id === "table-point") {
      e.preventDefault();
      togglePoint();
    }
  });
});
