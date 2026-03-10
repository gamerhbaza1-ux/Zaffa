
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

  // قائمة المتاجر المصرية وروابط البحث الخاصة بها مع شعارات مستقرة
  const stores = [
    // 🛍️ مواقع عامة
    {
      name: 'أمازون مصر',
      url: `https://www.amazon.eg/s?k=${query}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
    },
    {
      name: 'نون مصر',
      url: `https://www.noon.com/egypt-ar/search/?q=${query}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Noon_logo.svg'
    },
    {
      name: 'جوميا',
      url: `https://www.jumia.com.eg/catalog/?q=${query}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Jumia_Logo.svg'
    },
    // 🔌 مواقع الأجهزة الكهربائية والإلكترونيات
    {
      name: 'بي تك',
      url: `https://btech.com/ar/catalogsearch/result/?q=${query}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/B.TECH_logo.png'
    },
    {
      name: 'راية شوب',
      url: `https://www.rayashop.com/ar/catalogsearch/result/?q=${query}`,
      logo: 'https://www.rayashop.com/media/logo/stores/1/Raya_Shop_logo.png'
    },
    {
      name: '2B Egypt',
      url: `https://2b.com.eg/ar/catalogsearch/result/?q=${query}`,
      logo: 'https://2b.com.eg/media/logo/stores/1/2B_Logo_1.png'
    },
    {
      name: 'مجموعة العربي',
      url: `https://www.elarabygroup.com/ar/catalogsearch/result/?q=${query}`,
      logo: 'https://www.elarabygroup.com/media/logo/stores/1/Elaraby_logo.png'
    },
    {
      name: 'يونيون آير',
      url: `https://unionaire.com/search?q=${query}`,
      logo: 'https://unionaire.com/media/logo/stores/1/Unionaire_Logo.png'
    },
    // 🏬 هايبر ماركت يبيع أونلاين
    {
      name: 'كارفور مصر',
      url: `https://www.carrefouregypt.com/mafegy/ar/v4/search?keyword=${query}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Carrefour_logo.svg'
    },
    {
      name: 'هايبر وان',
      url: `https://hyperone.com.eg/ar/search?q=${query}`,
      logo: 'https://hyperone.com.eg/media/logo/stores/1/Hyperone_Logo.png'
    },
    {
      name: 'سبينيس مصر',
      url: `https://spinneys-egypt.com/ar/search?q=${query}`,
      logo: 'https://spinneys-egypt.com/media/logo/stores/1/Spinneys_Logo.png'
    },
    // 📱 مواقع إلكترونيات وموبايلات
    {
      name: 'دريم 2000',
      url: `https://dream2000.com/ar/catalogsearch/result/?q=${query}`,
      logo: 'https://dream2000.com/media/logo/stores/1/Dream_2000_Logo.png'
    },
    {
      name: 'تريد لاين',
      url: `https://tradelinestores.com/ar/search?q=${query}`,
      logo: 'https://tradelinestores.com/media/logo/stores/1/Tradeline_Logo.png'
    }
  ];

  // محاكاة تأخير البحث (Network Latency)
  await new Promise(resolve => setTimeout(resolve, 800));

  return stores.map(store => ({
    storeName: store.name,
    storeLogo: store.logo,
    price: 'عرض السعر',
    link: store.url,
    availability: true
  }));
}
