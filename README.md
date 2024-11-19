# About
Solves the fetch challenge by implementing a webservice that processes and calcualtes receipts.

The fetch challenge was written with node.js and express. It can run through docker or locally with node.js & npm.

# Installation
## Docker
```
docker build -t fetch-challenge .
```
## Local
```
npm install
```

# Running
## Docker
```
docker run -p 8000:8000 fetch-challenge
```
## Local
```
node receipt-processor.js
```