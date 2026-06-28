import {React,useState} from 'react'
import { Navigate, useNavigate ,Link} from 'react-router'
import { useAuth } from '../hooks/useAuth'

const Register = () => {

    const naviagte=useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")


    const{loading,handleRegister}=useAuth()


    const handleSubmit=async(e)=>{
        e.preventDefault()
        await handleRegister({username,email,password})
        navigate("/")
    }

  return (
    <main>
  <div className="form-container">
    <h1>Register</h1>

    <form onSubmit={handleSubmit}>
      <div className="input-group">
        <label htmlFor="username">Username</label>
        <input
        onChange={(e)=>{setUsername(e.target.value)}}
          type="text"
          id="username"
          name="username"
          placeholder="Enter your username"
        />
      </div>

      <div className="input-group">
        <label htmlFor="email">Email</label>
        <input
        onChange={(e)=>{setEmail(e.target.value)}}
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
        />
      </div>

      <div className="input-group">
        <label htmlFor="password">Password</label>
        <input
        onChange={(e)=>{setPassword(e.target.value)}}
          type="password"
          id="password"
          name="password"
          placeholder="Enter your password"
        />
      </div>

      <div className="input-group">
        <label htmlFor="confirmPassword">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Confirm your password"
        />
      </div>

      <button
        type="submit"
        className="button primary-button"
      >
        Register
      </button>
    </form>
    <p>Already have an account? <Link to={"/login"}>Login</Link></p>
  </div>
</main>
  )
}

export default Register
