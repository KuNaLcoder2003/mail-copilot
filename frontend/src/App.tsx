import { Route, Routes } from "react-router-dom"
import Home from "./components/Home"
import SignIn from "./components/Signin"


function App() {


  return (
    <>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<SignIn />} />
      </Routes>
    </>
  )
}

export default App
