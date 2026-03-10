
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

  // قائمة المتاجر المصرية وروابط البحث الخاصة بها
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
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Jumia_Logo.svg/512px-Jumia_Logo.svg.png'
    },
    // 🔌 مواقع الأجهزة الكهربائية والإلكترونيات
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
      name: '2B Egypt',
      url: `https://2b.com.eg/ar/catalogsearch/result/?q=${query}`,
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSR_vof6_Z_X_X_X_X_X_X_X_X_X_X_X_X' // Placeholder or actual link if available
    },
    {
      name: 'مجموعة العربي',
      url: `https://www.elarabygroup.com/ar/catalogsearch/result/?q=${query}`,
      logo: 'https://www.elarabygroup.com/static/version1708422442/frontend/Elaraby/theme/ar_EG/images/logo.svg'
    },
    {
      name: 'يونيون آير',
      url: `https://unionaire.com/search?q=${query}`,
      logo: 'https://unionaire.com/images/logo.png'
    },
    // 🏬 هايبر ماركت يبيع أونلاين
    {
      name: 'كارفور مصر',
      url: `https://www.carrefouregypt.com/mafegy/ar/v4/search?keyword=${query}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/1200px-Carrefour_logo.svg.png'
    },
    {
      name: 'هايبر وان',
      url: `https://hyperone.com.eg/ar/search?q=${query}`,
      logo: 'https://hyperone.com.eg/assets/images/logo.png'
    },
    {
      name: 'سبينيس مصر',
      url: `https://spinneys-egypt.com/ar/search?q=${query}`,
      logo: 'https://spinneys-egypt.com/assets/images/logo.png'
    },
    // 📱 مواقع إلكترونيات وموبايلات
    {
      name: 'دريم 2000',
      url: `https://dream2000.com/ar/catalogsearch/result/?q=${query}`,
      logo: 'https://dream2000.com/static/version1708422442/frontend/Ours/dream/ar_EG/images/logo.svg'
    },
    {
      name: 'تريد لاين',
      url: `https://tradelinestores.com/ar/search?q=${query}`,
      logo: 'https://tradelinestores.com/images/logo.png'
    }
  ];

  // محاكاة تأخير البحث (Network Latency)
  await new Promise(resolve => setTimeout(resolve, 1200));

  // نقوم بإرجاع الروابط المباشرة للبحث.
  // في النسخة الكاملة، يمكن استخدام Scraping لجلب الأسعار الحقيقية، 
  // ولكن الروابط المباشرة هي الأضمن والأسرع حالياً.
  return stores.map(store => ({
    storeName: store.name,
    storeLogo: store.logo,
    price: 'عرض السعر',
    link: store.url,
    availability: true
  }));
}
