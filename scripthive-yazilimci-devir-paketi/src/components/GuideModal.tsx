import React from 'react';
import { 
  HelpCircle, X, FileText, LayoutGrid, List, Focus, 
  Edit2, GripVertical, Cloud, Mic, Users, 
  Book, NotebookPen, BarChart2, Tag, ArchiveRestore, 
  History, Timer, Mic2, Replace, Palette, Compass, 
  Activity, Tv, Columns2, Download, Upload, MapPin, Type, Sparkles, Lock
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function GuideModal({ isOpen, onClose, theme }: GuideModalProps) {
  if (!isOpen) return null;
  
  const bg = theme === 'dark' ? 'bg-[#1a1f25] text-slate-100 border-[#2d3640]' : 'bg-[#FFFFF0] text-slate-900 border-[#c8bea8]';
  const overlayBg = 'bg-black/60 backdrop-blur-sm';
  const iconColor = theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700';
  const itemBg = theme === 'dark' ? 'bg-[#252c33] border border-[#2d3640]' : 'bg-[#f4efe4] border border-[#c8bea8]';
  const headerBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]';
  const categoryBg = theme === 'dark' ? 'bg-[#1f2631] text-[#6ba3e8] border-[#2c3746]' : 'bg-blue-50 text-blue-900 border-blue-200';

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 ${overlayBg}`} onClick={onClose}>
      <div 
        className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${bg}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className={`sticky top-0 z-10 flex justify-between items-center p-4 border-b ${headerBg}`}>
          <div className="flex items-center gap-2">
            <HelpCircle className={iconColor} size={22} />
            <div>
              <h2 className="text-base font-bold">ScriptHive Kullanım Rehberi</h2>
              <p className="text-[11px] opacity-70">Profesyonel senaryo yazım kılavuzu ve tüm araçlar</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#2d3640] text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* BÖLÜM 1: CANLI İŞBİRLİĞİ & ORTAK YAZARLIK */}
          <div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 border ${categoryBg}`}>
              🌟 Canlı İşbirliği & Ortak Yazarlık
            </div>
            
            <div className="space-y-3">
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Eşzamanlı Ortak Yazarlık (Peer-to-Peer & Relay)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Üst Bar]</code> ➔ <i>Ortak Yazarlık Butonu</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Davet bağlantısı oluşturup paylaşarak arkadaşlarınızla aynı senaryoda eşzamanlı çalışın. Google Docs tarzı yazar avatarları ve imleçleri anlık olarak görünür. Doğrudan eşler arası (WebRTC) veya bulut relay ile güvenli ve kesintisiz haberleşir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BÖLÜM 2: SENARYO EDİTÖRÜ & YAZIM KOLAYLIKLARI */}
          <div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 border ${categoryBg}`}>
              ✍️ Senaryo Editörü & Yazım Kolaylıkları
            </div>

            <div className="space-y-3">
              {/* Ritimler */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Akıllı Yazım Ritimleri</h3>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Karakter adından sonra <kbd>Enter</kbd> doğrudan diyaloğa, boş diyalog satırında <kbd>Enter</kbd> ise eyleme geçer. <kbd>Tab</kbd> tuşuna basarak sahne, eylem, karakter, diyalog, parantez ve geçiş türleri arasında hızlıca geçiş yapabilirsiniz.
                  </p>
                </div>
              </div>

              {/* Sayfa Bölme */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Doğal Sayfa Bölme (Action & Dialogue Split)</h3>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Final Draft standardında, sayfaya sığmayan uzun eylem ve diyalog paragrafları sayfa sınırında otomatik olarak bölünür. Diyaloglarda alt sayfaya <b>(MORE)</b> ve üst sayfaya <b>(DEVAM)</b> ibareleri eklenir; her iki parça da akıcı bir şekilde düzenlenebilir.
                  </p>
                </div>
              </div>

              {/* Çift Diyalog */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Columns2 size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Çift Diyalog (Dual Dialogue)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Biçim]</code> ➔ <i>Çift Diyalog</i> veya <kbd>Ctrl/Cmd + Shift + D</kbd>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Aynı anda konuşan iki karakterin repliklerini yan yana çift sütun olarak düzenler. <kbd>Tab</kbd> tuşu ile sütunlar arasında kolayca geçiş yapabilirsiniz.
                  </p>
                </div>
              </div>

              {/* Daktilo Modu */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Focus size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Daktilo Kaydırma (Typewriter Mode)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Görünüm]</code> ➔ <i>Daktilo Kaydırma Modu</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Yazarken aktif satırı ekranın dikey merkezinde sabit tutarak sayfanın aşağı kaymasını engeller ve klasik daktilo konforunda kesintisiz yazım sunar.
                  </p>
                </div>
              </div>

              {/* Zen Paragraf Karartma */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Focus size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Zen Paragraf Karartma (Focus Dimming)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Görünüm]</code> ➔ <i>Zen Paragraf Karartma</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Yalnızca üzerinde çalıştığınız aktif paragrafı aydınlatır, diğer tüm paragrafları hafifçe karartarak dikkatinizi dağılmadan tek noktada toplar.
                  </p>
                </div>
              </div>

              {/* Hikaye Etiketleri */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Tag size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Hikaye Etiketleri (Story Tags)</h3>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Sahne başlıklarının yanındaki Etiket (<Tag size={13} className="inline" />) ikonuna tıklayarak sahnelerinize renk atayabilir, ana ve yan hikayeleri renk kodlarıyla takip edebilirsiniz.
                  </p>
                </div>
              </div>

              {/* Revizyon Yönetimi */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <History size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Revizyon Yönetimi ve Taslak Renkleri</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Düzenle]</code> ➔ <i>Revizyon Takibi</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Endüstri standardı taslak renklerini (Beyaz, Mavi, Pembe, Sarı, Yeşil, Altın) kullanın; değiştirilen veya eklenen satırların sağ kenarına otomatik olarak revizyon yıldızları (*) yerleşir.
                  </p>
                </div>
              </div>

              {/* Kilitlenmiş Sayfa ve Sahne Numaraları */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Lock size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Kilitlenmiş Sayfa ve Sahne Numaraları (Locked Pages & Scenes)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Yapım]</code> ➔ <i>Sayfa ve Sahneleri Kilitle (A-Sayfa & A-Sahne)</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Çekim senaryosu ve revizyon aşamalarında sayfa ve sahne numaralarının kaymasını önler. Araya eklenen yeni sahneler Hollywood standardında otomatik olarak <b>A-Sahneleri (örn: 1A, 1B, 1C)</b>; taşan sayfalar ise <b>A-Sayfaları (örn: 12A, 12B)</b> olarak adlandırılır. Mevcut sahne ve sayfaların numaraları asla değişmez.
                  </p>
                </div>
              </div>

              {/* Sesle Yazım */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Mic size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Sesle Yazım (Dikte)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Araçlar]</code> ➔ <i>Sesle Yazım</i> veya <kbd>Ctrl/Cmd + Shift + V</kbd>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Senaryonuzu Türkçe sesli dikteyle konuşarak yazdırın. Diyalog tamamlandığında <b>"Geç"</b> diyerek bir sonraki karaktere otomatik olarak geçebilirsiniz.
                  </p>
                </div>
              </div>

              {/* Yazı Tipi & Tipografi */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Type size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Yazı Tipi & Tipografi Ayarları</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Biçim]</code> ➔ <i>Yazı Tipi & Boyut</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Courier Prime, Courier New ve özel Google Fontları arasından seçim yapabilir; punto, satır yüksekliği ve sayfa formatını (US Letter / A4) dilediğiniz gibi ayarlayabilirsiniz.
                  </p>
                </div>
              </div>

              {/* Kapak Sayfası */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Book size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Kapak Sayfası Editörü</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Dosya]</code> ➔ <i>Kapak Sayfası Düzenle</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Senaryonuza profesyonel kapak sayfası ekleyin: Başlık, yazar, iletişim bilgileri, tarih, afiş görseli ve sektör standardı revizyon geçmişi tablosu oluşturun.
                  </p>
                </div>
              </div>

              {/* Sol Sahne Listesi */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <List size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Sol Sahne Gezgini (Navigator)</h3>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Tüm sahneleri kronolojik sırada listeleyin, tıklayarak ilgili sahneye anında gidin ve sürükle-bırak (<GripVertical size={13} className="inline" />) ile sahnelerin senaryodaki sıralamasını pratikçe değiştirin.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BÖLÜM 3: KARAKTER, DİYALOG & MASA OKUMA ARAÇLARI */}
          <div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 border ${categoryBg}`}>
              🎭 Karakter, Diyalog & Masa Okuma Araçları
            </div>

            <div className="space-y-3">
              {/* Masa Okuma */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Palette size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Masa Okuma Modu & Karakter Renk Vurgulama</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Düzenle]</code> ➔ <i>Masa Okuma & Renk Vurgulama</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Karakterlere özel 8 farklı fosforlu prova rengi atayın veya "Otomatik Dağıt" ile eşleştirin. Oyuncu Odak Modu (Spotlight) ile seçilen karakterin repliklerini parlatıp diğerlerini soluklaştırarak masa okumalarını kolaylaştırın. Renkler Word (.docx) çıktısına da fosforlu dolgu olarak aynen aktarılır.
                  </p>
                </div>
              </div>

              {/* Karakter Sesi İzolasyonu */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Mic2 size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Karakter Sesi İzolasyonu (Dialogue Tuner) & Rol Kağıtları</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Düzenle]</code> ➔ <i>Karakter Sesi İzolasyonu</i> veya <code>[Yapım]</code> ➔ <i>Rol Kağıtları</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Seçilen karakterin tüm repliklerini baştan sona tek sayfada filtreleyin, canlı 2 yönlü düzenleyin, toplam konuşma süresini ve kelime istatistiklerini hesaplayın; sadece o karaktere ait Rol Kağıdı (Sides) PDF/MD çıktısı alın.
                  </p>
                </div>
              </div>

              {/* Akıllı Toplu Değiştirme */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Replace size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Akıllı Toplu Değiştirme (Smart Rename)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Düzenle]</code> ➔ <i>Akıllı Toplu Değiştir (Karakter & Mekan)</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Karakter veya mekan adlarını büyük/küçük harf duyarlılığı ve Türkçe ek kurallarına göre (`MURAT`, `Murat`, `Murat'ın`) akıllıca günceller; onay listesiyle kontrol imkanı tanır ve Karakter Rehberini de otomatik senkronize eder.
                  </p>
                </div>
              </div>

              {/* Karakter Rehberi */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Book size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Karakter Rehberi (Character Bible)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Araçlar]</code> ➔ <i>Karakter Rehberi</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Karakter fotoğrafları, psikolojik ark soruları (Büyük Güdü, İçsel Travma, Dönüşüm), biyografiler ve özel soru setleri ile derinlikli karakter dosyaları oluşturun. .json, .md, .docx ve .pdf olarak dışa aktarabilirsiniz.
                  </p>
                </div>
              </div>

              {/* Karakter İstatistikleri */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <BarChart2 size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Karakter İstatistikleri & Dağılımı</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Araçlar]</code> ➔ <i>Karakter İstatistikleri</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Senaryodaki tüm karakterlerin sahne sayısı, replik yüzdesi, kelime sayısı ve konuşma ağırlıklarını görsel grafiklerle analiz edin.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BÖLÜM 4: HİKAYE MİMARİSİ & PRODÜKSİYON PLANLAMA */}
          <div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 border ${categoryBg}`}>
              🎬 Hikaye Mimarisi & Prodüksiyon Planlama
            </div>

            <div className="space-y-3">
              {/* Dizin Kartları */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <LayoutGrid size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Dizin Kartları (Corkboard / Mantar Pano)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Görünüm]</code> ➔ <i>Dizin Kartları</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Sahnelerinizi mantar pano üzerinde kartlar halinde kuş bakışı görün; kartları sürükleyip bırakarak senaryodaki sıralarını anında değiştirin ve sahne özetleri ekleyin.
                  </p>
                </div>
              </div>

              {/* Hikaye Geliştirici & Şablonlar */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Compass size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Hikaye Geliştirici & Şablonlar (Story Beats Wizard)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Araçlar]</code> ➔ <i>Hikaye Geliştirici & Şablonlar</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Save the Cat (15 Beat), Kahramanın Yolculuğu (12 Aşama), Dan Harmon Çemberi, 8 Sekans ve Dizi/Dijital Platform modelleri dahil <b>36 dünya standardı şablonla</b> senaryonuzu beat beat planlayın, soruları yanıtlayın ve hedef sayfa hesaplarını takip edin.
                  </p>
                </div>
              </div>

              {/* Dramatik Gerilim Çizelgesi */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Activity size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Dramatik Gerilim & Duygu Çizelgesi (Arc Timeline)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Araçlar]</code> ➔ <i>Gerilim & Duygu Çizelgesi</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Sahnelerinizin tansiyon puanlarını belirleyin; hikayenizin orta nokta ve doruk noktası (climax) ritmini interaktif eğri grafiği üzerinde takip edin.
                  </p>
                </div>
              </div>

              {/* Sezon Hikayesi */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Tv size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Sezon Hikayesi (Dizi & Bölüm Rehberi)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Araçlar]</code> ➔ <i>Sezon Hikayesi (Bölüm Rehberi)</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Dizi projelerinizde tüm bölümlerin olay örgülerini, bölüm özetlerini ve sezonluk master arkı tek merkezde toplayın; .json, .md, .docx ve .pdf olarak dışa aktarın.
                  </p>
                </div>
              </div>

              {/* Mekan Listesi */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Mekan Listesi (Location Bible)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Araçlar]</code> ➔ <i>Mekan Listesi</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Senaryodaki iç ve dış mekanların otomatik dökümünü çıkarın, prodüksiyon ve set gereksinimi notları ekleyin; rapor halinde dışa aktarın.
                  </p>
                </div>
              </div>

              {/* Senaryo Notları */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <NotebookPen size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Senaryo Not Defteri (Story Notes)</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Araçlar]</code> ➔ <i>Not Defteri</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Beyin fırtınası, araştırma notları ve fikir havuzunu senaryonuzun yanında güvenle saklayın.
                  </p>
                </div>
              </div>

              {/* Geri Dönüşüm Kutusu */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <ArchiveRestore size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Geri Dönüşüm Kutusu & Alternatif Replikler</h3>
                  <p className="text-xs opacity-85 leading-relaxed mb-1.5">
                    <b>Erişim:</b> <code>[Düzenle]</code> ➔ <i>Geri Dönüşüm Kutusu</i>.
                  </p>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Silinen sahneleri ve alternatif diyalog versiyonlarını saklayın; istediğiniz an tek tıkla senaryoya geri yükleyin.
                  </p>
                </div>
              </div>

              {/* Sprint & Pomodoro */}
              <div className={`flex gap-4 p-3.5 rounded-xl ${itemBg}`}>
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Timer size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Sprint ve Pomodoro Sayacı</h3>
                  <p className="text-xs opacity-85 leading-relaxed">
                    Sağ üstteki sayaç aracını kullanarak 25 dakikalık odaklanma (Pomodoro) veya belirli bir kelime yazma hedefi belirleyip çalışma veriminizi artırın.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BÖLÜM 5: DIŞA/İÇE AKTARMA & BULUT SENKRONİZASYONU */}
          <div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 border ${categoryBg}`}>
              💾 Dışa/İçe Aktarma & Bulut Senkronizasyonu
            </div>

            <div className={`p-4 rounded-xl space-y-3 ${itemBg}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-inherit space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Download size={15} className={iconColor} />
                    <span>Senaryo Dışa Aktarma</span>
                  </div>
                  <p className="opacity-80 leading-relaxed">
                    PDF, Word (.docx - Masa Okuma Renkli), Final Draft (.fdx), Fountain, Celtx, Kitsp ve Markdown (.md) formatlarında dışa aktarın.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-inherit space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Upload size={15} className={iconColor} />
                    <span>Akıllı İçe Aktarma</span>
                  </div>
                  <p className="opacity-80 leading-relaxed">
                    PDF (sahne/karakter/diyalog ayrıştırmalı), Word (.docx - tüm renk ve metaverilerle), FDX, Fountain ve Markdown dosyalarını açın.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-inherit space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Cloud size={15} className={iconColor} />
                    <span>Google Drive & Otomatik Kayıt</span>
                  </div>
                  <p className="opacity-80 leading-relaxed">
                    Tüm değişiklikler tarayıcıda anlık kaydedilir; Google Drive hesabınızı bağlayarak buluta tek tıkla yedekleyebilirsiniz.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-inherit space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Download size={15} className={iconColor} />
                    <span>Geliştirme Modülleri Dışa/İçe Aktar</span>
                  </div>
                  <p className="opacity-80 leading-relaxed">
                    Karakterler, Şablonlar, Sezon Hikayesi ve Notlarınızı .json, .md, .docx ve .pdf olarak dışa ve içe aktarabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BÖLÜM 6: KLAVYE KISAYOLLARI */}
          <div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 border ${categoryBg}`}>
              ⌨️ Klavye Kısayolları
            </div>

            <div className={`p-4 rounded-xl border ${itemBg}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs opacity-90 font-mono">
                <div className="flex justify-between border-b border-slate-400/20 pb-1"><span>Öğe Türü Değiştir</span> <kbd>Tab</kbd></div>
                <div className="flex justify-between border-b border-slate-400/20 pb-1"><span>Yeni Öğe Ekle</span> <kbd>Enter</kbd></div>
                <div className="flex justify-between border-b border-slate-400/20 pb-1"><span>Satır İçi Alt Satır</span> <kbd>Shift + Enter</kbd></div>
                <div className="flex justify-between border-b border-slate-400/20 pb-1"><span>Çift Diyalog (Yan Yana)</span> <kbd>Ctrl/Cmd + Shift + D</kbd></div>
                <div className="flex justify-between border-b border-slate-400/20 pb-1"><span>Sesle Yazım (Dikte)</span> <kbd>Ctrl/Cmd + Shift + V</kbd></div>
                <div className="flex justify-between border-b border-slate-400/20 pb-1"><span>Tümünü Seç</span> <kbd>Ctrl/Cmd + A</kbd></div>
                <div className="flex justify-between border-b border-slate-400/20 pb-1"><span>Kopyala / Yapıştır</span> <kbd>Ctrl/Cmd + C / V</kbd></div>
                <div className="flex justify-between border-b border-slate-400/20 pb-1"><span>Geri Al / Yinele</span> <kbd>Ctrl/Cmd + Z / Y</kbd></div>
                <div className="flex justify-between border-b border-slate-400/20 pb-1"><span>Kaydet (MD Olarak)</span> <kbd>Ctrl/Cmd + S</kbd></div>
                <div className="flex justify-between border-b border-slate-400/20 pb-1"><span>Bul ve Değiştir</span> <kbd>Ctrl/Cmd + F</kbd></div>
                <div className="flex justify-between pb-1"><span>Tam Ekran / Zen Modu</span> <kbd>F11</kbd></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
