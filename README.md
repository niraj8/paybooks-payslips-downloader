# Paybooks Payslips downloader

Downloads Payslips from Paybooks.

> 60% of the time, it works every time.

1. Clone this repo
2. Export below env variables
```
export PAYBOOKS_USERNAME=<email>
export PAYBOOKS_PASSWORD=<password> # use single quotes if your password has exclaimation mark
export PAYBOOKS_DOMAIN=<domain for your org>
```
3. Install dependencies & run the script
```
npm i
node index.js
```
