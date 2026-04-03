const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { city_id } = req.query;
    
    let query = `
      SELECT 
        d.id, 
        d.city_id, 
        d.name, 
        d.color,
        ST_AsGeoJSON(d.geometry) as geometry,
        d.created_at,
        d.updated_at,
        c.name as city_name
      FROM districts d
      LEFT JOIN cities c ON d.city_id = c.id
    `;
    
    const params = [];
    if (city_id) {
      query += ' WHERE d.city_id = $1';
      params.push(city_id);
    }
    
    query += ' ORDER BY d.name';
    
    const result = await pool.query(query, params);
    
    const districts = result.rows.map(row => ({
      ...row,
      geometry: JSON.parse(row.geometry)
    }));
    
    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении районов' 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        d.id, 
        d.city_id, 
        d.name, 
        d.color,
        ST_AsGeoJSON(d.geometry) as geometry,
        d.created_at,
        d.updated_at,
        c.name as city_name
      FROM districts d
      LEFT JOIN cities c ON d.city_id = c.id
      WHERE d.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Район не найден' 
      });
    }
    
    const district = {
      ...result.rows[0],
      geometry: JSON.parse(result.rows[0].geometry)
    };
    
    res.json({
      success: true,
      data: district
    });
  } catch (error) {
    console.error('Get district error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении района' 
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { city_id, name, color, geometry } = req.body;
    
    if (!city_id || !name || !geometry) {
      return res.status(400).json({ 
        success: false, 
        message: 'city_id, name и geometry обязательны' 
      });
    }
    
    const geoJSON = typeof geometry === 'string' ? geometry : JSON.stringify(geometry);
    
    const result = await pool.query(
      `INSERT INTO districts (city_id, name, color, geometry) 
       VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4)) 
       RETURNING id, city_id, name, color, ST_AsGeoJSON(geometry) as geometry, created_at, updated_at`,
      [city_id, name, color || '#3388ff', geoJSON]
    );
    
    const district = {
      ...result.rows[0],
      geometry: JSON.parse(result.rows[0].geometry)
    };
    
    res.status(201).json({
      success: true,
      message: 'Район успешно создан',
      data: district
    });
  } catch (error) {
    console.error('Create district error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: 'Район с таким именем уже существует в этом городе' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при создании района' 
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, geometry } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (color) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (geometry) {
      const geoJSON = typeof geometry === 'string' ? geometry : JSON.stringify(geometry);
      updates.push(`geometry = ST_GeomFromGeoJSON($${paramCount++})`);
      values.push(geoJSON);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Нет данных для обновления' 
      });
    }
    
    values.push(id);
    
    const result = await pool.query(
      `UPDATE districts 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING id, city_id, name, color, ST_AsGeoJSON(geometry) as geometry, created_at, updated_at`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Район не найден' 
      });
    }
    
    const district = {
      ...result.rows[0],
      geometry: JSON.parse(result.rows[0].geometry)
    };
    
    res.json({
      success: true,
      message: 'Район успешно обновлен',
      data: district
    });
  } catch (error) {
    console.error('Update district error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении района' 
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM districts WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Район не найден' 
      });
    }
    
    res.json({
      success: true,
      message: 'Район успешно удален'
    });
  } catch (error) {
    console.error('Delete district error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении района' 
    });
  }
});

module.exports = router;
