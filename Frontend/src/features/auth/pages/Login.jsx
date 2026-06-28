import {React ,useState} from 'react'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { Link,useNavigate  } from 'react-router'



const Login = () => {
const{loading,handleLogin}=useAuth()
const navigate=useNavigate()
const [error, setError] = useState("")

const [email, setEmail] = useState("")
const [password, setPassword] = useState("")


    const handleSubmit=async(e)=>{
        e.preventDefault()
        setError("")
        const res = await handleLogin({email,password})
        if (res.success) {
            navigate('/')
        } else {
            setError(res.error)
        }

    }

    if(loading){
      return(<main><h1>Loading.......</h1></main>)
    }



  return (
    <main>
      <div className="form-container">
        <h1>Login</h1>
        {error && <p className="error-message" style={{ color: '#ff4d4d', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</p>}

        <form onSubmit={handleSubmit}> 
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input onChange={(e)=>{setEmail(e.target.value)}}
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input onChange={(e)=>{setPassword(e.target.value)}}
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="button primary-button" 
          >
            Log In
          </button>
        </form>
        <p>Don't have an account? <Link to={"/register"}>Register</Link></p>
      </div>
    </main>
  )
}

export default Login