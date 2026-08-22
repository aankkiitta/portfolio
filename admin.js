// ==================================================
// ADMIN PANEL - MAIN JAVASCRIPT (PRODUCTION READY)
// ==================================================

// ==================================================
// API CONFIGURATION - AUTO DETECT ENVIRONMENT
// ==================================================

// Auto-detect environment - uses window.location to determine if local or production
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://portfolio-3-l63x.onrender.com'; // YOUR LIVE BACKEND URL

const API_URL = `${API_BASE_URL}/api`;

// ==================================================
// AUTHENTICATION HELPERS
// ==================================================

function getToken() {
    return localStorage.getItem('adminToken');
}

function getAuthHeaders() {
    const token = getToken();
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
}

function handleUnauthorized() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    showToast('Your session has expired. Please login again.', 'error');
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

function getImageUrl(imagePath) {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
}

// ==================================================
// STATE
// ==================================================

let token = localStorage.getItem('adminToken');
let currentUser = null;
let editingId = null;

// ==================================================
// AUTHENTICATION
// ==================================================

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success && data.token) {
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify(currentUser));
            
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboardScreen').style.display = 'flex';
            document.getElementById('adminName').textContent = currentUser.username;
            
            loadDashboard();
            loadProjectsSelect();
        } else {
            errorEl.textContent = data.error || 'Login failed. Please try again.';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Cannot connect to the live server. Please check your connection.';
        errorEl.style.display = 'block';
        console.error('Login error:', error);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    token = null;
    currentUser = null;
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
});

// Check if already logged in
if (token && localStorage.getItem('adminUser')) {
    currentUser = JSON.parse(localStorage.getItem('adminUser'));
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'flex';
    document.getElementById('adminName').textContent = currentUser.username;
    loadDashboard();
    loadProjectsSelect();
}

// ==================================================
// NAVIGATION
// ==================================================

document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showTab(link.dataset.tab);
    });
});

function showTab(tab) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.querySelector(`.sidebar-nav a[data-tab="${tab}"]`)?.classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    
    const titles = {
        dashboard: 'Dashboard',
        projects: 'All Projects',
        create: editingId ? 'Edit Project' : 'Create New Project'
    };
    
    document.getElementById('pageTitle').textContent = titles[tab] || 'Dashboard';
    
    if (tab === 'dashboard') {
        document.getElementById('dashboardContent').style.display = 'block';
        loadDashboard();
    } else if (tab === 'projects') {
        document.getElementById('projectsContent').style.display = 'block';
        loadAllProjects();
    } else if (tab === 'create') {
        document.getElementById('createContent').style.display = 'block';
        document.getElementById('formTitle').textContent = editingId ? 'Edit Project' : 'Create New Project';
        document.getElementById('submitBtn').innerHTML = editingId ? 
            '<i class="fas fa-save"></i> Update Project' : 
            '<i class="fas fa-save"></i> Save Project';
    }
}

// ==================================================
// DASHBOARD
// ==================================================

async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }
        
        if (response.ok) {
            const projects = await response.json();
            
            document.getElementById('totalProjects').textContent = projects.length;
            document.getElementById('liveProjects').textContent = projects.filter(p => p.status === 'Live').length;
            document.getElementById('archivedProjects').textContent = projects.filter(p => p.status === 'Archived').length;
            
            const recent = projects.slice(0, 5);
            const tbody = document.getElementById('recentProjectsTable');
            tbody.innerHTML = renderProjectRows(recent);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Cannot connect to the live server. Please check your connection.', 'error');
    }
}

// ==================================================
// PROJECTS LIST
// ==================================================

async function loadAllProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }
        
        if (response.ok) {
            const projects = await response.json();
            const tbody = document.getElementById('allProjectsTable');
            tbody.innerHTML = renderProjectRows(projects);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showToast('Cannot connect to the live server. Please check your connection.', 'error');
    }
}

