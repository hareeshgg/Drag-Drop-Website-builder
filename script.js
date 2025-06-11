document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const propertiesForm = document.getElementById('properties-form');
    const propertiesPanel = document.getElementById('properties-panel');
    let selectedElement = null;
    let offsetX, offsetY;
    let isResizing = false;
    let isDragging = false;
    let startWidth, startHeight;

    // Make sidebar elements draggable
    document.querySelectorAll('.element-item').forEach(item => {
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.type);
        });
    });
    
    // Handle drop on canvas
    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    canvas.addEventListener('drop', function(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        createElement(type, x, y);
    });
    
    // Create a new element on the canvas
    function createElement(type, x, y) {
        const element = document.createElement('div');
        element.className = `draggable-element ${type}-element`;
        element.dataset.type = type;
        
        // Position the element
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        // Add content based on type
        switch(type) {
            case 'text':
                element.textContent = 'Double click to edit text';
                element.contentEditable = true;
                break;
            case 'button':
                element.textContent = 'Button';
                break;
            case 'image':
                element.innerHTML = `
                    <span style="color:#888">Image</span>
                    <img src="" style="display:none;">
                `;
                break;
        }
        
        // Add resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        element.appendChild(resizeHandle);
        
        // Add to canvas
        canvas.appendChild(element);
        
        // Make draggable
        setupElementInteractions(element);
        
        // Select the new element
        selectElement(element);
    }
    
    // Set up drag and selection for elements
    function setupElementInteractions(element) {
        const resizeHandle = element.querySelector('.resize-handle');
        
        element.addEventListener('mousedown', function(e) {
            if (e.target === resizeHandle) {
                isResizing = true;
                startWidth = parseInt(element.style.width) || element.offsetWidth;
                startHeight = parseInt(element.style.height) || element.offsetHeight;
                e.stopPropagation();
                return;
            }
            
            // Bring to front
            this.style.zIndex = 100;
            
            // Calculate offset
            const rect = this.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            isDragging = true;
            selectElement(this);
            e.preventDefault();
        });
        
        element.addEventListener('dblclick', function() {
            if (this.dataset.type === 'text') {
                this.focus();
            }
        });
    }
    
    // Select an element and show its properties
    function selectElement(element) {
        // Deselect previous element
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        
        selectedElement = element;
        element.classList.add('selected');
        
        // Update properties panel
        updatePropertiesForm(element);
    }
    
    // Update the properties form based on selected element
    function updatePropertiesForm(element) {
        const type = element.dataset.type;
        
        let formHTML = '';
        
        switch(type) {
            case 'text':
                formHTML = `
                    <div class="form-group">
                        <label for="text-content">Content</label>
                        <textarea id="text-content">${element.textContent}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="text-font-size">Font Size (px)</label>
                        <input type="number" id="text-font-size" value="16">
                    </div>
                    <div class="form-group">
                        <label for="text-color">Text Color</label>
                        <input type="color" id="text-color" value="#000000">
                    </div>
                    <button id="apply-properties">Apply</button>
                `;
                break;
            case 'button':
                formHTML = `
                    <div class="form-group">
                        <label for="button-text">Button Text</label>
                        <input type="text" id="button-text" value="${element.textContent}">
                    </div>
                    <div class="form-group">
                        <label for="button-bg-color">Background Color</label>
                        <input type="color" id="button-bg-color" value="#4a6fa5">
                    </div>
                    <div class="form-group">
                        <label for="button-text-color">Text Color</label>
                        <input type="color" id="button-text-color" value="#ffffff">
                    </div>
                    <button id="apply-properties">Apply</button>
                `;
                break;
            case 'image':
                formHTML = `
                    <div class="form-group">
                        <label for="image-url">Image URL</label>
                        <input type="text" id="image-url" placeholder="Enter image URL">
                    </div>
                    <button id="apply-properties">Apply</button>
                `;
                break;
        }
        
        propertiesForm.innerHTML = formHTML;
        
        // Set up apply button
        document.getElementById('apply-properties')?.addEventListener('click', function() {
            applyProperties(element);
        });
    }
    
    // Apply properties from form to element
    function applyProperties(element) {
        const type = element.dataset.type;
        
        switch(type) {
            case 'text':
                element.textContent = document.getElementById('text-content').value;
                element.style.fontSize = document.getElementById('text-font-size').value + 'px';
                element.style.color = document.getElementById('text-color').value;
                break;
            case 'button':
                element.textContent = document.getElementById('button-text').value;
                element.style.backgroundColor = document.getElementById('button-bg-color').value;
                element.style.color = document.getElementById('button-text-color').value;
                break;
            case 'image':
                const url = document.getElementById('image-url').value;
                if (url) {
                    const img = element.querySelector('img');
                    img.src = url;
                    img.style.display = 'block';
                    element.querySelector('span').style.display = 'none';
                }
                break;
        }
    }
    
    // Handle mouse move for dragging and resizing
    document.addEventListener('mousemove', function(e) {
        if (!selectedElement) return;
        
        const rect = canvas.getBoundingClientRect();
        
        if (isResizing) {
            // Resize the element
            const width = e.clientX - rect.left - selectedElement.offsetLeft;
            const height = e.clientY - rect.top - selectedElement.offsetTop;
            
            selectedElement.style.width = `${Math.max(50, width)}px`;
            selectedElement.style.height = `${Math.max(20, height)}px`;
        } else if (isDragging) {
            // Move the element
            const x = e.clientX - rect.left - offsetX;
            const y = e.clientY - rect.top - offsetY;
            
            selectedElement.style.left = `${x}px`;
            selectedElement.style.top = `${y}px`;
        }
    });
    
    // Handle mouse up to stop dragging/resizing
    document.addEventListener('mouseup', function() {
        isResizing = false;
        isDragging = false;
    });
    
    // Click on canvas to deselect
    canvas.addEventListener('mousedown', function(e) {
        if (e.target === canvas) {
            if (selectedElement) {
                selectedElement.classList.remove('selected');
                selectedElement = null;
                propertiesForm.innerHTML = '<p>Select an element to edit its properties.</p>';
            }
        }
    });
    
    // Handle keydown for deleting selected element
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Delete' && selectedElement) {
            canvas.removeChild(selectedElement);
            selectedElement = null;
            propertiesForm.innerHTML = '<p>Select an element to edit its properties.</p>';
        }
    });
});