import express from 'express';

import db from '../config/db.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// Get all connections data
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Get active connections
        const [connections] = await db.query(`
            SELECT 
                c.connection_id,
                c.connected_since,
                c.status,
                u.user_id,
                u.name,
                u.role,
                u.title,
                u.bio
            FROM connections c
            JOIN users u ON (
                (c.mentor_id = ? AND c.mentee_id = u.user_id) OR
                (c.mentee_id = ? AND c.mentor_id = u.user_id)
            )
            WHERE c.status = 'active'
        `, [userId, userId]);

        // Get received requests
        const [receivedRequests] = await db.query(`
            SELECT 
                r.request_id,
                r.created_at,
                u.user_id,
                u.name,
                u.role,
                u.title
            FROM connection_requests r
            JOIN users u ON r.sender_id = u.user_id
            WHERE r.receiver_id = ? AND r.status = 'pending'
        `, [userId]);

        // Get sent requests
        const [sentRequests] = await db.query(`
            SELECT 
                r.request_id,
                r.created_at,
                u.user_id,
                u.name,
                u.role,
                u.title
            FROM connection_requests r
            JOIN users u ON r.receiver_id = u.user_id
            WHERE r.sender_id = ? AND r.status = 'pending'
        `, [userId]);

        res.json({
            connections,
            receivedRequests,
            sentRequests
        });
    } catch (err) {
        console.error('Connections error:', err);
        res.status(500).json({ error: 'Failed to fetch connections data' });
    }
});

// Accept connection request
router.post('/accept/:requestId', authenticate, async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const userId = req.user.user_id;

        // Get the request
        const [requests] = await db.query(`
            SELECT * FROM connection_requests 
            WHERE request_id = ? AND receiver_id = ? AND status = 'pending'
        `, [requestId, userId]);

        if (requests.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = requests[0];

        // Create connection (mentor/mentee relationship)
        await db.query(`
            INSERT INTO connections 
            (mentor_id, mentee_id, request_id, status)
            VALUES (?, ?, ?, 'active')
        `, [request.sender_id, request.receiver_id, requestId]);

        // Update request status
        await db.query(`
            UPDATE connection_requests 
            SET status = 'accepted' 
            WHERE request_id = ?
        `, [requestId]);

        res.json({ message: 'Connection established' });
    } catch (err) {
        console.error('Accept connection error:', err);
        res.status(500).json({ error: 'Failed to accept connection' });
    }
});

// Decline connection request
router.post('/decline/:requestId', authenticate, async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const userId = req.user.user_id;

        // Update request status
        await db.query(`
            UPDATE connection_requests 
            SET status = 'declined' 
            WHERE request_id = ? AND receiver_id = ?
        `, [requestId, userId]);

        res.json({ message: 'Request declined' });
    } catch (err) {
        console.error('Decline connection error:', err);
        res.status(500).json({ error: 'Failed to decline connection' });
    }
});

// Cancel sent request
router.post('/cancel/:requestId', authenticate, async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const userId = req.user.user_id;

        // Delete the request
        await db.query(`
            DELETE FROM connection_requests 
            WHERE request_id = ? AND sender_id = ?
        `, [requestId, userId]);

        res.json({ message: 'Request cancelled' });
    } catch (err) {
        console.error('Cancel request error:', err);
        res.status(500).json({ error: 'Failed to cancel request' });
    }
});

// Disconnect from user
router.post('/disconnect/:userId', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const targetUserId = req.params.userId;

        // Delete the connection
        await db.query(`
            DELETE FROM connections 
            WHERE (
                (mentor_id = ? AND mentee_id = ?) OR
                (mentor_id = ? AND mentee_id = ?)
            ) AND status = 'active'
        `, [userId, targetUserId, targetUserId, userId]);

        res.json({ message: 'Disconnected successfully' });
    } catch (err) {
        console.error('Disconnect error:', err);
        res.status(500).json({ error: 'Failed to disconnect' });
    }
});

export default router;