import { useState, useEffect } from 'react'
import Editor from "react-simple-code-editor"
import hljs from "highlight.js"
import "highlight.js/styles/github-dark.css"
import Markdown from "react-markdown"
import axios from 'axios'
import './App.css'

function App() {
  const [code, setCode] = useState(`function sum() {
  return 1 + 1
}`)
  const [review, setReview] = useState(``)

  useEffect(() => {
    hljs.highlightAll() 
  }, [review]) // only when review updates

  async function reviewCode() {
    const response = await axios.post('http://localhost:3000/ai/get-review', { code })
    setReview(response.data)
  }// send request to backend

  return (
    <>
      <main>
        <div className="left">
          <div className="code">
            <Editor
              value={code}
              onValueChange={code => setCode(code)}
              highlight={code => hljs.highlightAuto(code).value} //use highlight.js
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 16,
                border: "1px solid #ddd",
                borderRadius: "5px",
                height: "100%",
                width: "100%"
              }}
            />
          </div>
          <div
            onClick={reviewCode}
            className="review"
            style={{
              marginTop: "1rem",
              background: "#444",
              color: "white",
              padding: "10px",
              borderRadius: "5px",
              cursor: "pointer",
              textAlign: "center",
              width: "fit-content"
            }}
          >
            Review
          </div>
        </div>
        <div className="right">
          <Markdown>
            {review}
          </Markdown>
        </div>
      </main>
    </>
  )
}

export default App
