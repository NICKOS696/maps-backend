const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

/**
 * GET /api/cities
 * Получить список всех городов
 */
router.get('/', async (req, res) => {
    try {
        const { company_id } = req.query;
        
        let query = 'SELECT id, name, company_id, created_at FROM cities';
        let params = [];
        
        if (company_id) {
            query += ' WHERE company_id = $1';
            params.push(company_id);
        }
        
        query += ' ORDER BY name';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Ошибка при получении городов:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении городов'
        });
    }
});

/**
 * POST /api/cities
 * Создать новый город (требует авторизации)
 */
router.post('/', auth, async (req, res) => {
    try {
        const { name, company_id } = req.body;
        
        if (!name || !company_id) {
            return res.status(400).json({
                success: false,
                message: 'Название города и ID компании обязательны'
            });
        }
        
        const result = await pool.query(
            'INSERT INTO cities (name, company_id) VALUES ($1, $2) RETURNING *',
            [name, company_id]
        );
        
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Город успешно создан'
        });
    } catch (error) {
        console.error('Ошибка при создании города:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Город с таким названием уже существует для данной компании'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Ошибка при создании города'
        });
    }
});

/**
 * PUT /api/cities/:id
 * Обновить город (требует авторизации)
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Название города обязательно'
            });
        }
        
        const result = await pool.query(
            'UPDATE cities SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [name, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Город не найден'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Город успешно обновлен'
        });
    } catch (error) {
        console.error('Ошибка при обновлении города:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при обновлении города'
        });
    }
});

/**
 * DELETE /api/cities/:id
 * Удалить город (требует авторизации)
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM cities WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Город не найден'
            });
        }
        
        res.json({
            success: true,
            message: 'Город успешно удален'
        });
    } catch (error) {
        console.error('Ошибка при удалении города:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при удалении города'
        });
    }
});

module.exports = router;
