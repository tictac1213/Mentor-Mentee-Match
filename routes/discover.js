import express from 'express';

import db from '../config/db.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// Get discoverable users
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { role, skills, availability } = req.query;

        // Base query to get all users except current user
        let query = `
            SELECT 
                u.user_id, u.name, u.role, u.title, u.bio,
                GROUP_CONCAT(DISTINCT s.skill_name) AS skills,
                GROUP_CONCAT(DISTINCT i.interest_name) AS interests,
                GROUP_CONCAT(DISTINCT ua.availability) AS availability
            FROM users u
            LEFT JOIN skills s ON u.user_id = s.user_id
            LEFT JOIN interests i ON u.user_id = i.user_id
            LEFT JOIN user_availability ua ON u.user_id = ua.user_id
            WHERE u.user_id != ?
            GROUP BY u.user_id
        `;

        const params = [userId];

        // Add role filter if specified
        if (role && role !== 'all') {
            query += ' HAVING u.role = ? OR u.role = "both"';
            params.push(role);
        }

        // Add skills filter if specified
        if (skills) {
            const skillTerms = skills.toLowerCase().split(',').map(term => term.trim());
            query += ' HAVING (';
            query += skillTerms.map(() => 'skills LIKE ? OR interests LIKE ?').join(' OR ');
            query += ')';
            skillTerms.forEach(term => {
                params.push(`%${term}%`, `%${term}%`);
            });
        }

        // Add availability filter if specified
        if (availability && availability !== 'any') {
            query += ' HAVING availability LIKE ?';
            params.push(`%${availability}%`);
        }

        const [users] = await db.query(query, params);

        // Format the results
        const formattedUsers = users.map(user => ({
            user_id: user.user_id,
            name: user.name,
            role: user.role,
            title: user.title,
            bio: user.bio,
            skills: user.skills ? user.skills.split(',') : [],
            interests: user.interests ? user.interests.split(',') : [],
            availability: user.availability ? user.availability.split(',') : []
        }));

        res.json(formattedUsers);
    } catch (err) {
        console.error('Discover error:', err);
        res.status(500).json({ error: 'Failed to fetch discoverable users' });
    }
});

// Get connection status between users
router.get('/connection-status/:targetUserId', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const targetUserId = req.params.targetUserId;

        // Check if already connected
        const [connections] = await db.query(
            `SELECT * FROM connections 
             WHERE (mentor_id = ? AND mentee_id = ?)
             OR (mentor_id = ? AND mentee_id = ?)`,
            [userId, targetUserId, targetUserId, userId]
        );

        if (connections.length > 0) {
            return res.json({ status: 'connected' });
        }

        // Check if request already sent
        const [sentRequests] = await db.query(
            `SELECT * FROM connection_requests 
             WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'`,
            [userId, targetUserId]
        );

        if (sentRequests.length > 0) {
            return res.json({ status: 'requested' });
        }

        // Check if request received
        const [receivedRequests] = await db.query(
            `SELECT * FROM connection_requests 
             WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'`,
            [targetUserId, userId]
        );

        if (receivedRequests.length > 0) {
            return res.json({ status: 'pending' });
        }

        res.json({ status: 'none' });
    } catch (err) {
        console.error('Connection status error:', err);
        res.status(500).json({ error: 'Failed to check connection status' });
    }
});

// Send connection request
router.post('/connection-request/:targetUserId', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const targetUserId = req.params.targetUserId;

        // Check if already connected or request exists
        const [existing] = await db.query(
            `SELECT * FROM connections 
             WHERE (mentor_id = ? AND mentee_id = ?)
             OR (mentor_id = ? AND mentee_id = ?)`,
            [userId, targetUserId, targetUserId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already connected' });
        }

        const [existingRequests] = await db.query(
            `SELECT * FROM connection_requests 
             WHERE ((sender_id = ? AND receiver_id = ?)
             OR (sender_id = ? AND receiver_id = ?))
             AND status = 'pending'`,
            [userId, targetUserId, targetUserId, userId]
        );

        if (existingRequests.length > 0) {
            return res.status(400).json({ error: 'Request already exists' });
        }

        // Create new request
        await db.query(
            `INSERT INTO connection_requests 
             (sender_id, receiver_id, status) 
             VALUES (?, ?, 'pending')`,
            [userId, targetUserId]
        );

        res.json({ message: 'Connection request sent' });
    } catch (err) {
        console.error('Send request error:', err);
        res.status(500).json({ error: 'Failed to send connection request' });
    }
});

// Accept connection request
router.post('/accept-request/:requestId', authenticate, async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const userId = req.user.user_id;

        // Get the request
        const [requests] = await db.query(
            `SELECT * FROM connection_requests 
             WHERE request_id = ? AND receiver_id = ? AND status = 'pending'`,
            [requestId, userId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = requests[0];

        // Create connection
        await db.query(
            `INSERT INTO connections 
             (mentor_id, mentee_id, request_id) 
             VALUES (?, ?, ?)`,
            [request.sender_id, request.receiver_id, requestId]
        );

        // Update request status
        await db.query(
            `UPDATE connection_requests SET status = 'accepted' 
             WHERE request_id = ?`,
            [requestId]
        );

        res.json({ message: 'Connection established' });
    } catch (err) {
        console.error('Accept request error:', err);
        res.status(500).json({ error: 'Failed to accept connection request' });
    }
});

// Decline connection request
router.post('/decline-request/:requestId', authenticate, async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const userId = req.user.user_id;

        // Update request status
        await db.query(
            `UPDATE connection_requests SET status = 'declined' 
             WHERE request_id = ? AND receiver_id = ?`,
            [requestId, userId]
        );

        res.json({ message: 'Request declined' });
    } catch (err) {
        console.error('Decline request error:', err);
        res.status(500).json({ error: 'Failed to decline connection request' });
    }
});

export default router;