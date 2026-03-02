import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from '../app/pages/Landing';
import Login from '../app/pages/Login';  // Your Supabase login

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;