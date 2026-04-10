'use client';

import { useEffect } from 'react';

/**
 * مصلح ذكي لمشكلة تجمد الشاشة (Pointer Events).
 * يقوم هذا المكون بمراقبة الصفحة باستمرار، وإذا اكتشف أن كل النوافذ المنبثقة أُغلقت
 * ولكن الشاشة لا تزال لا تستجيب، يقوم بإعادة تفعيل التفاعل فوراً.
 */
export function PointerLockFixer() {
  useEffect(() => {
    const fixPointerEvents = () => {
      // نبحث عن أي نافذة مفتوحة (Dialog, Menu, Popover)
      const hasOpenOverlay = document.querySelector(
        '[data-state="open"], [role="dialog"], [role="menu"], [role="listbox"], .radix-overlay'
      );

      if (!hasOpenOverlay) {
        // إذا لم توجد نوافذ مفتوحة، نتأكد أن الجسم (body) والـ (html) مستجيبان
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = 'auto';
        }
        
        // إزالة أي قفل للتمرير إذا لم تكن هناك نافذة تطلبه
        if (!document.body.hasAttribute('data-radix-scroll-lock')) {
          if (document.body.style.overflow === 'hidden') {
            document.body.style.overflow = '';
          }
        }
      }
    };

    // مراقبة التغييرات في الـ DOM (إضافة أو حذف عناصر)
    const observer = new MutationObserver(() => {
      // ننتظر قليلاً حتى تنتهي مكتبة Radix من عملياتها الداخلية
      setTimeout(fixPointerEvents, 50);
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    // تشغيل الفحص عند أول تحميل
    fixPointerEvents();

    return () => observer.disconnect();
  }, []);

  return null;
}
