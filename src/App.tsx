import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import PWMCalculator from "./pages/pwm_calculator";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<PWMCalculator />} path="/pwm-calculator" />
    </Routes>
  );
}

export default App;
