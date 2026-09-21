# ScriptHive - Yazılımcı Geliştirme ve Devir Kontrol Listesi (Checklist)

Bu liste, projeyi devralan yazılımcının yeni bir özellik eklerken veya bakım yaparken takip etmesi gereken adımları içerir.

---

## 1. Yeni Bir Element Tipi Eklenirken:
- [ ] `src/types.ts` içerisindeki `ElementType` union tipine yeni tipi ekleyin.
- [ ] `src/components/Toolbar.tsx` ve `src/components/TabletToolbar.tsx` araç çubuklarına butonu ekleyin.
- [ ] `src/components/Editor.tsx` render bloklarında yeni tipin stil ve girinti kurallarını tanımlayın.
- [ ] `src/App.tsx` içerisindeki `handleExportPDF`, `handleExportDOCX`, `handleExportFDX`, `handleExportFountain` fonksiyonlarında yeni tipe ait biçimlendirme kurallarını güncelleyin.
- [ ] `parseTextToElements` fonksiyonunda yeni tipin regex/metin tanıma kuralını entegre edin.

---

## 2. Derleme ve Test Kontrolü:
- [ ] `npm run lint` komutunun hatasız (`tsc --noEmit`) geçtiğini doğrulayın.
- [ ] `npm run build` komutunun başarıyla `dist/` paketini oluşturduğunu test edin.
- [ ] Tarayıcı DevTools Network sekmesinde "Offline" modunu açarak uygulamanın çalıştığını doğrulayın.
- [ ] Dışa aktarma (PDF, DOCX, FDX, Markdown) fonksiyonlarının tarayıcıda indirilebilir dosya ürettiğini kontrol edin.