function renderProjectRows(projects) {
    if (projects.length === 0) {
        return '<tr><td colspan="5" style="text-align:center; padding:40px; color: var(--text-muted);">No projects found. Create your first project!</td></tr>';
    }
    
    return projects.map(p => `
        <tr>
            <td><strong>${p.project_name}</strong></td>
            <td>${p.category}</td>
            <td><span class="status-badge ${p.status.toLowerCase().replace(' ', '-')}">${p.status}</span></td>
            <td>${p.completion_date || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editProject(${p.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="deleteProject(${p.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==================================================
// PROJECT SELECT DROPDOWNS
// ==================================================

async function loadProjectsSelect() {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }
        
        if (response.ok) {
            const projects = await response.json();
            
            const selects = ['prevProject', 'nextProject'];
            selects.forEach(id => {
                const select = document.getElementById(id);
                if (!select) return;
                const currentValue = select.value;
                select.innerHTML = '<option value="">None</option>';
                projects.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.textContent = p.project_name;
                    select.appendChild(option);
                });
                if (currentValue) select.value = currentValue;
            });
        }
    } catch (error) {
        console.error('Error loading projects for select:', error);
    }
}

// ==================================================
// CREATE / EDIT PROJECT
// ==================================================

// Auto-generate slug from project name
const projectNameInput = document.getElementById('projectName');
const slugInput = document.getElementById('projectSlugInput');

if (projectNameInput && slugInput) {
    projectNameInput.addEventListener('input', function() {
        if (!slugInput.dataset.manual) {
            slugInput.value = this.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        }
    });

    slugInput.addEventListener('input', function() {
        this.dataset.manual = 'true';
        this.value = this.value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .replace(/^-|-$/g, '');
    });
}

// Image previews
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    
    input.addEventListener('change', function(e) {
        preview.innerHTML = '';
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

const heroImage = document.getElementById("heroImage");
const heroPreview = document.getElementById("heroImagePreview");

if (heroImage && heroPreview) {
    heroImage.addEventListener("input", () => {
        const url = heroImage.value.trim();
        heroPreview.innerHTML = url
            ? `<img src="${getImageUrl(url)}" alt="Hero Preview">`
            : "";
    });
}

// Gallery upload
const galleryUpload = document.getElementById('galleryUpload');
const galleryPreview = document.getElementById('galleryPreview');

if (galleryUpload && galleryPreview) {
    galleryUpload.addEventListener('change', function(e) {
        galleryPreview.innerHTML = '';
        if (this.files) {
            for (const file of this.files) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    galleryPreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        }
    });
}

// ==================================================
// SECTION TOGGLE
// ==================================================

function toggleSection(header) {
    const section = header.parentElement;
    const body = section.querySelector('.section-body');
    const icon = header.querySelector('.toggle-icon');
    
    body.classList.toggle('hidden');
    header.classList.toggle('active');
    const chevron = icon.querySelector('i');
    if (chevron) {
        chevron.classList.toggle('fa-chevron-down');
        chevron.classList.toggle('fa-chevron-up');
    }
}

// ==================================================
// DYNAMIC ITEMS - GALLERY
// ==================================================

let galleryCounter = 0;
let featureCounter = 0;
let techCounter = 0;
let timelineCounter = 0;
let challengeCounter = 0;
let learningCounter = 0;
let statCounter = 0;

function addGalleryItem(imagePath = '', title = '', description = '') {
    const container = document.getElementById('galleryContainer');
    if (!container) return;
    const id = galleryCounter++;
    
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `gallery-item-${id}`;
    div.innerHTML = `
        <div class="item-header">
            <span class="item-title">Gallery Image #${id + 1}</span>
            <button type="button" class="item-remove" onclick="removeDynamicItem('gallery-item-${id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Image Path</label>
                <input type="text" name="gallery_image_path" value="${imagePath}" placeholder="Image path from upload" />
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="gallery_title" value="${title}" placeholder="Image title" />
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <input type="text" name="gallery_description" value="${description}" placeholder="Brief description" />
        </div>
        <input type="hidden" name="gallery_display_order" value="${id}" />
    `;
    container.appendChild(div);
}

function addFeature(icon = 'fa-check-circle', title = '', description = '') {
    const container = document.getElementById('featuresContainer');
    if (!container) return;
    const id = featureCounter++;
    
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `feature-item-${id}`;
    div.innerHTML = `
        <div class="item-header">
            <span class="item-title">Feature #${id + 1}</span>
            <button type="button" class="item-remove" onclick="removeDynamicItem('feature-item-${id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Icon (Font Awesome class)</label>
                <input type="text" name="feature_icon" value="${icon}" placeholder="fa-check-circle" />
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="feature_title" value="${title}" placeholder="Feature title" />
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <input type="text" name="feature_description" value="${description}" placeholder="Brief description" />
        </div>
        <input type="hidden" name="feature_display_order" value="${id}" />
    `;
    container.appendChild(div);
}

function addTechItem(name = '', icon = 'fab fa-html5', color = '#e44d26', category = 'Frontend') {
    const container = document.getElementById('techStackContainer');
    if (!container) return;
    const id = techCounter++;
    
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `tech-item-${id}`;
    div.innerHTML = `
        <div class="item-header">
            <span class="item-title">Technology #${id + 1}</span>
            <button type="button" class="item-remove" onclick="removeDynamicItem('tech-item-${id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Technology Name</label>
                <input type="text" name="tech_name" value="${name}" placeholder="e.g., React" />
            </div>
            <div class="form-group">
                <label>Icon (Font Awesome class)</label>
                <input type="text" name="tech_icon" value="${icon}" placeholder="fab fa-react" />
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Color (hex code)</label>
                <input type="text" name="tech_color" value="${color}" placeholder="#61dafb" />
            </div>
            <div class="form-group">
                <label>Category</label>
                <select name="tech_category">
                    <option value="Frontend" ${category === 'Frontend' ? 'selected' : ''}>Frontend</option>
                    <option value="Backend" ${category === 'Backend' ? 'selected' : ''}>Backend</option>
                    <option value="Database" ${category === 'Database' ? 'selected' : ''}>Database</option>
                    <option value="Tools" ${category === 'Tools' ? 'selected' : ''}>Tools</option>
                    <option value="Deployment" ${category === 'Deployment' ? 'selected' : ''}>Deployment</option>
                </select>
            </div>
        </div>
        <input type="hidden" name="tech_display_order" value="${id}" />
    `;
    container.appendChild(div);
}

function addTimelineItem(stepNumber = '', title = '', description = '') {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    const id = timelineCounter++;
    
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `timeline-item-${id}`;
    div.innerHTML = `
        <div class="item-header">
            <span class="item-title">Timeline Step #${id + 1}</span>
            <button type="button" class="item-remove" onclick="removeDynamicItem('timeline-item-${id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Step Number</label>
                <input type="number" name="timeline_step_number" value="${stepNumber}" placeholder="1" />
            </div>
            <div class="form-group">
                <label>Step Title</label>
                <input type="text" name="timeline_step_title" value="${title}" placeholder="e.g., Planning" />
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <input type="text" name="timeline_description" value="${description}" placeholder="Step description" />
        </div>
        <input type="hidden" name="timeline_display_order" value="${id}" />
    `;
    container.appendChild(div);
}

function addChallenge(icon = 'fa-bolt', title = '', description = '', solution = '') {
    const container = document.getElementById('challengesContainer');
    if (!container) return;
    const id = challengeCounter++;
    
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `challenge-item-${id}`;
    div.innerHTML = `
        <div class="item-header">
            <span class="item-title">Challenge #${id + 1}</span>
            <button type="button" class="item-remove" onclick="removeDynamicItem('challenge-item-${id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Icon (Font Awesome class)</label>
                <input type="text" name="challenge_icon" value="${icon}" placeholder="fa-bolt" />
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="challenge_title" value="${title}" placeholder="Challenge title" />
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <input type="text" name="challenge_description" value="${description}" placeholder="Challenge description" />
        </div>
        <div class="form-group">
            <label>Solution</label>
            <input type="text" name="challenge_solution" value="${solution}" placeholder="How was it solved?" />
        </div>
        <input type="hidden" name="challenge_display_order" value="${id}" />
    `;
    container.appendChild(div);
}

function addLearning(text = '') {
    const container = document.getElementById('learningsContainer');
    if (!container) return;
    const id = learningCounter++;
    
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `learning-item-${id}`;
    div.innerHTML = `
        <div class="item-header">
            <span class="item-title">Learning #${id + 1}</span>
            <button type="button" class="item-remove" onclick="removeDynamicItem('learning-item-${id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="form-group">
            <label>Learning Point</label>
            <input type="text" name="learning_text" value="${text}" placeholder="What did you learn?" />
        </div>
        <input type="hidden" name="learning_display_order" value="${id}" />
    `;
    container.appendChild(div);
}

function addStatistic(title = '', value = '', icon = 'fa-chart-bar') {
    const container = document.getElementById('statisticsContainer');
    if (!container) return;
    const id = statCounter++;
    
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = `stat-item-${id}`;
    div.innerHTML = `
        <div class="item-header">
            <span class="item-title">Statistic #${id + 1}</span>
            <button type="button" class="item-remove" onclick="removeDynamicItem('stat-item-${id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="stat_title" value="${title}" placeholder="e.g., Lines of Code" />
            </div>
            <div class="form-group">
                <label>Value</label>
                <input type="text" name="stat_value" value="${value}" placeholder="e.g., 8,500+" />
            </div>
        </div>
        <div class="form-group">
            <label>Icon (Font Awesome class)</label>
            <input type="text" name="stat_icon" value="${icon}" placeholder="fa-code" />
        </div>
        <input type="hidden" name="stat_display_order" value="${id}" />
    `;
    container.appendChild(div);
}

// ==================================================
// REMOVE DYNAMIC ITEM
// ==================================================

function removeDynamicItem(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

// ==================================================
// GET FORM DATA
// ==================================================

function getFormData() {
    const formData = new FormData();
    
    // Basic Info
    formData.append('project_name', document.getElementById('projectName').value);
    formData.append('project_slug', document.getElementById('projectSlugInput').value);
    formData.append('category', document.getElementById('projectCategory').value);
    formData.append('status', document.getElementById('projectStatus').value);
    formData.append('completion_date', document.getElementById('completionDate').value);
    formData.append('role', document.getElementById('projectRole').value);
    formData.append('tagline', document.getElementById('tagline').value);
    formData.append('github_url', document.getElementById('githubUrl').value);
    formData.append('demo_url', document.getElementById('demoUrl').value);
    
    // Images
    formData.append('hero_image', document.getElementById('heroImage').value.trim());
    
    const bannerImage = document.getElementById('bannerImage');
    if (bannerImage && bannerImage.files && bannerImage.files[0]) {
        formData.append('banner_image', bannerImage.files[0]);
    }
    
    // Overview, Problem, Solution
    formData.append('overview', document.getElementById('overview').value);
    formData.append('problem_statement', document.getElementById('problemStatement').value);
    formData.append('solution', document.getElementById('solution').value);
    
    // SEO
    formData.append('meta_title', document.getElementById('metaTitle').value);
    formData.append('meta_description', document.getElementById('metaDescription').value);
    formData.append('meta_keywords', document.getElementById('metaKeywords').value);
    
    // Navigation - Using IDs
    const prevProject = document.getElementById('prevProject');
    const nextProject = document.getElementById('nextProject');
    formData.append('prev_project', prevProject ? prevProject.value : '');
    formData.append('next_project', nextProject ? nextProject.value : '');
    
    // Gallery
    const galleryItems = document.querySelectorAll('#galleryContainer .dynamic-item');
    const gallery = [];
    galleryItems.forEach(item => {
        const imagePath = item.querySelector('input[name="gallery_image_path"]')?.value || '';
        const title = item.querySelector('input[name="gallery_title"]')?.value || '';
        const description = item.querySelector('input[name="gallery_description"]')?.value || '';
        const displayOrder = item.querySelector('input[name="gallery_display_order"]')?.value || 0;
        if (imagePath) {
            gallery.push({ image_path: imagePath, title, description, display_order: parseInt(displayOrder) });
        }
    });
    formData.append('gallery', JSON.stringify(gallery));
    
    // Features
    const featuresItems = document.querySelectorAll('#featuresContainer .dynamic-item');
    const features = [];
    featuresItems.forEach(item => {
        const icon = item.querySelector('input[name="feature_icon"]')?.value || '';
        const title = item.querySelector('input[name="feature_title"]')?.value || '';
        const description = item.querySelector('input[name="feature_description"]')?.value || '';
        const displayOrder = item.querySelector('input[name="feature_display_order"]')?.value || 0;
        if (icon && title) {
            features.push({ icon, title, description, display_order: parseInt(displayOrder) });
        }
    });
    formData.append('features', JSON.stringify(features));
    
    // Tech Stack
    const techItems = document.querySelectorAll('#techStackContainer .dynamic-item');
    const techStack = [];
    techItems.forEach(item => {
        const tech_name = item.querySelector('input[name="tech_name"]')?.value || '';
        const tech_icon = item.querySelector('input[name="tech_icon"]')?.value || '';
        const tech_color = item.querySelector('input[name="tech_color"]')?.value || '#6C4DFF';
        const tech_category = item.querySelector('select[name="tech_category"]')?.value || 'Frontend';
        const displayOrder = item.querySelector('input[name="tech_display_order"]')?.value || 0;
        if (tech_name && tech_icon) {
            techStack.push({ tech_name, tech_icon, tech_color, tech_category, display_order: parseInt(displayOrder) });
        }
    });
    formData.append('techStack', JSON.stringify(techStack));
    
    // Timeline
    const timelineItems = document.querySelectorAll('#timelineContainer .dynamic-item');
    const timeline = [];
    timelineItems.forEach(item => {
        const step_number = item.querySelector('input[name="timeline_step_number"]')?.value || 0;
        const step_title = item.querySelector('input[name="timeline_step_title"]')?.value || '';
        const description = item.querySelector('input[name="timeline_description"]')?.value || '';
        const displayOrder = item.querySelector('input[name="timeline_display_order"]')?.value || 0;
        if (step_title) {
            timeline.push({ step_number: parseInt(step_number), step_title, description, display_order: parseInt(displayOrder) });
        }
    });
    formData.append('timeline', JSON.stringify(timeline));
    
    // Challenges
    const challengeItems = document.querySelectorAll('#challengesContainer .dynamic-item');
    const challenges = [];
    challengeItems.forEach(item => {
        const icon = item.querySelector('input[name="challenge_icon"]')?.value || '';
        const title = item.querySelector('input[name="challenge_title"]')?.value || '';
        const description = item.querySelector('input[name="challenge_description"]')?.value || '';
        const solution = item.querySelector('input[name="challenge_solution"]')?.value || '';
        const displayOrder = item.querySelector('input[name="challenge_display_order"]')?.value || 0;
        if (icon && title) {
            challenges.push({ icon, title, description, solution, display_order: parseInt(displayOrder) });
        }
    });
    formData.append('challenges', JSON.stringify(challenges));
    
    // Learnings
    const learningItems = document.querySelectorAll('#learningsContainer .dynamic-item');
    const learnings = [];
    learningItems.forEach(item => {
        const learning_text = item.querySelector('input[name="learning_text"]')?.value || '';
        const displayOrder = item.querySelector('input[name="learning_display_order"]')?.value || 0;
        if (learning_text) {
            learnings.push({ learning_text, display_order: parseInt(displayOrder) });
        }
    });
    formData.append('learnings', JSON.stringify(learnings));
    
    // Statistics
    const statItems = document.querySelectorAll('#statisticsContainer .dynamic-item');
    const statistics = [];
    statItems.forEach(item => {
        const stat_title = item.querySelector('input[name="stat_title"]')?.value || '';
        const stat_value = item.querySelector('input[name="stat_value"]')?.value || '';
        const stat_icon = item.querySelector('input[name="stat_icon"]')?.value || '';
        const displayOrder = item.querySelector('input[name="stat_display_order"]')?.value || 0;
        if (stat_title && stat_value) {
            statistics.push({ stat_title, stat_value, stat_icon, display_order: parseInt(displayOrder) });
        }
    });
    formData.append('statistics', JSON.stringify(statistics));
    
    return formData;
}

// ==================================================
// SUBMIT FORM - ID BASED
// ==================================================

document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const mode = document.getElementById('formMode').value;
    const projectId = document.getElementById('projectSlug')?.value || '';
    const formData = getFormData();
    
    // Validate required fields
    if (!formData.get('project_name') || !formData.get('project_slug') || !formData.get('category')) {
        showToast('Please fill in all required fields (Name, Slug, Category).', 'error');
        return;
    }
    
    const url = mode === 'create' 
        ? `${API_URL}/projects` 
        : `${API_URL}/projects/${projectId}`;
    
    const method = mode === 'create' ? 'POST' : 'PUT';
    
    const token = getToken();
    if (!token) {
        handleUnauthorized();
        return;
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(data.message || 'Project saved successfully!', 'success');
            
            if (mode === 'create') {
                resetForm();
                loadProjectsSelect();
                showTab('projects');
                loadAllProjects();
            } else {
                showTab('projects');
                loadAllProjects();
            }
        } else {
            showToast(data.error || 'Failed to save project.', 'error');
        }
    } catch (error) {
        showToast('Cannot connect to the live server. Please check your connection.', 'error');
        console.error('Error saving project:', error);
    }
});

// ==================================================
// EDIT PROJECT - ID BASED
// ==================================================

async function editProject(id) {
    try {
        const token = getToken();
        if (!token) {
            handleUnauthorized();
            return;
        }
        
        const response = await fetch(`${API_URL}/projects/${id}`, {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }
        
        if (response.ok) {
            const project = await response.json();
            
            document.getElementById('formMode').value = 'edit';
            document.getElementById('projectSlug').value = id;
            editingId = id;
            
            // Fill basic info
            document.getElementById('projectName').value = project.project_name || '';
            document.getElementById('projectSlugInput').value = project.project_slug || '';
            document.getElementById('projectSlugInput').dataset.manual = 'true';
            document.getElementById('projectCategory').value = project.category || '';
            document.getElementById('projectStatus').value = project.status || 'Live';
            document.getElementById('completionDate').value = project.completion_date || '';
            document.getElementById('projectRole').value = project.role || '';
            document.getElementById('tagline').value = project.tagline || '';
            document.getElementById('githubUrl').value = project.github_url || '';
            document.getElementById('demoUrl').value = project.demo_url || '';
            
            // Overview, Problem, Solution
            document.getElementById('overview').value = project.overview || '';
            document.getElementById('problemStatement').value = project.problem_statement || '';
            document.getElementById('solution').value = project.solution || '';
            
            // SEO
            document.getElementById('metaTitle').value = project.meta_title || '';
            document.getElementById('metaDescription').value = project.meta_description || '';
            document.getElementById('metaKeywords').value = project.meta_keywords || '';
            
            // Navigation
            document.getElementById('prevProject').value = project.prev_project || '';
            document.getElementById('nextProject').value = project.next_project || '';
            
            // Hero Image
            document.getElementById('heroImage').value = project.hero_image || '';
            
            if (project.hero_image) {
                const preview = document.getElementById('heroImagePreview');
                if (preview) {
                    preview.innerHTML = `<img src="${getImageUrl(project.hero_image)}" alt="Hero">`;
                }
            }
            
            // Banner Image
            if (project.banner_image) {
                const preview = document.getElementById('bannerImagePreview');
                if (preview) {
                    preview.innerHTML = `<img src="${getImageUrl(project.banner_image)}" alt="Banner" />`;
                }
            }
            
            // Clear dynamic containers
            document.getElementById('galleryContainer').innerHTML = '';
            document.getElementById('featuresContainer').innerHTML = '';
            document.getElementById('techStackContainer').innerHTML = '';
            document.getElementById('timelineContainer').innerHTML = '';
            document.getElementById('challengesContainer').innerHTML = '';
            document.getElementById('learningsContainer').innerHTML = '';
            document.getElementById('statisticsContainer').innerHTML = '';
            
            // Reset counters
            galleryCounter = 0;
            featureCounter = 0;
            techCounter = 0;
            timelineCounter = 0;
            challengeCounter = 0;
            learningCounter = 0;
            statCounter = 0;
            
            // Fill gallery
            if (project.gallery && Array.isArray(project.gallery)) {
                project.gallery.forEach(item => {
                    addGalleryItem(item.image_path, item.title, item.description);
                });
            }
            
            // Fill features
            if (project.features && Array.isArray(project.features)) {
                project.features.forEach(item => {
                    addFeature(item.icon, item.title, item.description);
                });
            }
            
            // Fill tech stack
            if (project.techStack && Array.isArray(project.techStack)) {
                project.techStack.forEach(item => {
                    addTechItem(item.tech_name, item.tech_icon, item.tech_color, item.tech_category);
                });
            }
            
            // Fill timeline
            if (project.timeline && Array.isArray(project.timeline)) {
                project.timeline.forEach(item => {
                    addTimelineItem(item.step_number, item.step_title, item.description);
                });
            }
            
            // Fill challenges
            if (project.challenges && Array.isArray(project.challenges)) {
                project.challenges.forEach(item => {
                    addChallenge(item.icon, item.title, item.description, item.solution);
                });
            }
            
            // Fill learnings
            if (project.learnings && Array.isArray(project.learnings)) {
                project.learnings.forEach(item => {
                    addLearning(item.learning_text);
                });
            }
            
            // Fill statistics
            if (project.statistics && Array.isArray(project.statistics)) {
                project.statistics.forEach(item => {
                    addStatistic(item.stat_title, item.stat_value, item.stat_icon);
                });
            }
            
            showTab('create');
            document.getElementById('formTitle').textContent = 'Edit Project';
            document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Update Project';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } else {
            showToast('Failed to load project data.', 'error');
        }
    } catch (error) {
        showToast('Cannot connect to the live server. Please check your connection.', 'error');
        console.error('Error loading project:', error);
    }
}

// ==================================================
// DELETE PROJECT - ID BASED
// ==================================================

function deleteProject(id) {
    showConfirm(`Are you sure you want to delete this project? This action cannot be undone.`, async () => {
        try {
            const token = getToken();
            if (!token) {
                handleUnauthorized();
                return;
            }
            
            const response = await fetch(`${API_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401 || response.status === 403) {
                handleUnauthorized();
                return;
            }
            
            if (response.ok) {
                showToast('Project deleted successfully!', 'success');
                loadAllProjects();
                loadDashboard();
                loadProjectsSelect();
            } else {
                const data = await response.json();
                showToast(data.error || 'Failed to delete project.', 'error');
            }
        } catch (error) {
            showToast('Cannot connect to the live server. Please check your connection.', 'error');
            console.error('Error deleting project:', error);
        }
    });
}

