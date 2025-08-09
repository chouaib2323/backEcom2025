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



