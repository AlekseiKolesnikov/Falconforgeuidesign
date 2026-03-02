<<<<<<< HEAD
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
=======
import { RouterProvider } from "react-router";
import { router } from "@/app/routes";

export default function App() {
  return <RouterProvider router={router} />;
}
>>>>>>> 50b47b722d18b16772fafd529511832abd031c28
