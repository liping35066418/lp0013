import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Publish from "@/pages/Publish";
import ProductDetail from "@/pages/ProductDetail";
import Favorites from "@/pages/Favorites";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="*" element={
              <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4 text-slate-500">
                <div className="text-6xl">🔍</div>
                <p className="text-lg font-medium">页面走丢了</p>
                <a href="/" className="text-indigo-600 hover:underline text-sm">返回首页 →</a>
              </div>
            } />
          </Routes>
        </main>
        <Toast />
      </div>
    </Router>
  );
}
