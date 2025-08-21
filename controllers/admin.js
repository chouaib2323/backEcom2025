
const express = require('express');
const db = require('../config/db')
const bcrypt = require("bcryptjs");
const multer = require('multer');
const path = require('path');


exports.adminLogin= async(req,res)=>{
    try{
        const {email,password} =req.body
        const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

if (user.length === 0 && user[0].role=="user") {
  return res.status(400).json({ message: "User not found" });
}

const valid = await bcrypt.compare(password, user[0].password);

if (!valid) {
  return res.status(400).json({ message: "Incorrect email or password" });
}


const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: user[0].id, role: user[0].role || 'user' },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
);

res.json({ message: "Login successful", token });

 
    } catch (error){
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error", error });
    }
}




exports.adminAddProduct = async (req, res) => {
  const { name, description, price, category_id, colors, variants } = req.body;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Insert product
    const [productResult] = await connection.query(
      `INSERT INTO products (name, description, price, category_id) VALUES (?, ?, ?, ?)`,
      [name, description, price, category_id]
    );
    const productId = productResult.insertId;

    // Insert colors
    const parsedColors = JSON.parse(colors || '[]');
    for (const color of parsedColors) {
      await connection.query(
        `INSERT INTO product_colors (product_id, color) VALUES (?, ?)`,
        [productId, color]
      );
    }

    // Insert variants
    const parsedVariants = JSON.parse(variants || '[]');
    for (const variant of parsedVariants) {
      await connection.query(
        `INSERT INTO product_variants (product_id, size, color, stock_quantity, sku) VALUES (?, ?, ?, ?, ?)`,
        [productId, variant.size, variant.color, variant.stock_quantity, variant.sku]
      );
    }

    // Insert photos
    for (let i = 0; i < req.files.length; i++) {
      await connection.query(
        `INSERT INTO product_photos (product_id, image_url, is_main) VALUES (?, ?, ?)`,
        [productId, req.files[i].filename, i === 0 ? 1 : 0]
      );
    }

    await connection.commit();
    res.status(200).json({ message: '✅ Product created successfully!' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(error);
    res.status(500).json({ error: '❌ Failed to create product.' });
  } finally {
    if (connection) connection.release();
  }
};

exports.AddCategory = async (req, res) => {
  try {
    const { category, parent_id } = req.body;

    if (!category) return res.status(400).json({ error: 'Category name is required' });

    await db.query('INSERT INTO categories(name, parent_id) VALUES (?, ?)', [category, parent_id || null]);

    res.json({ message: 'Category added' });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.GetCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.DeleteAproduct = async (req, res) => {
  const { id } = req.params; 

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Delete photos
    await connection.query(`DELETE FROM product_photos WHERE product_id = ?`, [id]);

    // Delete colors
    await connection.query(`DELETE FROM product_colors WHERE product_id = ?`, [id]);

    // Delete variants
    await connection.query(`DELETE FROM product_variants WHERE product_id = ?`, [id]);

    // Finally delete product
    const [result] = await connection.query(`DELETE FROM products WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    await connection.commit();
    res.json({ message: ' Product deleted successfully!' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting product:', error);
    res.status(500).json({ error: ' Failed to delete product.' });
  } finally {
    if (connection) connection.release();
  }
};


