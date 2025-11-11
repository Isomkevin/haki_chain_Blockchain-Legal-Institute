# 🧩 HakiChain LegalTech Exploratory Django Backend

This repository contains the experimental **Django backend** built for the DoraHacks LegalTech Hackathon — a modular foundation that manages **users**, **cases**, and **document intelligence** within the HakiChain ecosystem.  

This backend serves as the **data and logic layer**, designed for seamless integration with other **AI** and **frontend modules** developed by HakiChain members.

---

## 🚀 Overview

This layer provides:

- 🔐 **Secure user authentication and management**  
- 📁 **Persistent case and document storage**  
- 🔗 **RESTful API endpoints** for integration with FastAPI AI Engine and Next.js frontend  

It is **self-contained and lightweight**, focused purely on **data, logic, and persistence**, while AI orchestration and reasoning occur in the separate **FastAPI agent layer**.

---

## 🎯 Purpose

- Replace external services like Supabase with a self-managed **Django + PostgreSQL backend**  
- Manage all **users**, **cases**, and **documents** centrally  
- Provide a clean **REST API interface** for the HakiChain frontend and FastAPI AI Engine  
- Ensure **data sovereignty**, **auditability**, and **modularity** across the ecosystem  

---

## ⚙️ Apps Overview

| App       | Description |
|-----------|------------|
| `users`    | Handles user registration, authentication (JWT), and profiles |
| `cases`    | Manages legal cases, metadata, and related workflows |
| `documents`| Manages uploads, metadata, and links with PostgreSQL for storage and embedding |

Each app is modular and designed for **clean separation of concerns**, allowing external orchestration by the **FastAPI AI Engine**.

---

## 🧠 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Django + Django REST Framework | Core backend logic and REST API |
| Database  | PostgreSQL | Persistent relational storage |
| Authentication | SimpleJWT | Secure access and refresh token management |
| Storage | Local / Cloud | File-based document management |
| Vector Extension (optional) | pgvector | Enables semantic document retrieval |

---

## 🔌 API Structure

| Module     | Base Endpoint        | Purpose |
|-----------|--------------------|---------|
| Users      | `/api/users/`       | User registration, login, profile management |
| Cases      | `/api/cases/`       | Case creation, listing, and retrieval |
| Documents  | `/api/documents/`   | Upload, list, and manage documents |
| Auth       | `/api/token/`, `/api/token/refresh/` | JWT access and refresh token flow |

---

## 🔑 Authentication Flow

The backend uses **JWT-based authentication** via SimpleJWT:

1. User requests tokens from `/api/token/`  
2. Access token is used for **authenticated endpoints**  
3. Refresh token renews sessions via `/api/token/refresh/`  

This flow ensures **secure interoperability** between the Django backend, FastAPI agent layer, and HakiChain frontend.

---

## 📁 Project Structure

hakichain_backend/
│
├── manage.py
├── hakichain/ # Django project configuration
│ ├── settings.py
│ ├── urls.py
│ ├── wsgi.py
│ └── asgi.py
│
├── users/ # User app
│ ├── models.py
│ ├── views.py
│ ├── serializers.py
│ └── urls.py
│
├── cases/ # Case management app
│ ├── models.py
│ ├── views.py
│ ├── serializers.py
│ └── urls.py
│
├── documents/ # Document management app
│ ├── models.py
│ ├── views.py
│ ├── serializers.py
│ └── urls.py
│
└── requirements.txt

yaml
Copy code

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/hakichain
ALLOWED_HOSTS=localhost,127.0.0.1
🧭 Setup Instructions
bash
Copy code
# 1. Install dependencies
pip install -r requirements.txt

# 2. Apply migrations
python manage.py migrate

# 3. Create admin user
python manage.py createsuperuser

# 4. Run server
python manage.py runserver
🤝 Integration Points
Service	Purpose	Connection
FastAPI AI Engine	AI orchestration, reasoning, document intelligence	Communicates via REST endpoints
Next.js Frontend	User interface and dashboard	Connects directly to Django APIs
PostgreSQL	Centralized data persistence	Managed locally or in the cloud

Django acts as the system of record, ensuring all users, documents, and cases remain consistent across the network.

🛡️ Security Layer
JWT-based Access Control: Fine-grained permissions per user

CORS & CSRF Protection: Configured for authorized frontend access

Data Privacy: Secure document paths and restricted access

Audit Logging: Tracks all modifications to cases and documents

🌐 Vision Alignment
This backend represents the domain precision layer of HakiChain’s legal infrastructure — ensuring structure, integrity, and accountability, while external modules handle intelligence.

Layer	Responsibility
Django	Domain knowledge, persistence, and validation
FastAPI	AI agent orchestration and inference
Vertex AI	High-level reasoning and text generation
PostgreSQL	Memory and embedding storage

🧭 Summary
This LegalTech Exploratory Backend is designed for rapid experimentation and collaborative integration within the HakiChain network:

🔹 Core logic and persistence built on Django

🔹 Fully compatible with FastAPI AI and Next.js frontend

🔹 Ready for extension into production-grade microservices