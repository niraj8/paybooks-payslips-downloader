const { openBrowser, client, goto, waitFor, textBox, link, into, write, click, $, closeBrowser, goBack } = require('taiko');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const YEARS_DROPDOWN_SELECTOR = '.lh_date_dropdown_link';
const YEARS_DROPDOWN_ROWS_XPATH = '//*[@id="abc1"]/div/div/div/div[1]/div/div[1]/div/div/h4/div/ul/li/a';

(async () => {
    const PASS = process.env.PAYBOOKS_PASSWORD
    const USER = process.env.PAYBOOKS_USERNAME
    const DOMAIN = process.env.PAYBOOKS_DOMAIN

    // exit if PASS, USER, DOMAIN empty
    if (!PASS || !USER || !DOMAIN) {
        console.log("PAYBOOKS_USERNAME, PAYBOOKS_PASSWORD or PAYBOOKS_DOMAIN env var not present")
        process.exit(-1);
    }

    const downloadPath = path.resolve(__dirname, 'data', 'downloaded');
    mkdirp(downloadPath);
    console.log("Download path set to " + downloadPath);
    try {
        // Set up browser
        await openBrowser();
        await client().send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        // Login
        await goto('https://apps.paybooks.in/mylogin.aspx');
        await write(USER, into(textBox({ name: 'txtUserName' })));
        await write(PASS, into(textBox({ name: 'txtPassword' })));
        await write(DOMAIN, into(textBox({ name: 'txtDomain' })));
        await click("submit");

        // Navigate to Payslips Grid page
        const selector = `//div[contains(@class, 'dashpaysliphis')]`;
        await click($(selector));
        await waitFor(2000);

        // Get all years
        await click($(YEARS_DROPDOWN_SELECTOR));
        await waitFor(1000);

        const yearRows = await $(YEARS_DROPDOWN_ROWS_XPATH).elements();

        await click($(YEARS_DROPDOWN_SELECTOR));
        await waitFor(1000);
        for (let i = 0; i < yearRows.length; i++) {
            await navigateToYearIndex(i);
            await waitFor(1000)
            await downloadPayslips(downloadPath, i);
        }
    } catch (error) {
        console.error(error);
    } finally {
        console.log(downloadPath);
        await closeBrowser();
    }
})();

async function navigateToYearIndex(rowIndex) {
    await click($(YEARS_DROPDOWN_SELECTOR));
    await waitFor(1000);
    const tmp = await $(YEARS_DROPDOWN_ROWS_XPATH).elements();
    const row = tmp[rowIndex];
    await click(row);
    // console.log(await row.text());
}

async function downloadPayslips(downloadPath, yearRowIndex) {
    const links = await link('Quick View');
    const elements = await links.elements();
    const monthYearDollarWrapper = await $('div.ps_col1');
    const monthYearList = await monthYearDollarWrapper.elements();

    for (let i = 0; i < elements.length; i++) {
        await navigateToYearIndex(yearRowIndex)
        const links = await link('Quick View')
        const tmp = await links.elements();
        await click(tmp[i]);
        await waitFor(2000);
        const monthYear = await monthYearList[i].text();
        console.log(monthYear);
        await click($(`//i[contains(@class, 'fa-download')]`));
        await waitFor(2000);
        fs.renameSync(downloadPath + '/payslip.pdf', downloadPath + '/' + monthYear + '.pdf');
        await goBack();
        await waitFor(2000);
    }
}
