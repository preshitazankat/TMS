// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CreateTask from './pages/CreateTask';
import Dashboard from './pages/Dashboard';
import SubmitTask from './pages/SubmitTask';
import EditTask from './pages/EditTask';
import TaskDetail from "./pages/TaskDetail";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/create' element={<CreateTask />} />
        <Route path='/submit/:id' element={<SubmitTask />} />
        <Route path='/edit/:id' element={<EditTask />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
      </Routes>
        <Footer />
    </BrowserRouter>
  );
}

export default App;
