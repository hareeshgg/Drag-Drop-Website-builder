document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const propertiesForm = document.getElementById('properties-form');
    let selectedElement = null;
    let offsetX, offsetY;
    let isResizing = false;
    let isDragging = false;
    let startWidth, startHeight;
    let touchIdentifier = null;

    // Helper function to get touch position
    function getTouchPosition(e) {
        const rect = canvas.getBoundingClientRect();
        const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdentifier) || e.changedTouches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    // Make sidebar elements draggable
    document.querySelectorAll('.element-item').forEach(item => {
        // For mouse
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.type);
        });
        
        // For touch - long press to drag
        item.addEventListener('touchstart', function(e) {
            e.preventDefault();
            touchIdentifier = e.changedTouches[0].identifier;
            setTimeout(() => {
                if (touchIdentifier !== null) { // Still touching after 500ms
                    const type = this.dataset.type;
                    const rect = this.getBoundingClientRect();
                    const x = rect.left + rect.width/2;
                    const y = rect.top + rect.height/2;
                    
                    const canvasRect = canvas.getBoundingClientRect();
                    createElement(type, x - canvasRect.left, y - canvasRect.top);
                    touchIdentifier = null;
                }
            }, 500);
        }, {passive: false});
        
        item.addEventListener('touchend', function() {
            touchIdentifier = null;
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
    
    // Create element function (same as before)
    function createElement(type, x, y) {
        const element = document.createElement('div');
        element.className = `draggable-element ${type}-element`;
        element.dataset.type = type;
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        switch(type) {
            case 'text':
                element.textContent = 'Double tap to edit text';
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
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        element.appendChild(resizeHandle);
        
        canvas.appendChild(element);
        setupElementInteractions(element);
        selectElement(element);
    }
    
    // Set up interactions (updated for touch)
    function setupElementInteractions(element) {
        const resizeHandle = element.querySelector('.resize-handle');
        
        // Mouse events
        element.addEventListener('mousedown', handleElementMouseDown);
        element.addEventListener('dblclick', handleElementDoubleClick);
        
        // Touch events
        element.addEventListener('touchstart', handleElementTouchStart, {passive: false});
        element.addEventListener('touchend', handleElementTouchEnd);
        
        function handleElementMouseDown(e) {
            if (e.target === resizeHandle) {
                isResizing = true;
                startWidth = parseInt(element.style.width) || element.offsetWidth;
                startHeight = parseInt(element.style.height) || element.offsetHeight;
                e.stopPropagation();
                return;
            }
            
            element.style.zIndex = 100;
            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            isDragging = true;
            selectElement(element);
            e.preventDefault();
        }
        
        function handleElementTouchStart(e) {
            if (e.target === resizeHandle) {
                isResizing = true;
                startWidth = parseInt(element.style.width) || element.offsetWidth;
                startHeight = parseInt(element.style.height) || element.offsetHeight;
                touchIdentifier = e.changedTouches[0].identifier;
                e.stopPropagation();
                return;
            }
            
            element.style.zIndex = 100;
            const rect = element.getBoundingClientRect();
            const touch = e.changedTouches[0];
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            isDragging = true;
            touchIdentifier = touch.identifier;
            selectElement(element);
            e.preventDefault();
        }
        
        function handleElementTouchEnd() {
            isResizing = false;
            isDragging = false;
            touchIdentifier = null;
        }
        
        function handleElementDoubleClick() {
            if (this.dataset.type === 'text') {
                this.focus();
            }
        }
    }
    
    // Movement handling for both mouse and touch
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleTouchMove, {passive: false});
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchend', handlePointerUp);
    
    function handleMove(e) {
        if (!selectedElement) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        handleMovement(x, y);
    }
    
    function handleTouchMove(e) {
        if (!selectedElement || touchIdentifier === null) return;
        
        const pos = getTouchPosition(e);
        handleMovement(pos.x, pos.y);
        e.preventDefault();
    }
    
    function handleMovement(x, y) {
        if (isResizing) {
            const width = x - selectedElement.offsetLeft;
            const height = y - selectedElement.offsetTop;
            selectedElement.style.width = `${Math.max(50, width)}px`;
            selectedElement.style.height = `${Math.max(20, height)}px`;
        } else if (isDragging) {
            selectedElement.style.left = `${x - offsetX}px`;
            selectedElement.style.top = `${y - offsetY}px`;
        }
    }
    
    function handlePointerUp() {
        isResizing = false;
        isDragging = false;
        touchIdentifier = null;
    }
    
    // Canvas touch handling
    canvas.addEventListener('touchstart', function(e) {
        if (e.target === canvas) {
            if (selectedElement) {
                selectedElement.classList.remove('selected');
                selectedElement = null;
                propertiesForm.innerHTML = '<p>Select an element to edit its properties.</p>';
            }
        }
    }, {passive: false});
    
    // Select element and update properties form (same as before)
    function selectElement(element) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        selectedElement = element;
        element.classList.add('selected');
        updatePropertiesForm(element);
    }
    
    function updatePropertiesForm(element) {
        // ... (keep your existing implementation)
    }
    
    function applyProperties(element) {
        // ... (keep your existing implementation)
    }
    
    // Handle keydown for deleting selected element
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Delete' && selectedElement) {
            canvas.removeChild(selectedElement);
            selectedElement = null;
            propertiesForm.innerHTML = '<p>Select an element to edit its properties.</p>';
        }
    });
});
