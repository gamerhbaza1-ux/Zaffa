
'use server';

/**
 * @fileOverview محرك البحث عن الأسعار في المتاجر المصرية.
 * يقوم هذا الملف بتجهيز روابط البحث وجلب نتائج أولية للمقارنة.
 */

export type MarketPrice = {
  storeName: string;
  storeLogo: string;
  price: string;
  link: string;
  availability: boolean;
};

export async function findProductPrices(productName: string): Promise<MarketPrice[]> {
  // نقوم بتنظيف اسم المنتج للبحث
  const query = encodeURIComponent(productName);

  // ملاحظة للمبرمج: في تطبيق الإنتاج، يمكن استخدام مكاتب مثل 'cheerio' أو 'puppeteer' 
  // للقيام بعملية الـ Scraping من السيرفر. هنا سنقوم بتجهيز الروابط والنتائج التجريبية.
  
  const stores = [
    {
      name: 'أمازون مصر',
      url: `https://www.amazon.eg/s?k=${query}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
    },
    {
      name: 'جوميا',
      url: `https://www.jumia.com.eg/catalog/?q=${query}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Jumia_Logo.svg/512px-Jumia_Logo.svg.png'
    },
    {
      name: 'بي تك',
      url: `https://btech.com/ar/catalogsearch/result/?q=${query}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/B.TECH_logo.png/640px-B.TECH_logo.png'
    },
    {
      name: 'راية شوب',
      url: `https://www.rayashop.com/ar/catalogsearch/result/?q=${query}`,
      logo: 'https://media.licdn.com/dms/image/C4D0BAQF_Z_X_X_X_X/company-logo_200_200/0/1630571941444?e=2147483647&v=beta&t=X_X_X_X'
    },
    {
      name: 'كارفور مصر',
      url: `https://www.carrefouregypt.com/mafegy/ar/v4/search?keyword=${query}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/1200px-Carrefour_logo.svg.png'
    }
  ];

  // محاكاة تأخير البحث (Network Latency)
  await new Promise(resolve => setTimeout(resolve, 1500));

  // في النموذج الأولي، سنقوم بإرجاع الروابط المباشرة للبحث مع أسعار "تقديرية" 
  // لتوضيح الشكل النهائي للمستخدم.
  return stores.map(store => ({
    storeName: store.name,
    storeLogo: store.logo,
    price: 'اضغط للعرض', // في النسخة الكاملة سيتم استخراج السعر الحقيقي هنا
    link: store.url,
    availability: true
  }));
}
