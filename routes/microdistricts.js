const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { district_id } = req.query;
    
    let query = `
      SELECT 
        m.id, 
        m.district_id, 
        m.name, 
        m.color,
        ST_AsGeoJSON(m.geometry) as geometry,
        m.created_at,
        m.updated_at,
        d.name as district_name
      FROM microdistricts m
      LEFT JOIN districts d ON m.district_id = d.id
    `;
    
    const params = [];
    if (district_id) {
      query += ' WHERE m.district_id = $1';
      params.push(district_id);
    }
    
    query += ' ORDER BY m.name';
    
    const result = await pool.query(query, params);
    
    const microdistricts = result.rows.map(row => ({
      ...row,
      geometry: JSON.parse(row.geometry)
    }));
    
    res.json({
      success: true,
      data: microdistricts
    });
  } catch (error) {
    console.error('Get microdistricts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении микрорайонов' 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        m.id, 
        m.district_id, 
        m.name, 
        m.color,
        ST_AsGeoJSON(m.geometry) as geometry,
        m.created_at,
        m.updated_at,
        d.name as district_name
      FROM microdistricts m
      LEFT JOIN districts d ON m.district_id = d.id
      WHERE m.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Микрорайон не найден' 
      });
    }
    
    const microdistrict = {
      ...result.rows[0],
      geometry: JSON.parse(result.rows[0].geometry)
    };
    
    res.json({
      success: true,
      data: microdistrict
    });
  } catch (error) {
    console.error('Get microdistrict error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении микрорайона' 
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { district_id, name, color, geometry } = req.body;
    
    if (!district_id || !name || !geometry) {
      return res.status(400).json({ 
        success: false, 
        message: 'district_id, name и geometry обязательны' 
      });
    }
    
    const geoJSON = typeof geometry === 'string' ? geometry : JSON.stringify(geometry);
    
    const result = await pool.query(
      `INSERT INTO microdistricts (district_id, name, color, geometry) 
       VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4)) 
       RETURNING id, district_id, name, color, ST_AsGeoJSON(geometry) as geometry, created_at, updated_at`,
      [district_id, name, color || '#ff7800', geoJSON]
    );
    
    const microdistrict = {
      ...result.rows[0],
      geometry: JSON.parse(result.rows[0].geometry)
    };
    
    res.status(201).json({
      success: true,
      message: 'Микрорайон успешно создан',
      data: microdistrict
    });
  } catch (error) {
    console.error('Create microdistrict error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: 'Микрорайон с таким именем уже существует в этом районе' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при создании микрорайона' 
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
      `UPDATE microdistricts 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING id, district_id, name, color, ST_AsGeoJSON(geometry) as geometry, created_at, updated_at`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Микрорайон не найден' 
      });
    }
    
    const microdistrict = {
      ...result.rows[0],
      geometry: JSON.parse(result.rows[0].geometry)
    };
    
    res.json({
      success: true,
      message: 'Микрорайон успешно обновлен',
      data: microdistrict
    });
  } catch (error) {
    console.error('Update microdistrict error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении микрорайона' 
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM microdistricts WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Микрорайон не найден' 
      });
    }
    
    res.json({
      success: true,
      message: 'Микрорайон успешно удален'
    });
  } catch (error) {
    console.error('Delete microdistrict error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении микрорайона' 
    });
  }
});

module.exports = router;
