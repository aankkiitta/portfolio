// ==================================================
// SERVER.JS - PRODUCTION READY
// ==================================================

require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');

const cloudinary = require("./cloudinary");

// ==================================================
// CONFIGURATION
// ==================================================
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    process.exit(1);
}

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ FATAL ERROR: ${envVar} is not defined in environment variables.`);
        process.exit(1);
    }
}

const UPLOAD_DIR = 'uploads';

// Create upload directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ==================================================
// MIDDLEWARE
// ==================================================

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://localhost:5000'
];

// Add production frontend URL from environment
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.warn(`❌ CORS blocked: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with absolute path
app.use('/uploads', express.static(path.join(__dirname, UPLOAD_DIR)));

// ==================================================
// MULTER CONFIGURATION
// ==================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = file.fieldname === 'hero_image' || file.fieldname === 'banner_image' 
            ? `${UPLOAD_DIR}/hero` 
            : `${UPLOAD_DIR}/gallery`;
        
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ==================================================
// DATABASE CONNECTION
// ==================================================
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        console.error('Please check your database credentials in .env');
        process.exit(1);
    });

// ==================================================
// AUTHENTICATION MIDDLEWARE
// ==================================================
const authenticateToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const [users] = await pool.query('SELECT id, username, email FROM admin_users WHERE id = ?', [decoded.userId]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        
        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

// ==================================================
// HEALTH CHECK ROUTE
// ==================================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// ==================================================
// API ROUTES
// ==================================================

// --- LOGIN ---
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required.'
            });
        }

        const [users] = await pool.query(
            'SELECT * FROM admin_users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Invalid username.'
            });
        }

        const user = users[0];

        // Plain text password check (preserving existing logic)
        if (password.trim() !== user.password_hash.trim()) {
            return res.status(401).json({
                error: 'Invalid password.'
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

// --- PROJECTS CRUD ---

// Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const [projects] = await pool.query(`
            SELECT 
                id, project_name, project_slug, category, status, 
                completion_date, role, tagline, github_url, demo_url,
                hero_image, banner_image, overview, problem_statement,
                solution, meta_title, meta_description, meta_keywords,
                prev_project, next_project, created_at, updated_at
            FROM projects 
            ORDER BY created_at DESC
        `);
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects.' });
    }
});

// Get single project by ID
app.get('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [projects] = await pool.query(
            'SELECT * FROM projects WHERE id = ?',
            [id]
        );

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        const project = projects[0];

        const [gallery] = await pool.query(
            'SELECT * FROM project_gallery WHERE project_id = ? ORDER BY display_order',
            [project.id]
        );

        const [features] = await pool.query(
            'SELECT * FROM project_features WHERE project_id = ? ORDER BY display_order',
            [project.id]
        );

        const [techStack] = await pool.query(
            'SELECT * FROM project_tech_stack WHERE project_id = ? ORDER BY display_order',
            [project.id]
        );

        const [timeline] = await pool.query(
            'SELECT * FROM project_timeline WHERE project_id = ? ORDER BY display_order',
            [project.id]
        );

        const [challenges] = await pool.query(
            'SELECT * FROM project_challenges WHERE project_id = ? ORDER BY display_order',
            [project.id]
        );

        const [learnings] = await pool.query(
            'SELECT * FROM project_learnings WHERE project_id = ? ORDER BY display_order',
            [project.id]
        );

        const [statistics] = await pool.query(
            'SELECT * FROM project_statistics WHERE project_id = ? ORDER BY display_order',
            [project.id]
        );

        let prevProject = null;
        let nextProject = null;

        if (project.prev_project) {
            const [prev] = await pool.query(
                'SELECT id, project_name, category FROM projects WHERE id = ?',
                [project.prev_project]
            );
            if (prev.length > 0) {
                prevProject = prev[0];
            }
        }

        if (project.next_project) {
            const [next] = await pool.query(
                'SELECT id, project_name, category FROM projects WHERE id = ?',
                [project.next_project]
            );
            if (next.length > 0) {
                nextProject = next[0];
            }
        }

        res.json({
            id: project.id,
            project_name: project.project_name,
            project_slug: project.project_slug,
            category: project.category,
            status: project.status,
            completion_date: project.completion_date,
            role: project.role,
            tagline: project.tagline,
            github_url: project.github_url,
            demo_url: project.demo_url,
            hero_image: project.hero_image,
            banner_image: project.banner_image,
            overview: project.overview,
            problem_statement: project.problem_statement,
            solution: project.solution,
            meta_title: project.meta_title,
            meta_description: project.meta_description,
            meta_keywords: project.meta_keywords,
            prev_project: project.prev_project,
            next_project: project.next_project,
            gallery,
            features,
            techStack,
            timeline,
            challenges,
            learnings,
            statistics,
            prevProject,
            nextProject
        });

    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project.' });
    }
});

// CREATE PROJECT
app.post('/api/projects', authenticateToken, upload.fields([
    { name: 'hero_image', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 }
]), async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const galleryData = req.body.gallery ? JSON.parse(req.body.gallery) : [];
        const featuresData = req.body.features ? JSON.parse(req.body.features) : [];
        const techStackData = req.body.techStack ? JSON.parse(req.body.techStack) : [];
        const timelineData = req.body.timeline ? JSON.parse(req.body.timeline) : [];
        const challengesData = req.body.challenges ? JSON.parse(req.body.challenges) : [];
        const learningsData = req.body.learnings ? JSON.parse(req.body.learnings) : [];
        const statisticsData = req.body.statistics ? JSON.parse(req.body.statistics) : [];

        const {
            project_name, project_slug, category, status, completion_date,
            role, tagline, github_url, demo_url, overview, problem_statement,
            solution, meta_title, meta_description, meta_keywords,
            prev_project, next_project
        } = req.body;

        if (!project_name || !project_slug || !category) {
            return res.status(400).json({ error: 'Project name, slug, and category are required.' });
        }
        
        const [existing] = await connection.query('SELECT id FROM projects WHERE project_slug = ?', [project_slug]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Project slug already exists. Please use a unique slug.' });
        }
        
        const heroImage = req.body.hero_image || null;
        const bannerImage = req.files?.banner_image ? `/uploads/hero/${req.files.banner_image[0].filename}` : null;
        
        const [result] = await connection.query(
            `INSERT INTO projects (
                project_name, project_slug, category, status, completion_date,
                role, tagline, github_url, demo_url, hero_image, banner_image,
                overview, problem_statement, solution, meta_title, meta_description,
                meta_keywords, prev_project, next_project
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                project_name, project_slug, category, status, completion_date || null,
                role || null, tagline || null, github_url || null, demo_url || null,
                heroImage, bannerImage, overview || null, problem_statement || null,
                solution || null, meta_title || null, meta_description || null,
                meta_keywords || null, prev_project || null, next_project || null
            ]
        );
        
        const projectId = result.insertId;
        
        // Insert related data...
        if (galleryData && galleryData.length > 0) {
            for (const item of galleryData) {
                if (item.image_path) {
                    await connection.query(
                        'INSERT INTO project_gallery (project_id, image_path, title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.image_path, item.title || null, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        if (featuresData && featuresData.length > 0) {
            for (const item of featuresData) {
                if (item.icon && item.title) {
                    await connection.query(
                        'INSERT INTO project_features (project_id, icon, title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.icon, item.title, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        if (techStackData && techStackData.length > 0) {
            for (const item of techStackData) {
                if (item.tech_name && item.tech_icon) {
                    await connection.query(
                        'INSERT INTO project_tech_stack (project_id, tech_name, tech_icon, tech_color, tech_category, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                        [projectId, item.tech_name, item.tech_icon, item.tech_color || '#6C4DFF', item.tech_category || 'Frontend', item.display_order || 0]
                    );
                }
            }
        }
        
        if (timelineData && timelineData.length > 0) {
            for (const item of timelineData) {
                if (item.step_title) {
                    await connection.query(
                        'INSERT INTO project_timeline (project_id, step_number, step_title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.step_number || 0, item.step_title, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        if (challengesData && challengesData.length > 0) {
            for (const item of challengesData) {
                if (item.icon && item.title) {
                    await connection.query(
                        'INSERT INTO project_challenges (project_id, icon, title, description, solution, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                        [projectId, item.icon, item.title, item.description || null, item.solution || null, item.display_order || 0]
                    );
                }
            }
        }
        
        if (learningsData && learningsData.length > 0) {
            for (const item of learningsData) {
                if (item.learning_text) {
                    await connection.query(
                        'INSERT INTO project_learnings (project_id, learning_text, display_order) VALUES (?, ?, ?)',
                        [projectId, item.learning_text, item.display_order || 0]
                    );
                }
            }
        }
        
        if (statisticsData && statisticsData.length > 0) {
            for (const item of statisticsData) {
                if (item.stat_title && item.stat_value) {
                    await connection.query(
                        'INSERT INTO project_statistics (project_id, stat_title, stat_value, stat_icon, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.stat_title, item.stat_value, item.stat_icon || null, item.display_order || 0]
                    );
                }
            }
        }
        
        await connection.commit();
        
        res.status(201).json({
            message: 'Project created successfully!',
            projectId: projectId
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error creating project:', error);
        
        if (NODE_ENV === 'production') {
            res.status(500).json({ error: 'Failed to create project. Please try again later.' });
        } else {
            res.status(500).json({ 
                error: 'Failed to create project: ' + error.message
            });
        }
    } finally {
        connection.release();
    }
});

// UPDATE PROJECT
app.put('/api/projects/:id', authenticateToken, upload.fields([
    { name: 'hero_image', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 }
]), async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        
        const galleryData = req.body.gallery ? JSON.parse(req.body.gallery) : [];
        const featuresData = req.body.features ? JSON.parse(req.body.features) : [];
        const techStackData = req.body.techStack ? JSON.parse(req.body.techStack) : [];
        const timelineData = req.body.timeline ? JSON.parse(req.body.timeline) : [];
        const challengesData = req.body.challenges ? JSON.parse(req.body.challenges) : [];
        const learningsData = req.body.learnings ? JSON.parse(req.body.learnings) : [];
        const statisticsData = req.body.statistics ? JSON.parse(req.body.statistics) : [];

        const {
            project_name, project_slug, category, status, completion_date,
            role, tagline, github_url, demo_url, overview, problem_statement,
            solution, meta_title, meta_description, meta_keywords,
            prev_project, next_project
        } = req.body;
        
        const [existing] = await connection.query('SELECT * FROM projects WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Project not found.' });
        }
        
        const project = existing[0];
        
        // Check if slug exists for other projects
        if (project_slug) {
            const [slugCheck] = await connection.query(
                'SELECT id FROM projects WHERE project_slug = ? AND id != ?',
                [project_slug, id]
            );
            if (slugCheck.length > 0) {
                return res.status(400).json({ error: 'Project slug already exists. Please use a unique slug.' });
            }
        }
        
        const heroImage = req.body.hero_image || project.hero_image;
        const bannerImage = req.files?.banner_image ? `/uploads/hero/${req.files.banner_image[0].filename}` : (req.body.banner_image || project.banner_image);
        
        await connection.query(
            `UPDATE projects SET
                project_name = ?, project_slug = ?, category = ?, status = ?, completion_date = ?,
                role = ?, tagline = ?, github_url = ?, demo_url = ?,
                hero_image = ?, banner_image = ?,
                overview = ?, problem_statement = ?, solution = ?,
                meta_title = ?, meta_description = ?, meta_keywords = ?,
                prev_project = ?, next_project = ?
            WHERE id = ?`,
            [
                project_name, project_slug || project.project_slug, category, status, completion_date || null,
                role || null, tagline || null, github_url || null, demo_url || null,
                heroImage, bannerImage, overview || null, problem_statement || null,
                solution || null, meta_title || null, meta_description || null,
                meta_keywords || null, prev_project || null, next_project || null,
                id
            ]
        );
        
        const projectId = parseInt(id);
        
        // Delete existing relationships
        await connection.query('DELETE FROM project_gallery WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_features WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_tech_stack WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_timeline WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_challenges WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_learnings WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_statistics WHERE project_id = ?', [projectId]);
        
        // Insert updated relationships...
        if (galleryData && galleryData.length > 0) {
            for (const item of galleryData) {
                if (item.image_path) {
                    await connection.query(
                        'INSERT INTO project_gallery (project_id, image_path, title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.image_path, item.title || null, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        if (featuresData && featuresData.length > 0) {
            for (const item of featuresData) {
                if (item.icon && item.title) {
                    await connection.query(
                        'INSERT INTO project_features (project_id, icon, title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.icon, item.title, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        if (techStackData && techStackData.length > 0) {
            for (const item of techStackData) {
                if (item.tech_name && item.tech_icon) {
                    await connection.query(
                        'INSERT INTO project_tech_stack (project_id, tech_name, tech_icon, tech_color, tech_category, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                        [projectId, item.tech_name, item.tech_icon, item.tech_color || '#6C4DFF', item.tech_category || 'Frontend', item.display_order || 0]
                    );
                }
            }
        }
        
        if (timelineData && timelineData.length > 0) {
            for (const item of timelineData) {
                if (item.step_title) {
                    await connection.query(
                        'INSERT INTO project_timeline (project_id, step_number, step_title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.step_number || 0, item.step_title, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        if (challengesData && challengesData.length > 0) {
            for (const item of challengesData) {
                if (item.icon && item.title) {
                    await connection.query(
                        'INSERT INTO project_challenges (project_id, icon, title, description, solution, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                        [projectId, item.icon, item.title, item.description || null, item.solution || null, item.display_order || 0]
                    );
                }
            }
        }
        
        if (learningsData && learningsData.length > 0) {
            for (const item of learningsData) {
                if (item.learning_text) {
                    await connection.query(
                        'INSERT INTO project_learnings (project_id, learning_text, display_order) VALUES (?, ?, ?)',
                        [projectId, item.learning_text, item.display_order || 0]
                    );
                }
            }
        }
        
        if (statisticsData && statisticsData.length > 0) {
            for (const item of statisticsData) {
                if (item.stat_title && item.stat_value) {
                    await connection.query(
                        'INSERT INTO project_statistics (project_id, stat_title, stat_value, stat_icon, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.stat_title, item.stat_value, item.stat_icon || null, item.display_order || 0]
                    );
                }
            }
        }
        
        await connection.commit();
        
        res.json({
            message: 'Project updated successfully!',
            id: id
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error updating project:', error);
        
        if (NODE_ENV === 'production') {
            res.status(500).json({ error: 'Failed to update project. Please try again later.' });
        } else {
            res.status(500).json({ 
                error: 'Failed to update project: ' + error.message
            });
        }
    } finally {
        connection.release();
    }
});

// Delete project by ID
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found.' });
        }
        
        const project = projects[0];
        
        if (project.hero_image && fs.existsSync(`.${project.hero_image}`)) {
            fs.unlinkSync(`.${project.hero_image}`);
        }
        if (project.banner_image && fs.existsSync(`.${project.banner_image}`)) {
            fs.unlinkSync(`.${project.banner_image}`);
        }
        
        const [gallery] = await pool.query('SELECT * FROM project_gallery WHERE project_id = ?', [project.id]);
        for (const item of gallery) {
            if (item.image_path && fs.existsSync(`.${item.image_path}`)) {
                fs.unlinkSync(`.${item.image_path}`);
            }
        }
        
        await pool.query('DELETE FROM projects WHERE id = ?', [id]);
        
        res.json({ message: 'Project deleted successfully!' });
        
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project.' });
    }
});

// Upload gallery images
app.post('/api/upload-gallery', authenticateToken, upload.array('gallery_images', 20), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }
        
        const uploadedFiles = files.map(file => ({
            image_path: `/uploads/gallery/${file.filename}`,
            filename: file.filename
        }));
        
        res.json({
            message: 'Files uploaded successfully!',
            files: uploadedFiles
        });
        
    } catch (error) {
        console.error('Error uploading gallery:', error);
        res.status(500).json({ error: 'Failed to upload gallery images.' });
    }
});

// Delete gallery image
app.delete('/api/delete-gallery-image', authenticateToken, async (req, res) => {
    try {
        const { image_path } = req.body;
        if (!image_path) {
            return res.status(400).json({ error: 'Image path is required.' });
        }
        
        if (fs.existsSync(`.${image_path}`)) {
            fs.unlinkSync(`.${image_path}`);
        }
        
        res.json({ message: 'Image deleted successfully!' });
        
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image.' });
    }
});

// ==================================================
// REVIEWS API ROUTES
// ==================================================

// GET all reviews
app.get("/api/reviews", async (req, res) => {
    try {
        const [reviews] = await pool.query(`
            SELECT * FROM reviews ORDER BY created_at DESC
        `);
        res.json(reviews);
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).json({
            success: false,
            error: "Failed to load reviews"
        });
    }
});

// Review upload middleware
const reviewUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

app.post("/api/reviews", reviewUpload.single("photo"), async (req, res) => {
    try {
        const { name, email, review, rating } = req.body;

        let image_url = null;

        if (req.file) {
            const uploaded = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "portfolio/reviews"
                    },
                    (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
            image_url = uploaded.secure_url;
        }

        await pool.query(
            "INSERT INTO reviews(name, email, review, rating, image_url) VALUES (?, ?, ?, ?, ?)",
            [name, email, review, rating, image_url]
        );

        res.json({
            success: true,
            message: "Review added successfully"
        });
    } catch (err) {
        console.error("Error adding review:", err);
        res.status(500).json({
            success: false,
            error: "Failed to add review"
        });
    }
});

// DELETE review by ID
app.delete("/api/reviews/:id", async (req, res) => {
    try {
        const [review] = await pool.query(
            "SELECT image_url FROM reviews WHERE id = ?",
            [req.params.id]
        );

        if (review.length > 0 && review[0].image_url) {
            const imagePath = `.${review[0].image_url}`;
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await pool.query(
            "DELETE FROM reviews WHERE id = ?",
            [req.params.id]
        );

        res.json({
            success: true,
            message: "Review deleted successfully"
        });

    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).json({
            success: false,
            error: "Delete failed"
        });
    }
});

// ==================================================
// CONTACT API ROUTE
// ==================================================
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        const sql = `
            INSERT INTO contact_messages (name, email, subject, message, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;

        const [result] = await pool.query(sql, [name, email, subject, message]);

        console.log('📧 New contact message saved, ID:', result.insertId);

        res.json({
            success: true,
            message: "Message Sent Successfully"
        });

    } catch (error) {
        console.error('❌ Contact form error:', error);
        res.status(500).json({
            success: false,
            message: "Database Error - Please try again later"
        });
    }
});

// ==================================================
// ERROR HANDLING MIDDLEWARE
// ==================================================
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    
    if (NODE_ENV === 'production') {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } else {
        res.status(500).json({
            success: false,
            message: err.message,
            stack: err.stack
        });
    }
});

// ==================================================
// 404 Handler
// ==================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ==================================================
// SERVER STARTUP
// ==================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Environment: ${NODE_ENV}`);
    console.log(`✅ Health check available at: /api/health`);
});