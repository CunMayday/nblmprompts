// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('galleryGrid');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.getElementById('modalClose');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const searchInput = document.getElementById('searchInput');

    let currentFilter = 'all';
    let searchQuery = '';

    const prioritizedTitles = [
        'Educational Sketch-Note (Hand-Drawn)',
        'Engineering Blueprint Schematic',
        'Sumi-e Tech Scroll',
        'Neumorphic Tech Schematic',
        'Architectural Process Schematic',
        'Risograph Educational Print',
        'Analogue Brainstorming (Spiral Notebook)',
        'CAD Engineering Blueprint',
        'Retro-Travel / Passport UI',
        'Chalkboard / Educational Sketch',
        'Technical Schematic (Educational/Isometric)',
        'Flat Lay Minimalist (Organized/Knolling)',
        'Technical Blueprint Schematic',
        'Minimalist Timeline Infographic'
    ];
    const prioritizedTitleIndex = new Map(prioritizedTitles.map((title, index) => [title, index]));
    const bottomMatchers = [
        title => title.includes('thermal'),
        title => title.includes('pcb'),
        title => title.includes('cyberpunk'),
        title => title.includes('elegant'),
        title => title.includes('kawaii'),
        title => title.includes('retro pop'),
        title => title.includes('retro hacker'),
        title => title.includes('art deco'),
        title => title.includes('cyber') && !title.includes('cyberpunk')
    ];
    const sortedStyles = infographicStyles
        .filter(item => item.title !== 'Steampunk Nebula Explorer')
        .map(item => {
            if (!prioritizedTitleIndex.has(item.title)) {
                return item;
            }

            const tags = item.tags.includes('clean') ? item.tags : ['clean', ...item.tags];
            return { ...item, tags };
        })
        .map((item, originalIndex) => ({ item, originalIndex }))
        .sort((a, b) => {
            const aPriority = prioritizedTitleIndex.has(a.item.title)
                ? prioritizedTitleIndex.get(a.item.title)
                : Number.POSITIVE_INFINITY;
            const bPriority = prioritizedTitleIndex.has(b.item.title)
                ? prioritizedTitleIndex.get(b.item.title)
                : Number.POSITIVE_INFINITY;
            const aBottomRank = bottomMatchers.findIndex(matcher => matcher(a.item.title.toLowerCase()));
            const bBottomRank = bottomMatchers.findIndex(matcher => matcher(b.item.title.toLowerCase()));

            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            if (aPriority === Number.POSITIVE_INFINITY && bPriority === Number.POSITIVE_INFINITY) {
                const aIsBottom = aBottomRank !== -1;
                const bIsBottom = bBottomRank !== -1;

                if (aIsBottom !== bIsBottom) {
                    return aIsBottom ? 1 : -1;
                }

                if (aIsBottom && bIsBottom && aBottomRank !== bBottomRank) {
                    return aBottomRank - bBottomRank;
                }
            }

            return a.originalIndex - b.originalIndex;
        })
        .map(entry => entry.item);
    const numberedStyles = sortedStyles.map((item, index) => ({
        ...item,
        title: `${index + 1}. ${item.title}`
    }));

    // Collection labels mapping
    const collectionLabels = {
        'set1': 'Fantastic Set',
        'set2': 'Practical Set',
        'set1-extended': 'Practical Set',
        'set2-extended': 'Practical Set',
        '12-fabulous': '12 Fabulous',
        '9-creative': '9 Creative'
    };

    function getCollectionLabel(collection) {
        return collectionLabels[collection] || 'NotebookLM Style';
    }

    // Initialize the gallery
    function initGallery() {
        renderGallery();
        setupEventListeners();
        updateTabCounts();
    }

    // Render gallery items
    function renderGallery() {
        galleryGrid.innerHTML = '';
        
        numberedStyles.forEach((item, index) => {
            const shouldShow = currentFilter === 'all' || item.collection === currentFilter;
            const card = createGalleryCard(item, index);
            
            if (!shouldShow) {
                card.classList.add('hidden');
            }
            
            galleryGrid.appendChild(card);
        });
    }

    // Create a gallery card
    function createGalleryCard(item, index) {
        const card = document.createElement('div');
        card.className = 'gallery-item';
        card.style.animationDelay = `${(index % 6) * 0.1}s`;
        
        const collectionLabel = getCollectionLabel(item.collection);
        
        card.innerHTML = `
            <div class="item-image">
                <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
                <div class="item-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <span>View Details & Prompt</span>
                </div>
                <div class="item-actions">
                    <button class="action-btn copy-btn" data-tooltip="Copy Prompt" aria-label="Copy Prompt">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <button class="action-btn expand-btn" data-tooltip="View Details" aria-label="View Details">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <polyline points="9 21 3 21 3 15"></polyline>
                            <line x1="21" y1="3" x2="14" y2="10"></line>
                            <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="item-info">
                <h3 class="item-title">${item.title}</h3>
                <div class="item-tags">
                    ${item.tags.slice(0, 3).map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        
        // Quick actions
        const copyBtn = card.querySelector('.copy-btn');
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(item.prompt, copyBtn);
        });

        const expandBtn = card.querySelector('.expand-btn');
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(item);
        });

        card.addEventListener('click', () => openModal(item));
        
        return card;
    }

    // Open modal with item details
    function openModal(item) {
        const collectionLabel = getCollectionLabel(item.collection);
        
        modalBody.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.title}" class="modal-image">
            <h2 class="modal-title">${item.title}</h2>
            
            <div class="modal-section">
                <h3 class="modal-section-title">Design Categories</h3>
                <div class="modal-tags">
                    ${item.tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('')}
                </div>
            </div>
            
            <div class="modal-section">
                <h3 class="modal-section-title">Complete Prompt</h3>
                <div class="modal-prompt">${item.prompt}</div>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Setup event listeners
    function setupEventListeners() {
        // Modal close events
        modalClose.addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', closeModal);
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
        
        // Filter tabs
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active tab
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update filter
                currentFilter = tab.dataset.collection;
                filterGallery();
            });
        });

        // Search input
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            filterGallery();
        });
    }

    // Copy function
    function copyToClipboard(text, btn) {
        navigator.clipboard.writeText(text).then(() => {
            const originalTooltip = btn.getAttribute('data-tooltip');
            btn.setAttribute('data-tooltip', 'Copied!');
            btn.classList.add('success');
            
            setTimeout(() => {
                btn.setAttribute('data-tooltip', originalTooltip);
                btn.classList.remove('success');
            }, 2000);

            showToast('Prompt copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy prompt', true);
        });
    }

    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : ''}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('visible');
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }, 10);
    }

    // Filter gallery items
    function filterGallery() {
        const items = document.querySelectorAll('.gallery-item');
        let visibleCount = 0;
        
        items.forEach((item, index) => {
            const itemData = numberedStyles[index];
            const matchesFilter = currentFilter === 'all' || 
                                (currentFilter === 'set2' ? 
                                    (itemData.collection === 'set2' || itemData.collection === 'set1-extended' || itemData.collection === 'set2-extended') : 
                                    itemData.collection === currentFilter);
            
            const matchesSearch = itemData.title.toLowerCase().includes(searchQuery) || 
                                 itemData.tags.some(tag => tag.toLowerCase().includes(searchQuery));
            
            const shouldShow = matchesFilter && matchesSearch;
            
            if (shouldShow) {
                item.classList.remove('hidden');
                visibleCount++;
            } else {
                item.classList.add('hidden');
            }
        });

        // Update counts if necessary or show "No results"
        updateNoResultsMessage(visibleCount);
    }

    function updateNoResultsMessage(count) {
        let message = document.getElementById('noResultsMessage');
        if (count === 0) {
            if (!message) {
                message = document.createElement('div');
                message.id = 'noResultsMessage';
                message.className = 'no-results';
                message.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <p>No styles found matching your search.</p>
                `;
                galleryGrid.after(message);
            }
        } else if (message) {
            message.remove();
        }
    }

    // Update tab counts
    function updateTabCounts() {
        filterTabs.forEach(tab => {
            const collection = tab.dataset.collection;
            const countElement = tab.querySelector('.tab-count');
            
            if (countElement) {
                if (collection === 'all') {
                    countElement.textContent = numberedStyles.length;
                } else if (collection === 'set2') {
                    // Combine set2 and extended sets for Practical Set
                    const count = numberedStyles.filter(item => 
                        item.collection === 'set2' || 
                        item.collection === 'set1-extended' || 
                        item.collection === 'set2-extended'
                    ).length;
                    countElement.textContent = count;
                } else {
                    const count = numberedStyles.filter(item => item.collection === collection).length;
                    countElement.textContent = count;
                }
            }
        });
    }

    // Smooth scroll animations
    function setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.gallery-item').forEach(item => {
            observer.observe(item);
        });
    }

    // Add keyboard navigation for gallery
    function setupKeyboardNavigation() {
        let focusedIndex = -1;
        const items = document.querySelectorAll('.gallery-item');

        document.addEventListener('keydown', (e) => {
            // Only handle arrow keys when modal is not open
            if (modal.classList.contains('active')) return;

            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                
                if (e.key === 'ArrowRight') {
                    focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
                } else {
                    focusedIndex = Math.max(focusedIndex - 1, 0);
                }

                if (items[focusedIndex] && !items[focusedIndex].classList.contains('hidden')) {
                    items[focusedIndex].focus();
                    items[focusedIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }

            if (e.key === 'Enter' && focusedIndex >= 0) {
                items[focusedIndex].click();
            }
        });

        // Make gallery items focusable
        items.forEach((item, index) => {
            item.setAttribute('tabindex', '0');
            item.addEventListener('focus', () => {
                focusedIndex = index;
            });
        });
    }

    // Copy prompt to clipboard functionality
    function setupCopyPrompt() {
        modalBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-prompt')) {
                const text = e.target.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    // Show a temporary tooltip
                    const tooltip = document.createElement('div');
                    tooltip.textContent = 'Prompt copied to clipboard!';
                    tooltip.style.cssText = `
                        position: fixed;
                        bottom: 2rem;
                        left: 50%;
                        transform: translateX(-50%);
                        background: var(--gradient-primary);
                        color: white;
                        padding: 1rem 1.5rem;
                        border-radius: 0.5rem;
                        font-weight: 600;
                        z-index: 10000;
                        animation: fadeInUp 0.3s ease;
                        box-shadow: var(--shadow-lg);
                    `;
                    document.body.appendChild(tooltip);
                    setTimeout(() => {
                        tooltip.style.animation = 'fadeOut 0.3s ease';
                        setTimeout(() => tooltip.remove(), 300);
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        });

        // Add click cursor hint to prompt
        const style = document.createElement('style');
        style.textContent = `
            .modal-prompt {
                cursor: pointer;
                position: relative;
            }
            .modal-prompt:hover::after {
                content: 'Click to copy';
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: var(--color-primary);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.75rem;
                font-family: var(--font-primary);
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translateX(-50%) translateY(0); }
                to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Add loading state for images
    function setupImageLoading() {
        const images = document.querySelectorAll('.gallery-item img');
        images.forEach(img => {
            img.addEventListener('load', () => {
                img.style.opacity = '1';
            });
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
        });
    }

    // Initialize everything
    initGallery();
    setupScrollAnimations();
    setupKeyboardNavigation();
    setupCopyPrompt();
    setupImageLoading();

    // Back to top functionality
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Add a subtle parallax effect to hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero-content');
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.3}px)`;
            hero.style.opacity = Math.max(1 - scrolled / 500, 0);
        }
    });

    console.log('%c🎨 NotebookLM Infographics Showcase', 'color: #6366f1; font-size: 20px; font-weight: bold;');
    console.log('%cCurated by Paolo Cortez', 'color: #ec4899; font-size: 14px;');
    console.log(`%c${numberedStyles.length} design styles loaded successfully!`, 'color: #f59e0b; font-size: 12px;');
});
