// ==================================================
// SERVER.JS - MAIN BACKEND FILE (ID-BASED ROUTING)
// ==================================================

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

//

const cloudinary = require("./cloudinary");




// ==================================================
// CONFIGURATION
// ==================================================
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-super-secret-jwt-key-change-this';
const UPLOAD_DIR = 'uploads';

// Create upload directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// ==================================================
// MIDDLEWARE
// ==================================================
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost:3000'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
});

// ==================================================
// DATABASE CONNECTION
// ==================================================
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'portfolio_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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
// API ROUTES
// ==================================================
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log("=================================");
        console.log("Entered Username :", username);
        console.log("Entered Password :", password);

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required.'
            });
        }

        const [users] = await pool.query(
            'SELECT * FROM admin_users WHERE username = ?',
            [username]
        );

        console.log("Users Found :", users.length);

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Invalid username.'
            });
        }

        const user = users[0];

        console.log("Database Username :", user.username);
        console.log("Database Password :", "[" + user.password_hash + "]");

        // Plain text password check
        if (password.trim() !== user.password_hash.trim()) {
            console.log("❌ PASSWORD NOT MATCHED");
            console.log("Entered :", "[" + password.trim() + "]");
            console.log("Database:", "[" + user.password_hash.trim() + "]");

            return res.status(401).json({
                error: 'Invalid password.'
            });
        }

        console.log("✅ PASSWORD MATCHED");

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
// --- PROJECTS CRUD (ID-BASED) ---

// Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const [projects] = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
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

        // Get previous and next projects
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
// ==================================================
// CREATE PROJECT - FIXED
// ==================================================
app.post('/api/projects', authenticateToken, upload.fields([
    { name: 'hero_image', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 }
]), async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Parse JSON data from FormData
        const galleryData = req.body.gallery ? JSON.parse(req.body.gallery) : [];
        const featuresData = req.body.features ? JSON.parse(req.body.features) : [];
        const techStackData = req.body.techStack ? JSON.parse(req.body.techStack) : [];
        const timelineData = req.body.timeline ? JSON.parse(req.body.timeline) : [];
        const challengesData = req.body.challenges ? JSON.parse(req.body.challenges) : [];
        const learningsData = req.body.learnings ? JSON.parse(req.body.learnings) : [];
        const statisticsData = req.body.statistics ? JSON.parse(req.body.statistics) : [];

        console.log("📝 CREATE PROJECT - Received Data:");
        console.log("Gallery items:", galleryData.length);
        console.log("Features items:", featuresData.length);
        console.log("Tech Stack items:", techStackData.length);
        console.log("Timeline items:", timelineData.length);
        console.log("Challenges items:", challengesData.length);
        console.log("Learnings items:", learningsData.length);
        console.log("Statistics items:", statisticsData.length);

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
        console.log(`✅ Project created with ID: ${projectId}`);
        
        // Insert gallery
        if (galleryData && galleryData.length > 0) {
            console.log(`📸 Inserting ${galleryData.length} gallery items...`);
            for (const item of galleryData) {
                if (item.image_path) {
                    await connection.query(
                        'INSERT INTO project_gallery (project_id, image_path, title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.image_path, item.title || null, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert features
        if (featuresData && featuresData.length > 0) {
            console.log(`⭐ Inserting ${featuresData.length} features...`);
            for (const item of featuresData) {
                if (item.icon && item.title) {
                    await connection.query(
                        'INSERT INTO project_features (project_id, icon, title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.icon, item.title, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert tech stack - FIXED: using techStackData instead of techStack
        if (techStackData && techStackData.length > 0) {
            console.log(`💻 Inserting ${techStackData.length} tech stack items...`);
            for (const item of techStackData) {
                if (item.tech_name && item.tech_icon) {
                    await connection.query(
                        'INSERT INTO project_tech_stack (project_id, tech_name, tech_icon, tech_color, tech_category, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                        [projectId, item.tech_name, item.tech_icon, item.tech_color || '#6C4DFF', item.tech_category || 'Frontend', item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert timeline - FIXED: using timelineData instead of timeline
        if (timelineData && timelineData.length > 0) {
            console.log(`⏱️ Inserting ${timelineData.length} timeline items...`);
            for (const item of timelineData) {
                if (item.step_title) {
                    await connection.query(
                        'INSERT INTO project_timeline (project_id, step_number, step_title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.step_number || 0, item.step_title, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert challenges - FIXED: using challengesData instead of challenges
        if (challengesData && challengesData.length > 0) {
            console.log(`⚡ Inserting ${challengesData.length} challenges...`);
            for (const item of challengesData) {
                if (item.icon && item.title) {
                    await connection.query(
                        'INSERT INTO project_challenges (project_id, icon, title, description, solution, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                        [projectId, item.icon, item.title, item.description || null, item.solution || null, item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert learnings - FIXED: using learningsData instead of learnings
        if (learningsData && learningsData.length > 0) {
            console.log(`🎓 Inserting ${learningsData.length} learnings...`);
            for (const item of learningsData) {
                if (item.learning_text) {
                    await connection.query(
                        'INSERT INTO project_learnings (project_id, learning_text, display_order) VALUES (?, ?, ?)',
                        [projectId, item.learning_text, item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert statistics - FIXED: using statisticsData instead of statistics
        if (statisticsData && statisticsData.length > 0) {
            console.log(`📊 Inserting ${statisticsData.length} statistics...`);
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
        console.log(`✅ Project ${projectId} created successfully with all related data!`);
        
        res.status(201).json({
            message: 'Project created successfully!',
            projectId: projectId
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error creating project:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to create project: ' + error.message,
            details: error.stack 
        });
    } finally {
        connection.release();
    }
});

// ==================================================
// UPDATE PROJECT - FIXED
// ==================================================
app.put('/api/projects/:id', authenticateToken, upload.fields([
    { name: 'hero_image', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 }
]), async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        
        // Parse JSON data from FormData - FIXED: added this section
        const galleryData = req.body.gallery ? JSON.parse(req.body.gallery) : [];
        const featuresData = req.body.features ? JSON.parse(req.body.features) : [];
        const techStackData = req.body.techStack ? JSON.parse(req.body.techStack) : [];
        const timelineData = req.body.timeline ? JSON.parse(req.body.timeline) : [];
        const challengesData = req.body.challenges ? JSON.parse(req.body.challenges) : [];
        const learningsData = req.body.learnings ? JSON.parse(req.body.learnings) : [];
        const statisticsData = req.body.statistics ? JSON.parse(req.body.statistics) : [];

        console.log(`📝 UPDATE PROJECT ID: ${id}`);
        console.log("Gallery items:", galleryData.length);
        console.log("Features items:", featuresData.length);
        console.log("Tech Stack items:", techStackData.length);
        console.log("Timeline items:", timelineData.length);
        console.log("Challenges items:", challengesData.length);
        console.log("Learnings items:", learningsData.length);
        console.log("Statistics items:", statisticsData.length);

        const {
            project_name, category, status, completion_date,
            role, tagline, github_url, demo_url, overview, problem_statement,
            solution, meta_title, meta_description, meta_keywords,
            prev_project, next_project
        } = req.body;
        
        const [existing] = await connection.query('SELECT * FROM projects WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Project not found.' });
        }
        
        const project = existing[0];
        
 const heroImage = req.body.hero_image || project.hero_image;
const bannerImage = req.body.banner_image || project.banner_image;
        
        await connection.query(
            `UPDATE projects SET
                project_name = ?, category = ?, status = ?, completion_date = ?,
                role = ?, tagline = ?, github_url = ?, demo_url = ?,
                hero_image = ?, banner_image = ?,
                overview = ?, problem_statement = ?, solution = ?,
                meta_title = ?, meta_description = ?, meta_keywords = ?,
                prev_project = ?, next_project = ?
            WHERE id = ?`,
            [
                project_name, category, status, completion_date || null,
                role || null, tagline || null, github_url || null, demo_url || null,
                heroImage, bannerImage, overview || null, problem_statement || null,
                solution || null, meta_title || null, meta_description || null,
                meta_keywords || null, prev_project || null, next_project || null,
                id
            ]
        );
        
        const projectId = parseInt(id);
        console.log(`✅ Project ${projectId} updated, now updating related data...`);
        
        // Delete existing relationships
        await connection.query('DELETE FROM project_gallery WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_features WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_tech_stack WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_timeline WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_challenges WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_learnings WHERE project_id = ?', [projectId]);
        await connection.query('DELETE FROM project_statistics WHERE project_id = ?', [projectId]);
        
        console.log('🗑️ Deleted existing relationships');
        
        // Insert gallery
        if (galleryData && galleryData.length > 0) {
            console.log(`📸 Inserting ${galleryData.length} gallery items...`);
            for (const item of galleryData) {
                if (item.image_path) {
                    await connection.query(
                        'INSERT INTO project_gallery (project_id, image_path, title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.image_path, item.title || null, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert features
        if (featuresData && featuresData.length > 0) {
            console.log(`⭐ Inserting ${featuresData.length} features...`);
            for (const item of featuresData) {
                if (item.icon && item.title) {
                    await connection.query(
                        'INSERT INTO project_features (project_id, icon, title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.icon, item.title, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert tech stack
        if (techStackData && techStackData.length > 0) {
            console.log(`💻 Inserting ${techStackData.length} tech stack items...`);
            for (const item of techStackData) {
                if (item.tech_name && item.tech_icon) {
                    await connection.query(
                        'INSERT INTO project_tech_stack (project_id, tech_name, tech_icon, tech_color, tech_category, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                        [projectId, item.tech_name, item.tech_icon, item.tech_color || '#6C4DFF', item.tech_category || 'Frontend', item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert timeline
        if (timelineData && timelineData.length > 0) {
            console.log(`⏱️ Inserting ${timelineData.length} timeline items...`);
            for (const item of timelineData) {
                if (item.step_title) {
                    await connection.query(
                        'INSERT INTO project_timeline (project_id, step_number, step_title, description, display_order) VALUES (?, ?, ?, ?, ?)',
                        [projectId, item.step_number || 0, item.step_title, item.description || null, item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert challenges
        if (challengesData && challengesData.length > 0) {
            console.log(`⚡ Inserting ${challengesData.length} challenges...`);
            for (const item of challengesData) {
                if (item.icon && item.title) {
                    await connection.query(
                        'INSERT INTO project_challenges (project_id, icon, title, description, solution, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                        [projectId, item.icon, item.title, item.description || null, item.solution || null, item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert learnings
        if (learningsData && learningsData.length > 0) {
            console.log(`🎓 Inserting ${learningsData.length} learnings...`);
            for (const item of learningsData) {
                if (item.learning_text) {
                    await connection.query(
                        'INSERT INTO project_learnings (project_id, learning_text, display_order) VALUES (?, ?, ?)',
                        [projectId, item.learning_text, item.display_order || 0]
                    );
                }
            }
        }
        
        // Insert statistics
        if (statisticsData && statisticsData.length > 0) {
            console.log(`📊 Inserting ${statisticsData.length} statistics...`);
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
        console.log(`✅ Project ${projectId} updated successfully with all related data!`);
        
        res.json({
            message: 'Project updated successfully!',
            id: id
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error updating project:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to update project: ' + error.message,
            details: error.stack 
        });
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
        "INSERT INTO reviews(name,email,review,rating,image_url) VALUES (?,?,?,?,?)",
        [name, email, review, rating, image_url]
    );

    res.json({
        success: true
    });

});
// DELETE review by ID
app.delete("/api/reviews/:id", async (req, res) => {
    try {
        // Get image path first to delete file
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
// CONTACT API ROUTE - FIXED
// ==================================================
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Insert into database using pool (not db)
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
// SERVER STARTUP
// ==================================================
app.listen(PORT, () => {
    console.log(`🚀 Admin Panel API running on http://localhost:${PORT}`);
    console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
});