# MultiVendor Commerce API

A production-ready, scalable backend system for a multi-vendor eCommerce marketplace built with Node.js, Express, and MongoDB.

This API powers a marketplace where multiple vendors operate independently, customers place cross-vendor orders, and administrators manage the entire ecosystem securely.

Designed using MVC architecture with a dedicated service layer, the system focuses on scalability, security, and clean separation of concerns.
---
1️⃣ 🚀 Key Features

- Multi-role authentication (Customer, Seller, Admin, SuperAdmin)
- JWT Access & Refresh Token implementation
- Email verification & secure password reset
- Multi-vendor order splitting (Order → SubOrder architecture)
- Verified purchase review system
- Automatic product rating aggregation (MongoDB aggregation pipeline)
- Role-based access control (RBAC)
- Global and route-specific rate limiting
- Centralized error handling
- Structured logging system for monitoring and debugging
- Production-oriented folder structure
------
 2️⃣  🏗 Architecture Overview
Pattern: MVC (Model-View-Controller) + Service Layer

Route → Controller → Service → Model

    Layers:
1⃣ Routes – API endpoints, apply middleware (auth, validation, rate limiting).
2⃣ Controllers – Handle requests & responses, call service layer, return JSON.
3 Services – Business logic (orders, reviews, AI, calculations).
4⃣ Models – MongoDB schemas (User, Product, Store, Order, SubOrder, Review, etc.).
5⃣ Middleware – Authentication, RBAC, error handling, file upload, rate limiting.

    Key Features:
. Centralized error handling & logging
. JWT access & refresh tokens
. Order splitting per vendor
. Product review system with aggregation
. Embedding vectors stored in Product for future AI search

 3️⃣   Project Structure:
Multi-Vendor-Ecommerce/
├── config/
├── controllers/
├── services/
├── models/
├── routes/
├── middlewares/
├── utils/
├── uploads/
├── app.js
├── server.js
└── README.md

4️⃣  Core Logic & Order Flow:

Users: Customer, Seller, Admin/SuperAdmin
Orders:
  . Customer order → split into SubOrders per store
  . Each SubOrder tracks its own vendorStatus (PENDING → DELIVERED → CANCELLED)
Cart → Checkout → SubOrder:
  . Snapshot of product details stored in sub-orders
  . Totals and shipping per vendor
Reviews:
  . Only customers of delivered sub-orders can review products
  . Admin/SuperAdmin can delete inappropriate reviews
  . Product rating auto-updates with review changes
  
5️⃣ Authentication & Security
. JWT Tokens: Access + Refresh for secure sessions
. Email Verification: Confirm user email on registration
. Password Reset: Secure reset via email link
. Rate Limiting:
     .Global: Protect all APIs from abuse
      .Specific: Login, Register, Refresh token endpoints
. Centralized Error Handling: Detect and handle all API errors
. Logging: Tracks server errors for debugging  
7️⃣ Features & Highlights
User Management: Registration, login, email verification, password reset
Role-Based Access: Customer, Seller, Admin, SuperAdmin
Multi-Vendor Orders: Parent orders and vendor-level suborders
Products & Catalogs: CRUD, stock management, seller-specific products
Cart & Checkout: Add, update, remove items, order processing
Reviews & Ratings: Verified purchase reviews, aggregate product rating
Security:
JWT access + refresh tokens
Global & endpoint-specific rate limiting
Centralized error handling & logging
Future-Ready:
AI tags & embedding for recommendations
Scalable MVC structure

8️⃣ Technology & Run

    Tech Stack:
Node.js + Express.js (MVC)
MongoDB (Mongoose)
JWT (access + refresh)
Multer, Helmet, CORS, rate limiting, centralized error handling & logging
    Setup & Run:
git clone https://github.com/degu-123/MultiVendor-Commerce-API.git
cd MultiVendor-Commerce-API
npm install

    Create .env with:
PORT=3000
MONGO_URI=<your-mongo-uri>
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
EMAIL_USER=<email>
EMAIL_PASS=<password>
SUPER_ADMIN_EMAIL=<super-admin-email>
HF_API_KEY=<create-token-huggface-ai>
   Run server:
npm run dev   # development
npm start     # production

9️⃣ API Endpoints Overview
Base URL: http://localhost:3000/api/v1
Auth: register, login, refresh, logout, verify-email, forgot/reset password
Users: me (get/update profile, change password, upload avatar), admin routes (view/ban/delete/make-admin)
Products & Catalogs: browse products/catalogs, seller creates/updates/deletes products
Cart: view cart, add/update/remove items, checkout
Orders: user orders, seller sub-orders, admin full orders management
Reviews: customer create/update/delete, public view product reviews, admin detailed reviews
🔹 All endpoints are JWT protected where required.
🔹 Pagination used for lists (page & limit query params).
🔹 Role-based access: customer, seller, admin, superAdmin.

    Author
Developed by Degu Kebede
Backend Developer | MERN Stack Enthusiast