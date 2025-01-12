const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const shapeSelector = document.getElementById("shape");
const colorPicker = document.getElementById("color");
const lineWidthPicker = document.getElementById("lineWidth");
const backgroundColorPicker = document.getElementById("backgroundColor");
const clearCanvasButton = document.getElementById("clearCanvas");
const eraseModeButton = document.getElementById("eraseMode");
const exportPngButton = document.getElementById("exportPng");
const exportSvgButton = document.getElementById("exportSvg");
const figureList = document.getElementById("figureList");
const editFigureForm = document.getElementById("editFigure");

let isDrawing = false;
let eraseMode = false;
let startX = 0, startY = 0;
let figures = [];
let penPath = [];

editFigureForm.style.display = "none";

backgroundColorPicker.addEventListener("input", redrawCanvas);

shapeSelector.addEventListener("change", () => {
    if (eraseMode) deactivateEraser();
});

function redrawCanvas() {
    ctx.fillStyle = backgroundColorPicker.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    figures.forEach(drawFigure);
}

function drawFigure(figure) {
    ctx.beginPath();
    ctx.strokeStyle = figure.color;
    ctx.lineWidth = figure.lineWidth;
    if (figure.shape === "ellipse") {
        ctx.ellipse(figure.x + figure.width / 2, figure.y + figure.height / 2, Math.abs(figure.width / 2), Math.abs(figure.height / 2), 0, 0, 2 * Math.PI);
    } else if (figure.shape === "rectangle") {
        ctx.rect(figure.x, figure.y, figure.width, figure.height);
    } else if (figure.shape === "line") {
        ctx.moveTo(figure.x, figure.y);
        ctx.lineTo(figure.x + figure.width, figure.y + figure.height);
    } else if (figure.shape === "pen") {
        for (let i = 1; i < figure.path.length; i++) {
            ctx.moveTo(figure.path[i - 1].x, figure.path[i - 1].y);
            ctx.lineTo(figure.path[i].x, figure.path[i].y);
        }
    }
    ctx.stroke();
}

function selectFigureForEdit(index) {
    const figure = figures[index];
    document.getElementById("editX").value = figure.x;
    document.getElementById("editY").value = figure.y;
    document.getElementById("editWidth").value = figure.width;
    document.getElementById("editHeight").value = figure.height;
    editFigureForm.style.display = "block";
    toggleEditMode(true);
    document.getElementById("saveFigure").onclick = () => saveFigureChanges(index);
    document.getElementById("cancelEdit").onclick = () => {
        editFigureForm.style.display = "none";
        toggleEditMode(false);
    };
}

function saveFigureChanges(index) {
    const figure = figures[index];
    const x = parseInt(document.getElementById("editX").value, 10);
    const y = parseInt(document.getElementById("editY").value, 10);
    const width = parseInt(document.getElementById("editWidth").value, 10);
    const height = parseInt(document.getElementById("editHeight").value, 10);
    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) || x < 0 || y < 0 || width < 0 || height < 0 || width > 500 || height > 500 || x + width > canvas.width || y + height > canvas.height) {
        alert("Invalid input.");
        return;
    }
    figure.x = x;
    figure.y = y;
    figure.width = width;
    figure.height = height;
    editFigureForm.style.display = "none";
    toggleEditMode(false);
    redrawCanvas();
    updateFigureList();
}

function deleteFigure(index) {
    figures.splice(index, 1);
    redrawCanvas();
    updateFigureList();
}

eraseModeButton.addEventListener("click", () => {
    eraseMode = !eraseMode;
    eraseModeButton.textContent = eraseMode ? "Eraser (Active)" : "Eraser";
    eraseModeButton.classList.toggle("active", eraseMode);
});

function deactivateEraser() {
    eraseMode = false;
    eraseModeButton.textContent = "Eraser";
    eraseModeButton.classList.remove("active");
}

function toggleEditMode(isEditing) {
    const controls = [clearCanvasButton, exportPngButton, exportSvgButton, shapeSelector, backgroundColorPicker, colorPicker, lineWidthPicker, eraseModeButton];
    controls.forEach((control) => { control.disabled = isEditing; });
}

canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    if (eraseMode) {
        let index;
        do {
            index = figures.findIndex((figure) => isPointInFigure(startX, startY, figure));
            if (index !== -1) deleteFigure(index);
        } while (index !== -1);
        return;
    }
    isDrawing = true;
    if (shapeSelector.value === "pen") {
        penPath = [{ x: startX, y: startY }];
    } else {
        const lineWidth = parseInt(lineWidthPicker.value, 10) || 1;
        if (lineWidth > 10) {
            alert("Line width cannot exceed 10.");
            return;
        }
        figures.push({ shape: shapeSelector.value, color: colorPicker.value, lineWidth: lineWidth, x: startX, y: startY, width: 0, height: 0 });
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || eraseMode) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (shapeSelector.value === "pen") {
        penPath.push({ x, y });
        ctx.beginPath();
        ctx.moveTo(penPath[penPath.length - 2].x, penPath[penPath.length - 2].y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = colorPicker.value;
        const lineWidth = parseInt(lineWidthPicker.value, 10) || 1;
        if (lineWidth > 10) {
            alert("Line width cannot exceed 10.");
            return;
        }
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    } else {
        const figure = figures[figures.length - 1];
        figure.width = x - figure.x;
        figure.height = y - figure.y;
        redrawCanvas();
    }
});

canvas.addEventListener("mouseup", () => {
    if (!isDrawing || eraseMode) return;
    isDrawing = false;
    if (shapeSelector.value === "pen") {
        figures.push({ shape: "pen", color: colorPicker.value, lineWidth: parseInt(lineWidthPicker.value, 10) || 1, path: [...penPath] });
        penPath = [];
    }
    updateFigureList();
});

function updateFigureList() {
    figureList.innerHTML = "";
    figures.forEach((figure, index) => {
        if (figure.shape === "pen") return;
        const li = document.createElement("li");
        li.innerHTML = `${figure.shape} (${figure.x}, ${figure.y}) <button onclick="selectFigureForEdit(${index})">Edit</button> <button onclick="deleteFigure(${index})">Delete</button>`;
        figureList.appendChild(li);
    });
}

exportPngButton.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

exportSvgButton.addEventListener("click", () => {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"><rect width="100%" height="100%" fill="${backgroundColorPicker.value}" />`;
    figures.forEach((figure) => {
        if (figure.shape === "ellipse") {
            svgContent += `<ellipse cx="${figure.x + figure.width / 2}" cy="${figure.y + figure.height / 2}" rx="${Math.abs(figure.width / 2)}" ry="${Math.abs(figure.height / 2)}" stroke="${figure.color}" stroke-width="${figure.lineWidth}" fill="none" />`;
        } else if (figure.shape === "rectangle") {
            svgContent += `<rect x="${figure.x}" y="${figure.y}" width="${figure.width}" height="${figure.height}" stroke="${figure.color}" stroke-width="${figure.lineWidth}" fill="none" />`;
        } else if (figure.shape === "line") {
            svgContent += `<line x1="${figure.x}" y1="${figure.y}" x2="${figure.x + figure.width}" y2="${figure.y + figure.height}" stroke="${figure.color}" stroke-width="${figure.lineWidth}" />`;
        } else if (figure.shape === "pen") {
            svgContent += `<polyline points="${figure.path.map((p) => `${p.x},${p.y}`).join(" ")}" stroke="${figure.color}" stroke-width="${figure.lineWidth}" fill="none" />`;
        }
    });
    svgContent += "</svg>";
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = "drawing.svg";
    link.href = URL.createObjectURL(blob);
    link.click();
});

clearCanvasButton.addEventListener("click", () => {
    figures = [];
    redrawCanvas();
    updateFigureList();
});

function isPointInFigure(x, y, figure) {
    if (figure.shape === "ellipse") {
        const centerX = figure.x + figure.width / 2;
        const centerY = figure.y + figure.height / 2;
        const rx = Math.abs(figure.width / 2);
        const ry = Math.abs(figure.height / 2);
        return ((x - centerX) ** 2) / (rx ** 2) + ((y - centerY) ** 2) / (ry ** 2) <= 1;
    } else if (figure.shape === "rectangle") {
        return x >= figure.x && x <= figure.x + figure.width && y >= figure.y && y <= figure.y + figure.height;
    } else if (figure.shape === "line") {
        const dx = figure.width, dy = figure.height, length = Math.sqrt(dx ** 2 + dy ** 2);
        const dot = ((x - figure.x) * dx + (y - figure.y) * dy) / (length ** 2);
        const closestX = figure.x + dot * dx;
        const closestY = figure.y + dot * dy;
        return Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2) <= figure.lineWidth / 2;
    } else if (figure.shape === "pen") {
        return figure.path.some((point) => Math.hypot(point.x - x, point.y - y) <= figure.lineWidth);
    }
    return false;
}
