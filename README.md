# 🌐 INVITOR - Event Management System

An advanced, full-stack digital platform designed to streamline event discovery, management, and ticket booking operations. `INVITOR` bridges the gap between organizers and users with an intuitive user interface and a robust backend infrastructure.

---

## 🚀 Key Features

* **Role-Based Dashboards**: Customized interfaces and access controls for Admins and regular Users.
* **Authentication Security**: Secure context-driven user signup, login, and protected routing.
* **Event Booking Lifecycle**: End-to-end flow from browsing event details to processing registration states (Success/Failed).
* **Responsive Architecture**: Styled natively with Tailwind CSS for seamless execution across mobile and desktop displays.
* **API Standardization**: Fully mapped endpoints documented via a centralized Postman collection.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS, Axios, Context API |
| **Backend** | Node.js, Express, JavaScript |
| **API Testing** | Postman |

---

## 📁 Project Structure

```text
INVITOR/
├── frontend/                     # React + Vite application
│   ├── src/
│   │   ├── components/           # Reusable UI components (Navbar, etc.)
│   │   ├── context/              # Global state (AuthContext)
│   │   ├── pages/                # AdminDashboard, UserDashboard, InviteDetail, Login, Register...
│   │   └── utils/                # Axios configurations
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/                      # Server-side application logic
└── Invitor_Postman_collection.json # API endpoints configuration schema
