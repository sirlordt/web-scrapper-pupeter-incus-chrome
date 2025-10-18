import { launch } from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'fs';

async function scrapOrder( url ) {

   mkdirSync( "./browsers/", { recursive: true } );

  const browser = await launch({
    executablePath: '/usr/local/bin/google-chrome-container', // o '/usr/bin/google-chrome'
    headless: false, // cambia a false si quieres ver el navegador
    devtools: true, // Esto mantiene el navegador abierto
    userDataDir: './browsers/chrome_profile', // Directorio donde se guardará todo
    args: [
      '--restore-last-session', // Restaura pestañas anteriores
      '--disable-blink-features=AutomationControlled', // IMPORTANTE
    ],    
    /*
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage' // importante en contenedores
    ]
      */
  });

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Obtener todas las pestañas
  let pages = await browser.pages();
  
  // Cerrar las pestañas about:blank
  for (const page of pages) {

    const url = page.url();
    const title = await page.title();
    
    if (url === 'about:blank' || url === '' || title.match(/order\s*#/i)) {
    
      await page.close();
      
    }

  }  

  await new Promise(resolve => setTimeout(resolve, 5000));

  const emailPage = await browser.newPage();
  //await page.goto('https://mail.google.com/mail/u/orders@weknock.com/#all/199f57cf6318bddd');
  //await emailPage.goto("https://mail.google.com/mail/u/orders@weknock.com/#all/199f71f039ded0e3");
  //await emailPage.goto("https://mail.google.com/mail/u/orders@weknock.com/#all/199f57d36b39030f");
  await emailPage.goto(url);
  
  const title = await emailPage.title();
  console.log('Full title:', title);

  // Extraer lo que está después de # hasta el siguiente espacio o guión
  const match = title.match(/#\s*([A-Z0-9-]+)/);
  let orderNumber = match ? match[1] : null;

  orderNumber = orderNumber?.trim()?.toLocaleLowerCase();

  console.log('Order Number:', orderNumber); // WGU-7F2  
  //console.log(await emailPage.title());
  //await page.screenshot({ path: 'screenshot.png' });

  console.log('Waiting for email load...');
  //await page.waitForTimeout(3000); // Esperar a que cargue Gmail
  await new Promise(resolve => setTimeout(resolve, 3000)); // ✅ Correcto
  
  // Hacer clic en el botón
  console.log('Search blue button...');

  const clicked = await emailPage.evaluate(() => {

    const links = Array.from(document.querySelectorAll('a'));
    const link = links.find(el => el.textContent.includes('View Order'));

    if (link) {

      link.click();
      return true;

    }

    return false;

  });
  
  if ( clicked ) {

    console.log('Click, waiting for new tab...');
    
    // Esperar a que se abra la nueva pestaña
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Obtener todas las pestañas
    const pages = await browser.pages();
    const orderPage = pages[pages.length - 1];
    
    // ✅ Configurar viewport de la nueva pestaña también
    await orderPage.setViewport({
      width: 1920,
      height: 3080,
      deviceScaleFactor: 1
    });

    //console.log('Nueva pestaña URL:', orderPage.url());
    
    // Esperar un poco más
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Guardar contenido
    mkdirSync( "./orders/" + orderNumber, { recursive: true } );

    const html = await orderPage.content();
    writeFileSync( "./orders/" + orderNumber + "/" + orderNumber + ".html", html);
    //console.log('HTML guardado');
    
    await orderPage.screenshot({ path:  "./orders/" + orderNumber + "/" + orderNumber + ".png", fullPage: true });
    //console.log('Screenshot guardado');

    await orderPage.close();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await emailPage.close();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await browser.close();
  }
  
  //await page.close();
  //await browser.close();
};


async function main() {

  //let url = "https://mail.google.com/mail/u/orders@weknock.com/#all/199f57d36b39030f";
  //let url = "https://mail.google.com/mail/u/orders@weknock.com/#all/199f3f0f55e3a5e2";
  //let url = "https://mail.google.com/mail/u/orders@weknock.com/#all/199f3d9ffbbb46c2";
  //let url = "https://mail.google.com/mail/u/orders@weknock.com/#all/199f40e60a47b70a";
  //let url = "https://mail.google.com/mail/u/orders@weknock.com/#all/199f2a6cf9579541";
  let url = "https://mail.google.com/mail/u/orders@weknock.com/#all/199f0474ea4225f6";

  await scrapOrder( url );

}

await main();