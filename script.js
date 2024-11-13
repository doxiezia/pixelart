document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById('grid-container');
  const colorPicker = document.getElementById('color-picker');
  const drawModeSelect = document.getElementById('draw-mode');
  const applyColorButton = document.getElementById('apply-color');
  const paletteNameInput = document.getElementById('palette-name');
  const addColorButton = document.getElementById('add-color');
  const paletteDisplay = document.getElementById('palette-display');
  const savePaletteButton = document.getElementById('save-palette');
  const clearPaletteButton = document.getElementById('clear-palette');
  const savedPalettesContainer = document.getElementById('saved-palettes');
  const clearGridButton = document.getElementById('clear-grid');
  
  let currentPalette = [];
  let predefinedPalettes = {
    "Batman": ["#000000", "#45413e", "#666561", "#a5a4a1", "#f6f5f9", "#d1e5dd", "#54b1d0", "#2d61af", "#193657"],
    "IronMan": ["#000000", "#666561", "#a5a4a1", "#6e859f", "#193657", "#f6f6f7", "#c29e40", "#d7c695", "#968564"]
  };

  // Load predefined palettes and merge with locally saved palettes
  let savedPalettes = JSON.parse(localStorage.getItem('savedPalettes')) || {};
  savedPalettes = { ...predefinedPalettes, ...savedPalettes }; // Merge predefined palettes

  let mouseDown = false;
  let currentGrid = [];
  let selectedPixels = [];

  // Extract gridIndex dynamically from the page using data attribute
  const gridIndex = document.body.dataset.gridIndex || 'grid1'; // Default to 'grid1' if not set

  document.addEventListener('mousedown', () => mouseDown = true);
  document.addEventListener('mouseup', () => mouseDown = false);

  // Add color to the palette
  if (addColorButton) {
    addColorButton.addEventListener('click', () => {
      const color = colorPicker.value;
      if (!currentPalette.includes(color)) {
        currentPalette.push(color);
        updatePaletteDisplay();
      }
    });
  }

  // Save palette to local storage
  if (savePaletteButton) {
    savePaletteButton.addEventListener('click', () => {
      const paletteName = paletteNameInput.value.trim();
      if (paletteName && currentPalette.length > 0) {
        savedPalettes[paletteName] = currentPalette.slice();
        localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes));
        alert(`Palette "${paletteName}" saved!`);
        updateSavedPalettesDisplay();
      } else {
        alert('Please enter a valid palette name and add colors.');
      }
    });
  }

  // Clear the current palette
  if (clearPaletteButton) {
    clearPaletteButton.addEventListener('click', () => {
      currentPalette = [];
      updatePaletteDisplay();
    });
  }

  // Clear the grid
  if (clearGridButton) {
    clearGridButton.addEventListener('click', () => {
      currentGrid = Array(256).fill('#ffffff'); // Reset all pixels to white
      for (let i = 0; i < gridContainer.children.length; i++) {
        const pixel = gridContainer.children[i];
        pixel.style.backgroundColor = '#ffffff'; // Reset pixel color visually
      }
      localStorage.setItem(gridIndex, JSON.stringify(currentGrid)); // Update local storage with the cleared grid
    });
  }

  // Apply color to selected pixels
  if (applyColorButton) {
    applyColorButton.addEventListener('click', () => {
      selectedPixels.forEach(pixel => {
        pixel.style.backgroundColor = colorPicker.value; // Change pixel color
        const index = Array.from(gridContainer.children).indexOf(pixel);
        currentGrid[index] = colorPicker.value; // Update currentGrid
      });
      localStorage.setItem(gridIndex, JSON.stringify(currentGrid)); // Update local storage with the new colors
      selectedPixels = []; // Clear selection after applying color
      updateSelectionHighlights(); // Update highlights
    });
  }

  // Convert rgb color string to hex format
  function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    return result ? `#${((1 << 24) + (result[0] << 16) + (result[1] << 8) + +result[2]).toString(16).slice(1)}` : '';
  }

  // Update the palette display
  function updatePaletteDisplay() {
    paletteDisplay.innerHTML = '';
    currentPalette.forEach(color => {
      const colorDiv = document.createElement('div');
      colorDiv.classList.add('palette-color');
      colorDiv.style.backgroundColor = color;
      paletteDisplay.appendChild(colorDiv);
      colorDiv.addEventListener('click', () => {
        colorPicker.value = color;
      });
    });
  }

  // Update saved palettes display
  function updateSavedPalettesDisplay() {
    savedPalettesContainer.innerHTML = '';
    Object.keys(savedPalettes).forEach(paletteName => {
      const paletteButton = document.createElement('button');
      paletteButton.innerText = paletteName;
      savedPalettesContainer.appendChild(paletteButton);

      paletteButton.addEventListener('click', () => {
        currentPalette = savedPalettes[paletteName].slice();
        updatePaletteDisplay();
      });

      const deleteButton = document.createElement('button');
      deleteButton.innerText = 'Delete';
      deleteButton.addEventListener('click', () => {
        if (predefinedPalettes[paletteName]) {
          alert('Cannot delete predefined palettes.');
        } else {
          delete savedPalettes[paletteName];
          localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes));
          updateSavedPalettesDisplay();
        }
      });
      savedPalettesContainer.appendChild(deleteButton);
    });
  }

  updateSavedPalettesDisplay();

  // Generate the grid
  window.generateGrid = function(width, height, gridKey) { // Make this function globally accessible
    const savedGrid = JSON.parse(localStorage.getItem(gridKey)) || Array(width * height).fill('#ffffff');
    currentGrid = savedGrid;
    gridContainer.innerHTML = ''; 
    gridContainer.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${height}, 1fr)`;

    for (let i = 0; i < width * height; i++) {
      const pixel = document.createElement('div');
      pixel.classList.add('pixel');
      pixel.style.backgroundColor = savedGrid[i];
      pixel.addEventListener('mouseover', handlePixelHover);
      pixel.addEventListener('mousedown', () => handlePixelClick(i, gridKey));
      gridContainer.appendChild(pixel);
    }
  }

  // Handle pixel click and coloring
  function handlePixelClick(index, gridKey) {
    const pixel = gridContainer.children[index];
    if (drawModeSelect.value === "paint") {
      pixel.style.backgroundColor = colorPicker.value;
      currentGrid[index] = colorPicker.value;
      localStorage.setItem(gridKey, JSON.stringify(currentGrid));
    } else if (drawModeSelect.value === "eraser") {
      pixel.style.backgroundColor = '#ffffff'; 
      currentGrid[index] = '#ffffff'; 
      localStorage.setItem(gridKey, JSON.stringify(currentGrid));
    } else if (drawModeSelect.value === "eyedropper") {
      const selectedColor = rgbToHex(pixel.style.backgroundColor);
      if (selectedColor !== '#ffffff') { 
        colorPicker.value = selectedColor; 
      }
    } else if (drawModeSelect.value === "select") {
      if (selectedPixels.includes(pixel)) {
        pixel.style.outline = '';
        selectedPixels = selectedPixels.filter(p => p !== pixel);
      } else {
        pixel.style.outline = '2px solid red';
        selectedPixels.push(pixel);
      }
    }
  }

  // Update selection highlights
  function updateSelectionHighlights() {
    for (const pixel of gridContainer.children) {
      if (selectedPixels.includes(pixel)) {
        pixel.style.outline = '2px solid red'; // Highlight selected pixels
      } else {
        pixel.style.outline = ''; // Remove highlight from unselected pixels
      }
    }
  }

  // Handle hover event for painting in drag mode
  function handlePixelHover(event) {
    const pixel = event.target;
    const pixelIndex = Array.from(gridContainer.children).indexOf(pixel); // Get pixel index in the grid

    if (drawModeSelect.value === "paint" && mouseDown) {
      pixel.style.backgroundColor = colorPicker.value;
      currentGrid[pixelIndex] = colorPicker.value;
      localStorage.setItem(gridIndex, JSON.stringify(currentGrid)); // Save each pixel as it's painted
    } else if (drawModeSelect.value === "eraser" && mouseDown) {
      pixel.style.backgroundColor = '#ffffff'; 
      currentGrid[pixelIndex] = '#ffffff'; 
      localStorage.setItem(gridIndex, JSON.stringify(currentGrid)); // Save each pixel as it's erased
    }
  }
});
