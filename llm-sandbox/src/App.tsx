import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import DItemsList from './components/DItemsList';



function App() {
  const [inputValue, setInputValue] = useState('');
  const [submittedValue, setSubmittedValue] = useState('');
  const [loading, setLoading] = useState(false);

  const client = new OpenAI({
    baseURL: "http://localhost:1234/v1",
    apiKey: "lm-studio",
    dangerouslyAllowBrowser: true
  });

  async function getCompletion() {

    setLoading(true)
    setSubmittedValue('');
    try {
      const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: inputValue }
        ],
        temperature: 0.7,
      });
      console.log(completion.choices[0].message.content);

      let chatReturn = completion.choices[0].message.content;

      setSubmittedValue(chatReturn ?? 'error');
    } catch (err) {
      console.error(err);
      setSubmittedValue('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className='container'>
        <div className='row mt-5 pt-5'>
          <div className='col text-center'>
            {/* <DItemsList></DItemsList> */}
            <a href="https://vite.dev" target="_blank">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
        </div>
        <div className='row w-100'>
          <div className='col'>
            <div className="input-group mt-5">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="form-control"></input>
              <button className="btn btn-outline-secondary" type="button" id="button-addon2" onClick={getCompletion}>submit</button>
            </div>
          </div>
          <div className='row mt-5 pt-5'>
            <div className='col text-center'>
              {loading ? (
                <div className="d-flex justify-content-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <ReactMarkdown>{submittedValue}</ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

export default App
