import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import InviteDetail from './pages/InviteDetail';
import Login from './pages/Login'; 
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import EventHub from './pages/EventHub';
import CheckInStation from './pages/CheckInStation';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import BackgroundLayer from './components/BackgroundLayer';
import ThemeCustomizerModal from './components/ThemeCustomizerModal';
import FloatingThemeButton from './components/FloatingThemeButton';

function App() {
    return (
        <Router>
            <div className="min-h-screen flex flex-col relative text-white bg-transparent">
                {/* Dynamic Global Background (Video / Image / Gradient) */}
                <BackgroundLayer />

                {/* Navigation Bar */}
                <Navbar />

                {/* Main Content Area */}
                <main className="flex-grow relative z-10">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/invites/:id" element={<InviteDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<UserDashboard />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/events/:id/hub" element={<EventHub />} />
                        <Route path="/admin/checkin" element={<CheckInStation />} />
                        <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/payment-failed" element={<PaymentFailed />} />
                        <Route path="*" element={<h1 className="text-3xl font-bold text-center mt-20 text-white">404 - Page Not Found</h1>} />
                    </Routes>
                </main>

                {/* Floating Theme / Video BG Launcher Button */}
                <FloatingThemeButton />

                {/* Full Live Theme & Video Background Customizer Modal */}
                <ThemeCustomizerModal />
            </div>
        </Router>
    );
}

export default App;