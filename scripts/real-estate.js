const nodemailer = require('nodemailer');
const puppeteer = require("puppeteer");
const Scrape = require('../models/Scrape');

const getQuotes = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    slowMo: 50,
    devtools: false,
    ignoreDefaultArgs: ['--enable-automation'],
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
  });

  let html_text = '<!DOCTYPE html>\n' +
    '<html>\n' +
    '<head>\n' +
    '<style>\n' +
    '#customers {\n' +
    '  font-family: Arial, Helvetica, sans-serif;\n' +
    '  border-collapse: collapse;\n' +
    '  width: 100%;\n' +
    '}\n' +
    '\n' +
    '#customers td, #customers th {\n' +
    '  border: 1px solid #ddd;\n' +
    '  padding: 8px;\n' +
    '}\n' +
    '\n' +
    '#customers tr:nth-child(even){background-color: #f2f2f2;}\n' +
    '\n' +
    '#customers tr:hover {background-color: #ddd;}\n' +
    '\n' +
    '#customers th {\n' +
    '  padding-top: 12px;\n' +
    '  padding-bottom: 12px;\n' +
    '  text-align: left;\n' +
    '  background-color: #04AA6D;\n' +
    '  color: white;\n' +
    '}\n' +
    '</style>\n' +
    '</head>\n' +
    '<body>\n' +
    '\n' +
    '<h1>A Fancy Table</h1>\n' +
    '\n' +
    '<table id="customers">\n' +
    '  <tr>\n' +
    '    <th>Street</th>\n' +
    '    <th>City</th>\n' +
    '    <th>Price</th>\n' +
    '  </tr>';

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.goto("https://www.vbo.nl/huurwoningen/amsterdam");
  await page.waitForTimeout(400);

  await page.click('div#cookiewall a[data-action=settings]');
  await page.waitForTimeout(100);
  await page.click('div#cookiewall div.settings a[data-action=accept]');
  await page.waitForTimeout(50);

  const nav_len = await page.$$eval('div#propertiesWrapper ul.pagination li', els => els.length);

  for (let i = 0; i < nav_len - 2; i++) {
    await page.click('div#propertiesWrapper ul.pagination li:nth-child(' + (nav_len) + ')');
    await page.waitForTimeout(50);
    const sub_len = await page.$$eval('div#propertiesWrapper div.row:nth-child(1) div.col-12', els => els.length);
    for (let j = 0; j < sub_len; j++) {
      try {
        const url = await page.$eval('div#propertiesWrapper div.row:nth-child(1) div.col-12:nth-child('+(j)+') a.propertyLink', el =>el.getAttribute('href'));
        const street = await page.$eval('div#propertiesWrapper div.row:nth-child(1) div.col-12:nth-child('+(j)+') figcaption span.street', el =>el.innerText);
        const city = await page.$eval('div#propertiesWrapper div.row:nth-child(1) div.col-12:nth-child('+(j)+') figcaption span.city', el =>el.innerText);
        const price = await page.$eval('div#propertiesWrapper div.row:nth-child(1) div.col-12:nth-child('+(j)+') figcaption span.price', el =>el.innerText);
        const type = await page.$eval('div#propertiesWrapper div.row:nth-child(1) div.col-12:nth-child('+(j)+') figcaption ul li:nth-child(1)', el =>el.innerText);
        const square = await page.$eval('div#propertiesWrapper div.row:nth-child(1) div.col-12:nth-child('+(j)+') figcaption ul li:nth-child(2)', el =>el.innerText);
        const room_number = await page.$eval('div#propertiesWrapper div.row:nth-child(1) div.col-12:nth-child('+(j)+') figcaption ul li:nth-child(3)', el =>el.innerText);
        const item_data = {
          url: url,
          street: street,
          city: city,
          price: price,
          type: type,
          square: square,
          room_number: room_number
        };
        const db_record = new Scrape(item_data);
        await db_record.save();
        html_text += '<tr><td>' + item_data.street + '</td><td>' + item_data.city + '</td><td>' + item_data.price + '</td></tr>';
      } catch (e) {}
    }
  }



  html_text += '</table>\n' +
    '\n' +
    '</body>\n' +
    '</html>';
  // create reusable transporter object using the default SMTP transport

  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "b10b9c35cc1d6c",
      pass: "c18cbb2648cd63"
    }
  });

  const message = {
    from: "stepeegro@gmail.com",
    to: "workmail1candy@gmail.com",
    subject: "Subject",
    text: html_text
  }
  transport.sendMail(message, function(err, info) {
    if (err) {
      console.log(err)
    } else {
      console.log(info);
    }
  });
};


module.exports= {
  real_estate_module: () => {
    getQuotes().then(r => console.log(r));
  }
};