// ==================================================
// RESET FORM
// ==================================================

function resetForm() {
    document.getElementById('projectForm').reset();
    document.getElementById('formMode').value = 'create';
    document.getElementById('projectSlug').value = '';
    document.getElementById('projectSlugInput').dataset.manual = 'false';
    editingId = null;
    
    document.getElementById('heroImagePreview').innerHTML = '';
    document.getElementById('bannerImagePreview').innerHTML = '';
    document.getElementById('galleryPreview').innerHTML = '';
    
    document.getElementById('galleryContainer').innerHTML = '';
    document.getElementById('featuresContainer').innerHTML = '';
    document.getElementById('techStackContainer').innerHTML = '';
    document.getElementById('timelineContainer').innerHTML = '';
    document.getElementById('challengesContainer').innerHTML = '';
    document.getElementById('learningsContainer').innerHTML = '';
    document.getElementById('statisticsContainer').innerHTML = '';
    
    galleryCounter = 0;
    featureCounter = 0;
    techCounter = 0;
    timelineCounter = 0;
    challengeCounter = 0;
    learningCounter = 0;
    statCounter = 0;
    
    document.getElementById('formTitle').textContent = 'Create New Project';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Save Project';
}

// ==================================================
// TOAST NOTIFICATION
// ==================================================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ==================================================
// CONFIRM DIALOG
// ==================================================

