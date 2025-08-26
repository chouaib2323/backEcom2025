const db = require('../config/db')
const bcrypt = require("bcryptjs");
 const express = require('express');

exports.userRegister = async (req,res)=>{
    try{
    const {first_name,last_name,email,password,phone_number,address,city,postal_code,country} = req.body
    const hashed_pass = await bcrypt.hash(password, 10);
const [check]= await db.query('SELECT id FROM users WHERE email=?',email)

if (check.length>0){
    console.log("User already registered:", email);
          return res.status(400).json({ message: "User already registered" });
}

await db.query(
    "INSERT INTO users (first_name,last_name,email,password,phone_number,address,city,postal_code,country) VALUES (?, ?, ?, ?, ?,?,?,?,?)",
    [first_name,last_name,email,hashed_pass,phone_number,address,city,postal_code,country]
);

console.log("User registered:", email);
res.status(201).json({ message: "User registered successfully" });
}catch (error){
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error", error });
}
    }
exports.userLogin = async(req,res)=>{

    try{
        const {email,password} =req.body
        const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

if (user.length === 0) {
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



exports.GetProducts = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                p.id,
                p.name,
                p.description,
                p.price,
                p.category_id,
                GROUP_CONCAT(DISTINCT pp.image_url) AS images,
                GROUP_CONCAT(DISTINCT CONCAT(pv.id, ':', pv.sku, ':', pv.stock_quantity )) AS variants,
                GROUP_CONCAT(DISTINCT pc.color) AS colors
            FROM products p
            LEFT JOIN product_photos pp ON p.id = pp.product_id
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            GROUP BY p.id
        `);

        const products = rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            category_id: row.category_id,
            images: row.images ? row.images.split(',') : [],
            variants: row.variants
                ? row.variants.split(',').map(v => {
                    const [id, sku, qty ] = v.split(':');
                    return { id, sku, stock_quantity: qty  };
                })
                : [],
            colors: row.colors ? row.colors.split(',') : []
        }));

        res.status(200).json(products);
    } catch (error) {
        console.error("GetProducts Error:", error);
        res.status(500).json({ message: "Server error", error });
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

  exports.GetProduct = async (req, res) => {
    try {
      const { id } = req.params;   // ✅ correct way to get product id
      const [rows] = await db.query(
        `
        SELECT 
            p.id,
            p.name,
            p.description,
            p.price,
            p.category_id,
            GROUP_CONCAT(DISTINCT pp.image_url) AS images,
            GROUP_CONCAT(DISTINCT CONCAT(pv.id, ':', pv.sku, ':', pv.stock_quantity )) AS variants,
            GROUP_CONCAT(DISTINCT pc.color) AS colors
        FROM products p
        LEFT JOIN product_photos pp ON p.id = pp.product_id
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        LEFT JOIN product_colors pc ON p.id = pc.product_id
        WHERE p.id = ?
        GROUP BY p.id
        `,
        [id]   // ✅ pass id safely
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      const product = {
        id: rows[0].id,
        name: rows[0].name,
        description: rows[0].description,
        price: rows[0].price,
        category_id: rows[0].category_id,
        images: rows[0].images ? rows[0].images.split(",") : [],
        variants: rows[0].variants
          ? rows[0].variants.split(",").map((v) => {
              const [id, sku, qty] = v.split(":");
              return { id, sku, stock_quantity: qty };
            })
          : [],
        colors: rows[0].colors ? rows[0].colors.split(",") : [],
      };
  
      res.status(200).json(product); // return single product, not array
    } catch (error) {
      console.error("GetProduct Error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };
  
