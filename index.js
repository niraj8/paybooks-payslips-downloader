const {
    openBrowser, client, goto, waitFor, textBox, link, into, write, click, $, closeBrowser, goBack, screenshot
} = require('taiko');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

class MonthPayslipSummaryPage {
    DOWNLOAD_ICON_SELECTOR = `//i[contains(@class, 'fa-download')]`;

    async download(downloadPath, filename) {
        await screenshot()
        await click($(this.DOWNLOAD_ICON_SELECTOR), {waitForNavigation: true});
        // TODO can we do something so that we don't have to wait for 2 seconds to make sure the file is downloaded
        await waitFor(2000);
        fs.renameSync(downloadPath + '/payslip.pdf', downloadPath + '/' + filename + '.pdf');
        console.log(`✅ ${filename}`);
        await goBack();
    }

}

class PayslipsListPage {
    YEARS_DROPDOWN_SELECTOR = '.lh_date_dropdown_link';
    YEARS_DROPDOWN_ROWS_XPATH = '//*[@id="abc1"]/div/div/div/div[1]/div/div[1]/div/div/h4/div/ul/li/a';
    DASHBOARD_PAYSLIPS_SELECTOR = "//div[contains(@class, 'dashpaysliphis')]";

    async open() {
        await click($(this.DASHBOARD_PAYSLIPS_SELECTOR));
    }

    async download(downloadPath) {
        const yearRows = await this.yearRowList();

        await this.toggleYearDropdown(); // close the year dropdown

        // For each row in the dropdown
        for (let i = 0; i < yearRows.length; i++) {
            await this.downloadPayslips(downloadPath, i);
        }
    }

    async toggleYearDropdown() {
        await click($(this.YEARS_DROPDOWN_SELECTOR), {waitForNavigation: true});
    }

    async yearRowList() {
        await this.toggleYearDropdown();
        return await $(this.YEARS_DROPDOWN_ROWS_XPATH).elements();
    }

    async navigateToYearIndex(rowIndex) {
        await click((await this.yearRowList())[rowIndex], {waitForNavigation: true});
    }

    async downloadPayslips(downloadPath, yearRowIndex) {
        await this.navigateToYearIndex(yearRowIndex);
        const rows = await (await link('Quick View')).elements();
        const monthYearDollarWrapper = await $('div.ps_col1');
        const monthYearList = await monthYearDollarWrapper.elements();

        for (let i = 0; i < rows.length; i++) {
            await this.navigateToYearIndex(yearRowIndex)
            const links = await link('Quick View')
            const tmp = await links.elements();
            await click(tmp[i], {waitForNavigation: true});
            await waitFor(500);
            const monthYear = await monthYearList[i].text();
            await new MonthPayslipSummaryPage().download(downloadPath, monthYear);
        }
    }
}

class Paybooks {
    async login(username, password, domain) {
        const loginPage = new LoginPage(username, password, domain);
        await loginPage.login();
    }

    async downloadAllPayslips(downloadPath) {
        const payslipsPage = new PayslipsListPage();
        await payslipsPage.open()
        await payslipsPage.download(downloadPath);
    }
}

class LoginPage {
    LOGIN_URL = 'https://apps.paybooks.in/mylogin.aspx';

    username;
    password;
    domain;

    constructor(username, password, domain) {
        this.username = username;
        this.password = password;
        this.domain = domain;
    }

    async login() {
        await goto(this.LOGIN_URL);
        await write(this.username, into(textBox({name: 'txtUserName'})));
        await write(this.password, into(textBox({name: 'txtPassword'})));
        await write(this.domain, into(textBox({name: 'txtDomain'})));
        await click("submit");
    }
}

(async () => {
    const PASS = process.env.PAYBOOKS_PASSWORD
    const USER = process.env.PAYBOOKS_USERNAME
    const DOMAIN = process.env.PAYBOOKS_DOMAIN


    // exit if PASS, USER, DOMAIN empty
    if (!PASS || !USER || !DOMAIN) {
        console.log("PAYBOOKS_USERNAME, PAYBOOKS_PASSWORD or PAYBOOKS_DOMAIN env var not present")
        process.exit(-1);
    }

    // let LAUNCH_HEADLESS = true;
    // if (process.argv[2] === "--headful") {
    //     LAUNCH_HEADLESS = false;
    //     console.log("Launching in headful mode")
    // }

    const downloadPath = path.resolve(__dirname, 'data', 'downloaded');
    mkdirp(downloadPath);
    console.log("Download path set to " + downloadPath);
    try {
        // Set up browser
        await openBrowser({headless: false});
        await client().send('Page.setDownloadBehavior', {
            behavior: 'allow', downloadPath: downloadPath,
        });

        const paybooks = new Paybooks()
        await paybooks.login(USER, PASS, DOMAIN)
        await paybooks.downloadAllPayslips(downloadPath);
    } catch (error) {
        console.error(error);
    } finally {
        console.log(downloadPath);
        await closeBrowser();
    }
})();
