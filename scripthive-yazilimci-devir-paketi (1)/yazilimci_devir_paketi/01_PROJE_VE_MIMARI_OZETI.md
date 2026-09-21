# ScriptHive - Proje ve Mimari Özeti

## 1. Proje Amacı ve Çözülen Problem
**ScriptHive**, film, dizi, tiyatro ve dijital içerik senaristleri için tasarlanmış, **Offline-First (çevrimdışı öncelikli)**, zengin araç setine sahip modern bir senaryo yazım ve prodüksiyon yönetim platformudur.

### Temel Özellikler ve Çözümler:
1. **Endüstri Standardı Biçimlendirme:** Amerikan (US) ve Fransız (FR) standartlarında; Sahne Başlığı (Scene Heading), Eylem (Action), Karakter (Character), Diyalog (Dialogue), Parantez İçi (Parenthetical), Geçiş (Transition) bloklarını otomatik tespit eder.
2. **Klavye Odaklı Akıllı Akış:** Yazarken `Tab` tuşu ile element türleri arasında geçiş yapılır; `Enter` tuşu ile bağlamsal akıllı sonraki element (örn: Karakterden sonra otomatik Diyalog) açılır.
3. **PWA & Tam Çevrimdışı Desteği:** Service Worker ve yerel depolama mekanizmaları sayesinde internet kesintilerinde veri kaybı yaşanmaz.
4. **Çoklu Format Desteği:**
   - Dışa Aktarım: PDF, Word (.docx), Final Draft (.fdx), Fountain, Celtx (.html), Kitsp, Markdown (.md).
   - İçe Aktarım: Word (.docx), Fountain, Metin dosyaları.
5. **Entegre Yazarlık Araçları:**
   - **Karakter İncili (Character Bible):** Karakter profilleri, fotoğraflar, ark soruları.
   - **Hikaye İncili (Story Bible):** Sezon/bölüm sinopsis ve logline arşivi.
   - **Mekan Listesi (Location Manager):** İç/Dış mekan istatistiği.
   - **Mantar Pano (Corkboard):** Sahneleri renkli kartlar olarak görselleştirme ve sürükle-bırak sıralama.
   - **Yazma Sprinti & Pomodoro:** 25 dakikalık odaklanma veya kelime/sayfa hedef sayacı (Konfeti kutlamalı).
   - **Renkli Revizyon Sistemi:** Mavi, Pembe, Sarı, Yeşil, Altın ve Beyaz revizyon takibi.
