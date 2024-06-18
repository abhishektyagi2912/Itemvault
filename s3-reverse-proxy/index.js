const express = require('express');
const httpProxy = require('http-proxy');
const { url } = require('inspector');

const app = express()
const port = 8000

const BASE_PATH = 'https://vercel-mine.s3.eu-north-1.amazonaws.com/__output';

const proxy = httpProxy.createProxyServer();  // create a proxy server instance4

app.use((req, res) => {
    const hostName = req.hostname;
    const subDomain = hostName.split('.')[0];
    console.log('subDomain:', subDomain);
    const resolve = `${BASE_PATH}/${subDomain}`;
    proxy.web(req, res, { target: resolve, changeOrigin: true });
})

proxy.on('proxyReq',(proxyReq, req,res)=>{
    const url = req.url
    if(url === '/')
        proxyReq.path += 'index.html'
    return proxyReq
})

app.listen(port, () => {
    console.log(`Reverse Proxy is running on port ${port}`);
})
