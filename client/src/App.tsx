import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DogProfile from './pages/DogProfile'
import CreateDog from './pages/CreateDog'
import EditDog from './pages/EditDog'
import PedigreeViewer from './pages/PedigreeViewer'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dogs/new" element={<CreateDog />} />
        <Route path="/dogs/:id" element={<DogProfile />} />
        <Route path="/dogs/:id/edit" element={<EditDog />} />
        <Route path="/pedigree/:id" element={<PedigreeViewer />} />
      </Routes>
    </Layout>
  )
}

export default App