let confirmCallback = null;

function showConfirm(message, callback) {
    const dialog = document.getElementById('confirmDialog');
    const msgEl = document.getElementById('confirmMessage');
    if (!dialog || !msgEl) return;
    
    msgEl.textContent = message;
    dialog.classList.add('active');
    confirmCallback = callback;
}

function closeConfirm() {
    const dialog = document.getElementById('confirmDialog');
    if (dialog) dialog.classList.remove('active');
    confirmCallback = null;
}

const confirmBtn = document.getElementById('confirmBtn');
if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
        }
        closeConfirm();
    });
}

// ==================================================
// KEYBOARD SHORTCUTS
// ==================================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeConfirm();
    }
});

// ==================================================
// INITIALIZE WITH DEMO ITEMS
// ==================================================

document.addEventListener('DOMContentLoaded', function() {
    // Add initial demo items if containers exist and are empty
    if (document.getElementById('featuresContainer') && document.getElementById('featuresContainer').children.length === 0) {
        addFeature('fa-user-lock', 'User Authentication', 'Secure login and registration');
        addFeature('fa-boxes', 'Product Catalog', 'Manage products with categories');
        addFeature('fa-shopping-cart', 'Shopping Cart', 'Add, remove, and checkout');
    }
    
    if (document.getElementById('techStackContainer') && document.getElementById('techStackContainer').children.length === 0) {
        addTechItem('React', 'fab fa-react', '#61dafb', 'Frontend');
        addTechItem('Node.js', 'fab fa-node-js', '#339933', 'Backend');
        addTechItem('MySQL', 'fas fa-database', '#00758f', 'Database');
    }
    
    if (document.getElementById('timelineContainer') && document.getElementById('timelineContainer').children.length === 0) {
        addTimelineItem('1', 'Planning', 'Defined requirements and architecture');
        addTimelineItem('2', 'Development', 'Built the full-stack application');
    }
    
    if (document.getElementById('challengesContainer') && document.getElementById('challengesContainer').children.length === 0) {
        addChallenge('fa-lock', 'Authentication', 'Implementing secure JWT authentication', 'Used bcrypt for password hashing and JWT for tokens');
    }
    
    if (document.getElementById('learningsContainer') && document.getElementById('learningsContainer').children.length === 0) {
        addLearning('MERN stack architecture and best practices');
        addLearning('JWT authentication and security patterns');
    }
    
    if (document.getElementById('statisticsContainer') && document.getElementById('statisticsContainer').children.length === 0) {
        addStatistic('Lines of Code', '8,500+', 'fa-code');
        addStatistic('Pages', '12', 'fa-file');
        addStatistic('Features', '18', 'fa-star');
    }
});

console.log('🚀 Admin Panel loaded successfully! (Production Ready)');
console.log(`📡 API Base URL: ${API_BASE_URL}`);