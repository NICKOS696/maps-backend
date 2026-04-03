const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/companies
 * Получить список всех компаний
 */
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, created_at FROM companies ORDER BY name'
        );
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Ошибка при получении компаний:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении компаний'
        });
    }
});

/**
 * GET /api/companies/:id/cities
 * Получить города компании
 */
router.get('/:id/cities', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'SELECT id, name, created_at FROM cities WHERE company_id = $1 ORDER BY name',
            [id]
        );
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Ошибка при получении городов компании:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении городов компании'
        });
    }
});

module.exports = router;
