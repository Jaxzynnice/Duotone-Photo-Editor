class DuotoneEditor {
    constructor() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.originalImage = null;
        this.currentImage = null;
        this.history = [];
        this.historyIndex = -1;
        this.selectedEffect = 'bravePink';
        this.classicEnabled = false;
        this.reverseEnabled = false;
        this.swipeStartX = 0;
        this.swipeThreshold = 50;
        this.currentIntensity = 50;
        this.isProcessing = false;
        this.language = 'en';
        this.activeColorCard = null;
        this.maxHistorySteps = 3;

        this.initializeEventListeners();
        this.setInitialEffect();
        this.loadPreferences();
    }
    
    initializeEventListeners() {
        // Upload area events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const changePhotoBtn = document.getElementById('changePhotoBtn');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
        
        changePhotoBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Effect dots selection
        document.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                this.selectEffect(dot.dataset.effect);
            });
        });
        
        // Intensity controls
        document.getElementById('intensitySlider').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('intensityInput').value = value;
            document.getElementById('intensityValue').textContent = `${value}%`;
            this.currentIntensity = parseInt(value);
            this.applyEffect();
        });
        
        document.getElementById('intensityInput').addEventListener('input', (e) => {
            let value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
            e.target.value = value;
            document.getElementById('intensitySlider').value = value;
            document.getElementById('intensityValue').textContent = `${value}%`;
            this.currentIntensity = value;
            this.applyEffect();
        });
        
        // Toggle buttons
        document.getElementById('classicToggle').addEventListener('click', () => {
            this.toggleClassic();
        });
        
        document.getElementById('reverseToggle').addEventListener('click', () => {
            this.toggleReverse();
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('change', () => {
            this.toggleTheme();
        });
        
        // Language toggle
        document.getElementById('languageToggle').addEventListener('change', () => {
            this.toggleLanguage();
        });
        
        // Action buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareImage());
        
        // Swipe events
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        imagePreview.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        imagePreview.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Mouse events for desktop
        imagePreview.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        imagePreview.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        imagePreview.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        imagePreview.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        // Section navigation
        document.querySelectorAll('.section-nav-btn, .back-btn, .section-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.dataset.section;
                this.showSection(section);
            });
        });
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.showTab(tab);
            });
        });
        
        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = btn.dataset.color;
                const code = btn.dataset.code;
                
                if (color) {
                    this.copyToClipboard(color);
                    btn.classList.add('copied');
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        btn.classList.remove('copied');
                        btn.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                } else if (code) {
                    this.copyToClipboard(code);
                    btn.classList.add('copied');
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        btn.classList.remove('copied');
                        btn.innerHTML = '<i class="fas fa-copy"></i> Copy CSS';
                    }, 2000);
                }
            });
        });
        
        // Color card selection
        document.querySelectorAll('.color-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-btn')) return;
                
                // Remove active class from all cards
                document.querySelectorAll('.color-card').forEach(c => {
                    c.classList.remove('active');
                });
                
                // Add active class to clicked card
                card.classList.add('active');
                this.activeColorCard = card;
            });
        });
        
        // Click outside to deselect color cards
        document.addEventListener('click', (e) => {
            if (this.activeColorCard && !e.target.closest('.color-card')) {
                this.activeColorCard.classList.remove('active');
                this.activeColorCard = null;
            }
        });
        
        // FAQ accordion
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                question.classList.toggle('active');
                answer.classList.toggle('active');
            });
        });
        
        // Feedback form
        document.getElementById('feedbackForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFeedbackSubmit();
        });
    }
    
    loadPreferences() {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').checked = true;
        }
        
        // Load language preference
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage === 'id') {
            this.language = 'id';
            document.getElementById('languageToggle').checked = true;
            this.updateLanguage();
        }
    }
    
    setInitialEffect() {
        // Select the first effect by default
        this.selectEffect('bravePink');
    }
    
    selectEffect(effect) {
        this.selectedEffect = effect;
        
        // Update UI
        document.querySelectorAll('.dot').forEach(dot => {
            dot.classList.remove('active');
        });
        
        document.querySelector(`.dot[data-effect="${effect}"]`).classList.add('active');
        
        // Update effect name
        let effectName = '';
        switch(effect) {
            case 'bravePink':
                effectName = this.language === 'id' ? 'Brave Pink' : 'Brave Pink';
                break;
            case 'heroGreen':
                effectName = this.language === 'id' ? 'Hero Green' : 'Hero Green';
                break;
            case 'combined':
                effectName = this.language === 'id' ? 'Efek Gabungan' : 'Combined Effect';
                break;
        }
        document.getElementById('effectName').textContent = effectName;
        
        this.applyEffect();
    }
    
    toggleClassic() {
        this.classicEnabled = !this.classicEnabled;
        const button = document.getElementById('classicToggle');
        
        if (this.classicEnabled) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
        
        this.applyEffect();
    }
    
    toggleReverse() {
        this.reverseEnabled = !this.reverseEnabled;
        const button = document.getElementById('reverseToggle');
        
        if (this.reverseEnabled) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
        
        this.applyEffect();
    }
    
    toggleTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        
        if (themeToggle.checked) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    }
    
    toggleLanguage() {
        const languageToggle = document.getElementById('languageToggle');
        
        if (languageToggle.checked) {
            this.language = 'id';
            localStorage.setItem('language', 'id');
        } else {
            this.language = 'en';
            localStorage.setItem('language', 'en');
        }
        
        this.updateLanguage();
    }
    
    updateLanguage() {
        // Update UI texts based on language
        const translations = {
            'en': {
                'uploadTitle': 'Upload Your Photo',
                'uploadDesc': 'Drag & drop your image here or click to browse',
                'formats': 'Supported formats: JPG, JPEG, PNG, WebP, ICO, HEIC, GIF, BMP, TIFF',
                'maxSize': 'No file size limit - all processing happens in your browser',
                'colorCodes': 'Color Codes',
                'faq': 'FAQ',
                'privacy': 'Privacy',
                'editorTitle': 'Photo Editor',
                'changePhoto': 'Change',
                'preview': 'Preview',
                'undo': 'Undo',
                'redo': 'Redo',
                'intensity': 'Effect Intensity:',
                'classic': 'Classic Colors',
                'reverse': 'Reverse Duotone',
                'export': 'Export As:',
                'download': 'Download',
                'share': 'Share',
                'bravePink': 'Brave Pink',
                'heroGreen': 'Hero Green',
                'combined': 'Combined Effect'
            },
            'id': {
                'uploadTitle': 'Unggah Foto Anda',
                'uploadDesc': 'Seret & lepas gambar Anda di sini atau klik untuk menjelajah',
                'formats': 'Format yang didukung: JPG, JPEG, PNG, WebP, ICO, HEIC, GIF, BMP, TIFF',
                'maxSize': 'Tidak ada batas ukuran file - semua pemrosesan terjadi di browser Anda',
                'colorCodes': 'Kode Warna',
                'faq': 'FAQ',
                'privacy': 'Privasi',
                'editorTitle': 'Editor Foto',
                'changePhoto': 'Ubah',
                'preview': 'Pratinjau',
                'undo': 'Undo',
                'redo': 'Redo',
                'intensity': 'Intensitas Efek:',
                'classic': 'Warna Klasik',
                'reverse': 'Duotone Terbalik',
                'export': 'Ekspor Sebagai:',
                'download': 'Unduh',
                'share': 'Bagikan',
                'bravePink': 'Brave Pink',
                'heroGreen': 'Hero Green',
                'combined': 'Efek Gabungan'
            }
        };
        
        const currentLang = translations[this.language];
        
        // Update upload section
        document.querySelector('.upload-placeholder h2').textContent = currentLang.uploadTitle;
        document.querySelector('.upload-placeholder p').textContent = currentLang.uploadDesc;
        document.querySelector('.formats').textContent = currentLang.formats;
        document.querySelector('.max-size').textContent = currentLang.maxSize;
        
        // Update section buttons
        document.querySelector('[data-section="colorCodes"]').innerHTML = `<i class="fas fa-palette"></i> ${currentLang.colorCodes}`;
        document.querySelector('[data-section="faq"]').innerHTML = `<i class="fas fa-question-circle"></i> ${currentLang.faq}`;
        document.querySelector('[data-section="privacy"]').innerHTML = `<i class="fas fa-shield-alt"></i> ${currentLang.privacy}`;
        
        // Update editor section
        document.querySelector('.section-title').textContent = currentLang.editorTitle;
        document.getElementById('changePhotoBtn').innerHTML = `<i class="fas fa-sync-alt"></i> ${currentLang.changePhoto}`;
        document.querySelector('.preview-header h3').textContent = currentLang.preview;
        document.getElementById('undoBtn').innerHTML = `<i class="fas fa-undo"></i> ${currentLang.undo}`;
        document.getElementById('redoBtn').innerHTML = `<i class="fas fa-redo"></i> ${currentLang.redo}`;
        document.querySelector('.intensity-control label').innerHTML = `${currentLang.intensity} <output id="intensityValue">${this.currentIntensity}%</output>`;
        document.getElementById('classicToggle').innerHTML = `<span>${currentLang.classic}</span><div class="toggle-switch"></div>`;
        document.getElementById('reverseToggle').innerHTML = `<span>${currentLang.reverse}</span><div class="toggle-switch"></div>`;
        document.querySelector('.export-options label').textContent = currentLang.export;
        document.getElementById('downloadBtn').innerHTML = `<i class="fas fa-download"></i> ${currentLang.download}`;
        document.getElementById('shareBtn').innerHTML = `<i class="fas fa-share-alt"></i> ${currentLang.share}`;
        
        // Update effect names
        this.selectEffect(this.selectedEffect);
        
        // Update toggle labels
        const themeLabels = document.querySelectorAll('.theme-toggle-container .toggle-label');
        const languageLabels = document.querySelectorAll('.language-toggle-container .toggle-label');
        
        if (this.language === 'id') {
            themeLabels[0].textContent = 'Terang';
            themeLabels[1].textContent = 'Gelap';
            languageLabels[0].textContent = 'Inggris';
            languageLabels[1].textContent = 'Indonesia';
        } else {
            themeLabels[0].textContent = 'Light';
            themeLabels[1].textContent = 'Dark';
            languageLabels[0].textContent = 'English';
            languageLabels[1].textContent = 'Indonesia';
        }
    }
    
    showSection(section) {
        // Hide all sections
        document.querySelectorAll('section').forEach(sec => {
            sec.classList.remove('active-section');
        });
        
        // Show selected section
        document.getElementById(`${section}Section`).classList.add('active-section');
        
        // Special handling for upload section
        if (section === 'upload') {
            document.getElementById('uploadSection').classList.add('active-section');
        }
    }
    
    showTab(tab) {
        // Deactivate all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Activate selected tab
        document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Tab`).classList.add('active');
    }
    
    handleTouchStart(e) {
        this.swipeStartX = e.touches[0].clientX;
    }
    
    handleTouchMove(e) {
        if (!this.swipeStartX) return;
        
        const currentX = e.touches[0].clientX;
        const diffX = this.swipeStartX - currentX;
        
        // Prevent vertical scrolling when swiping horizontally
        if (Math.abs(diffX) > 10) {
            e.preventDefault();
        }
    }
    
    handleTouchEnd(e) {
        if (!this.swipeStartX) return;
        
        const endX = e.changedTouches[0].clientX;
        const diffX = this.swipeStartX - endX;
        
        // Check if swipe meets the threshold
        if (Math.abs(diffX) > this.swipeThreshold) {
            if (diffX > 0) {
                this.swipeToNextEffect();
            } else {
                this.swipeToPrevEffect();
            }
        }
        
        this.swipeStartX = 0;
    }
    
    handleMouseDown(e) {
        this.swipeStartX = e.clientX;
    }
    
    handleMouseMove(e) {
        if (!this.swipeStartX) return;
        
        const currentX = e.clientX;
        const diffX = this.swipeStartX - currentX;
        
        // Prevent text selection when dragging
        if (Math.abs(diffX) > 10) {
            e.preventDefault();
        }
    }
    
    handleMouseUp(e) {
        if (!this.swipeStartX) return;
        
        const endX = e.clientX;
        const diffX = this.swipeStartX - endX;
        
        // Check if swipe meets the threshold
        if (Math.abs(diffX) > this.swipeThreshold) {
            if (diffX > 0) {
                this.swipeToNextEffect();
            } else {
                this.swipeToPrevEffect();
            }
        }
        
        this.swipeStartX = 0;
    }
    
    swipeToNextEffect() {
        const effects = ['bravePink', 'heroGreen', 'combined'];
        const currentIndex = effects.indexOf(this.selectedEffect);
        const nextIndex = (currentIndex + 1) % effects.length;
        
        // Add swipe animation
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.classList.add('swipe-right');
        
        setTimeout(() => {
            this.selectEffect(effects[nextIndex]);
            imagePreview.classList.remove('swipe-right');
        }, 300);
    }
    
    swipeToPrevEffect() {
        const effects = ['bravePink', 'heroGreen', 'combined'];
        const currentIndex = effects.indexOf(this.selectedEffect);
        const prevIndex = (currentIndex - 1 + effects.length) % effects.length;
        
        // Add swipe animation
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.classList.add('swipe-left');
        
        setTimeout(() => {
            this.selectEffect(effects[prevIndex]);
            imagePreview.classList.remove('swipe-left');
        }, 300);
    }
    
    handleFileUpload(file) {
        // Check if file is an image
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/x-icon', 'image/heic', 'image/gif', 'image/bmp', 'image/tiff'];
        
        if (!imageTypes.includes(file.type)) {
            alert(this.language === 'id' ? 'Silakan unggah file gambar yang didukung' : 'Please upload a supported image file');
            return;
        }
        
        // Show loading spinner
        this.showLoading();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.updateFileInfo(file, img);
                this.resetEditor();
                this.hideLoading();
                this.showSection('editor');
            };
            img.onerror = () => {
                this.hideLoading();
                alert(this.language === 'id' ? 'Gagal memuat gambar' : 'Failed to load image');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }
    
    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }
    
    updateFileInfo(file, img) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('fileDimensions').textContent = `${img.width} × ${img.height} pixels (${this.calculateAspectRatio(img.width, img.height)})`;
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        else return (bytes / 1073741824).toFixed(1) + ' GB';
    }
    
    calculateAspectRatio(width, height) {
        // Calculate greatest common divisor
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        return `${width/divisor}:${height/divisor}`;
    }
    
    resetEditor() {
        this.history = [];
        this.historyIndex = -1;
        this.updateHistoryButtons();
        this.applyEffect();
    }
    
    applyEffect() {
        if (!this.originalImage || this.isProcessing) return;
        
        this.isProcessing = true;
        
        // Show loading spinner briefly
        this.showLoading();
        
        // Use requestAnimationFrame for smoother performance
        requestAnimationFrame(() => {
            try {
                // Save current state to history before applying new effect
                this.saveToHistory();
                
                const intensity = this.currentIntensity / 100;
                
                // Set canvas dimensions
                this.canvas.width = this.originalImage.width;
                this.canvas.height = this.originalImage.height;
                
                // Draw original image
                this.ctx.drawImage(this.originalImage, 0, 0);
                
                // Apply duotone effect
                const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                const data = imageData.data;
                
                // Define colors based on selected effect
                let darkColor, lightColor;
                
                switch (this.selectedEffect) {
                    case 'bravePink':
                        if (this.classicEnabled) {
                            darkColor = { r: 30, g: 0, b: 15 };     // Classic dark purple
                            lightColor = { r: 255, g: 105, b: 180 }; // Classic pink
                        } else {
                            darkColor = { r: 60, g: 0, b: 30 };     // Dark purple
                            lightColor = { r: 255, g: 42, b: 109 }; // Brave pink
                        }
                        break;
                    case 'heroGreen':
                        if (this.classicEnabled) {
                            darkColor = { r: 0, g: 20, b: 10 };     // Classic dark green
                            lightColor = { r: 0, g: 255, b: 170 };  // Classic green
                        } else {
                            darkColor = { r: 0, g: 40, b: 20 };     // Dark green
                            lightColor = { r: 0, g: 204, b: 136 };  // Hero green
                        }
                        break;
                    case 'combined':
                        // Green shadows and pink highlights for combined effect
                        darkColor = { r: 0, g: 60, b: 40 };        // Dark green (shadow)
                        lightColor = { r: 255, g: 105, b: 180 };   // Pink (highlight)
                        break;
                }
                
                // Reverse colors if needed
                if (this.reverseEnabled) {
                    [darkColor, lightColor] = [lightColor, darkColor];
                }
                
                // Apply duotone effect to each pixel
                for (let i = 0; i < data.length; i += 4) {
                    // Calculate grayscale value (weighted average)
                    const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
                    
                    // Calculate interpolation factor based on grayscale value
                    let t = gray / 255;
                    
                    // Apply intensity
                    t = Math.pow(t, 1 + (1 - intensity) * 2);
                    
                    // Interpolate between dark and light colors
                    data[i] = Math.round(darkColor.r + (lightColor.r - darkColor.r) * t);     // R
                    data[i + 1] = Math.round(darkColor.g + (lightColor.g - darkColor.g) * t); // G
                    data[i + 2] = Math.round(darkColor.b + (lightColor.b - darkColor.b) * t); // B
                    // Alpha channel remains unchanged
                }
                
                // Put modified image data back to canvas
                this.ctx.putImageData(imageData, 0, 0);
                
                // Store current image data for history
                this.currentImage = this.canvas.toDataURL('image/png');
                
            } catch (error) {
                console.error('Error applying effect:', error);
            } finally {
                this.isProcessing = false;
                
                // Hide loading after a brief moment (sabotase effect)
                setTimeout(() => {
                    this.hideLoading();
                }, 300);
            }
        });
    }
    
    saveToHistory() {
        // If we're in the middle of history, remove future states
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Limit history to max steps
        if (this.history.length >= this.maxHistorySteps) {
            this.history.shift();
            this.historyIndex = Math.max(0, this.historyIndex - 1);
        }
        
        // Save current state with all settings
        const historyItem = {
            imageData: this.canvas.toDataURL('image/png'),
            intensity: this.currentIntensity,
            effect: this.selectedEffect,
            classic: this.classicEnabled,
            reverse: this.reverseEnabled
        };
        
        this.history.push(historyItem);
        this.historyIndex = this.history.length - 1;
        
        // Update button states
        this.updateHistoryButtons();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreFromHistory();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreFromHistory();
        }
    }
    
    restoreFromHistory() {
        const historyItem = this.history[this.historyIndex];
        
        // Restore image
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = historyItem.imageData;
        
        // Restore settings
        this.currentIntensity = historyItem.intensity;
        this.selectedEffect = historyItem.effect;
        this.classicEnabled = historyItem.classic;
        this.reverseEnabled = historyItem.reverse;
        
        // Update UI to match restored state
        document.getElementById('intensitySlider').value = this.currentIntensity;
        document.getElementById('intensityInput').value = this.currentIntensity;
        document.getElementById('intensityValue').textContent = `${this.currentIntensity}%`;
        
        document.querySelectorAll('.dot').forEach(dot => {
            dot.classList.remove('active');
        });
        document.querySelector(`.dot[data-effect="${this.selectedEffect}"]`).classList.add('active');
        
        document.getElementById('classicToggle').classList.toggle('active', this.classicEnabled);
        document.getElementById('reverseToggle').classList.toggle('active', this.reverseEnabled);
        
        // Update effect name
        let effectName = '';
        switch(this.selectedEffect) {
            case 'bravePink':
                effectName = this.language === 'id' ? 'Brave Pink' : 'Brave Pink';
                break;
            case 'heroGreen':
                effectName = this.language === 'id' ? 'Hero Green' : 'Hero Green';
                break;
            case 'combined':
                effectName = this.language === 'id' ? 'Efek Gabungan' : 'Combined Effect';
                break;
        }
        document.getElementById('effectName').textContent = effectName;
        
        this.updateHistoryButtons();
    }
    
    updateHistoryButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        undoBtn.disabled = this.historyIndex <= 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        
        // Apply muted styles for disabled buttons
        if (undoBtn.disabled) {
            undoBtn.classList.add('disabled');
        } else {
            undoBtn.classList.remove('disabled');
        }
        
        if (redoBtn.disabled) {
            redoBtn.classList.add('disabled');
        } else {
            redoBtn.classList.remove('disabled');
        }
    }
    
    downloadImage() {
        if (!this.currentImage) return;
        
        const format = document.getElementById('exportFormat').value;
        const quality = 0.92; // High quality
        
        // Convert to desired format
        let mimeType;
        switch(format) {
            case 'png': mimeType = 'image/png'; break;
            case 'jpeg': mimeType = 'image/jpeg'; break;
            case 'jpg': mimeType = 'image/jpeg'; break;
            case 'webp': mimeType = 'image/webp'; break;
            case 'ico': mimeType = 'image/x-icon'; break;
            case 'bmp': mimeType = 'image/bmp'; break;
            case 'gif': mimeType = 'image/gif'; break;
            case 'tiff': mimeType = 'image/tiff'; break;
            default: mimeType = 'image/png';
        }
        
        // Convert data URL to blob with desired format
        const img = new Image();
        img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0);
            
            const dataUrl = tempCanvas.toDataURL(mimeType, quality);
            
            const link = document.createElement('a');
            link.download = `duotone-${this.selectedEffect}-${Date.now()}.${format}`;
            link.href = dataUrl;
            link.click();
        };
        img.src = this.currentImage;
    }
    
    shareImage() {
        if (!this.currentImage) return;
        
        if (navigator.share) {
            // Convert data URL to blob
            fetch(this.currentImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `duotone-${this.selectedEffect}.png`, { type: 'image/png' });
                    
                    navigator.share({
                        title: 'Duotone Photo Editor',
                        text: this.language === 'id' ? 
                            'Saya membuat gambar ini dengan Duotone Photo Editor : https://bravepink-herogreen.zone.id' :
                            'I created this image with Duotone Photo Editor : https://bravepink-herogreen.zone.id',
                        files: [file]
                    })
                    .catch(error => {
                        console.log('Sharing failed', error);
                        this.fallbackShare();
                    });
                });
        } else {
            this.fallbackShare();
        }
    }
    
    fallbackShare() {
        // Fallback for browsers that don't support Web Share API
        const shareText = this.language === 'id' ? 
            'Saya membuat gambar ini dengan Duotone Photo Editor : https://bravepink-herogreen.zone.id' :
            'I created this image with Duotone Photo Editor : https://bravepink-herogreen.zone.id';
            
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText)
                .then(() => {
                    alert(this.language === 'id' ? 
                        'Tautan disalin ke clipboard! Bagikan dengan teman-teman Anda.' : 
                        'Link copied to clipboard! Share it with your friends.');
                })
                .catch(err => {
                    alert(shareText);
                });
        } else {
            alert(shareText);
        }
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
    
    handleFeedbackSubmit() {
        const form = document.getElementById('feedbackForm');
        const success = document.getElementById('feedbackSuccess');
        const name = document.getElementById('feedbackName').value;
        const email = document.getElementById('feedbackEmail').value;
        const message = document.getElementById('feedbackMessage').value;
        
        // In a real application, you would send this data to a server
        // For demo purposes, we'll just show a success message
        console.log('Feedback submitted:', { name, email, message });
        
        // Send feedback to WhatsApp (this would need a server in production)
        const whatsappMessage = encodeURIComponent(
            `New Feedback from Duotone Photo Editor:\n\nName: ${name || 'Not provided'}\nEmail: ${email || 'Not provided'}\nMessage: ${message}`
        );
        
        // Open WhatsApp with pre-filled message (user would need to manually send)
        window.open(`https://wa.me/6283872050439?text=${whatsappMessage}`, '_blank');
        
        form.classList.add('hidden');
        success.classList.remove('hidden');
        
        // Reset form after 3 seconds
        setTimeout(() => {
            form.reset();
            form.classList.remove('hidden');
            success.classList.add('hidden');
        }, 3000);
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DuotoneEditor();
});