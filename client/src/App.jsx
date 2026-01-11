import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import Layout from './components/templates/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import UserManagement from './pages/UserManagement';
import StorageManagement from './pages/StorageManagement';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateTask from './pages/CreateTask';
import TaskDetail from './pages/TaskDetail';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <ChatProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Protected Routes */}
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={<Navigate to="/" replace />} />
                  <Route path="/projects/:id" element={<ProjectView />} />
                  <Route path="/projects/:id/create-task" element={<CreateTask />} />
                  <Route path="/projects/:id/tasks/:taskId" element={<TaskDetail />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/storage" element={<StorageManagement />} />
                  <Route path="/chat" element={<ChatPage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </ChatProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
