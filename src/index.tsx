import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { DataGrid } from './components';
import reportWebVitals from './reportWebVitals';

const win : { [key: string] : any } = (window as { [key: string]: any });

ReactDOM.render(
  <React.StrictMode>
    <DataGrid getSelectedItemIDsCallback={win['_getSelectedItemKeysCallback']} />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
