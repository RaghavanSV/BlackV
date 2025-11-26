import {BrowserRouter,Routes,Route} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import Login from "./pages/Login";

function App(){
  return(
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />}/>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/agents" element={<Agents />} />
      <Route path="/agents/:id" element={<AgentDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;

