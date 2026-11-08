import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    fetch('/api/hello')
      .then(response => {
        if (!response.ok) {
          throw new Error('API Error')
        }
        return response.text()
      })
      .then(data => setMessage(data))
      .catch(() => setMessage('Connection Failed!'))
  }, [])

  return (
    <div>
      <h1>React + Spring Boot</h1>
      <h2>{message}</h2>
    </div>
  )
}

export default App