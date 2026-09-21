import React, { useState, useMemo, useRef } from 'react';
import { 
  Compass, X, Check, BookOpen, Sparkles, ChevronRight, 
  HelpCircle, FileText, Download, Upload, Target, Award, ListFilter, 
  ArrowRight, Search, Film, Tv, Layers, Bookmark, CheckCircle2, ChevronLeft,
  Filter, BookMarked, Globe, Play, Flame, Zap, Eye, TreePine, Clapperboard, MonitorPlay,
  ArrowLeft, LayoutGrid, PenTool, CheckCircle, Clock
} from 'lucide-react';
import { ScreenplayElement } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { printStyledDocument, downloadUtf8File, escapeHtml } from '../lib/exportUtils';

export interface BeatDefinition {
  id: string;
  name: string;
  act: string;
  targetPercent: number;
  description: string;
  guidingQuestions: string[];
}

export interface StoryTemplate {
  id: string;
  category: 'film' | 'series' | 'streaming';
  title: string;
  subtitle: string;
  author: string;
  badge: string;
  description: string;
  defaultPages: number;
  beats: BeatDefinition[];
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  // ==========================================
  // SİNEMA FİLMİ ŞABLONLARI (17 MODEL)
  // ==========================================

  // 1. SAVE THE CAT (Blake Snyder)
  {
    id: 'save_the_cat',
    category: 'film',
    title: 'Save the Cat! Beat Sheet',
    subtitle: 'Blake Snyder (15 Beatlik Gişe & Endüstri Standardı - Liar Liar Örneği)',
    author: 'Blake Snyder',
    badge: '15 Beat',
    description: 'Hollywood ve küresel senaryo endüstrisinin en popüler ve ritmik 15 aşamalı hikaye yapısı. (Örn: Liar Liar filminde yalan söylenemeyen mahkeme sahneleri Eğlence ve Oyunlar beat\'idir).',
    defaultPages: 110,
    beats: [
      { id: 'stc_1', name: '1. Açılış Görüntüsü (Opening Image - Sayfa 1)', act: '1. Perde', targetPercent: 1, description: 'Hikayenin tonunu ve karakterin başlangıçtaki kusurlu statükosunu kuran ilk görsel an.', guidingQuestions: ['Karakterinizin mevcut hayatındaki en büyük eksiklik nedir?', 'Açılış anı filmin temasını görsel olarak nasıl simgeliyor?'] },
      { id: 'stc_2', name: '2. Tema Bildirimi (Theme Stated - Sayfa 5)', act: '1. Perde', targetPercent: 5, description: 'Genellikle bir yan karakterin ağzından dökülen sıradan bir replikle filmin asıl teması seyirciye fısıldanır.', guidingQuestions: ['Karakterinizin öğrenmesi gereken temel insani ders nedir?', 'Bu temayı ona kim, farkında olmadan fısıldıyor?'] },
      { id: 'stc_3', name: '3. Kurulum (Set-up - Sayfa 1-10)', act: '1. Perde', targetPercent: 10, description: 'Karakterin kusurları, dünyasının kuralları ve değişmesi gereken hayatı sergilenir.', guidingQuestions: ['Karakterin yaşamındaki statüko neden sürdürülemez?', 'Değişime direnmesine sebep olan korkusu nedir?'] },
      { id: 'stc_4', name: '4. Katalizör / Tetikleyici Olay (Catalyst - Sayfa 8-12)', act: '1. Perde', targetPercent: 12, description: 'Sıradan dünyayı yıkan ve geri dönüşü imkansız kılan kışkırtıcı dışsal olay.', guidingQuestions: ['Karakterin hayatını altüst eden şok edici haber veya olay nedir?', 'Bu olay ona nasıl yeni bir kapı açıyor?'] },
      { id: 'stc_5', name: '5. Tartışma / İkilem (Debate - Sayfa 12-25)', act: '1. Perde', targetPercent: 20, description: 'Kahramanın tereddüt ettiği, gitmekten korktuğu içsel çatışma ve direnç evresi.', guidingQuestions: ['Karakter neden bu maceraya atılmaktan korkuyor?', 'Eski düzeninde kalırsa neyi kaybetmeyi göze alacak?'] },
      { id: 'stc_6', name: '6. 2. Perdeye Geçiş (Break into Two - Sayfa 27 civarı)', act: '2. Perde (A)', targetPercent: 25, description: 'Kahramanın eski dünyayı geride bırakıp yeni bir strateji ve dünyayı aktif olarak seçtiği an.', guidingQuestions: ['Hangi kesin karar onu geri dönülemez bir yola soktu?', 'Yeni dünya eskisinden görsel ve kural olarak nasıl ayrışıyor?'] },
      { id: 'stc_7', name: '7. B-Hikayesi (B Story - Sayfa 30 civarı)', act: '2. Perde (A)', targetPercent: 30, description: 'Temayı taşıyan duygusal alt katman, aşk, dostluk veya akıl hocası ilişkisi.', guidingQuestions: ['Karaktere duygusal veya felsefi olarak ayna tutacak kişi kim?', 'Bu ilişki ana hedefi nasıl besliyor?'] },
      { id: 'stc_8', name: '8. Eğlence ve Oyunlar (Fun and Games - Sayfa 30-55)', act: '2. Perde (A)', targetPercent: 40, description: 'Hikayenin vaadinin gerçekleştiği, fragmanlarda gördüğümüz en eğlenceli ve ikonik sahneler.', guidingQuestions: ['Filminizin afişinde ve fragmanında yer alacak en eğlenceli/heyecanlı sahneler neler?', 'Karakter yeni dünyada nasıl acemilikler yapıyor?'] },
      { id: 'stc_9', name: '9. Orta Nokta (Midpoint - Sayfa 55 civarı)', act: '2. Perde (B)', targetPercent: 50, description: 'Sahte zafer veya sahte yenilgi; risklerin aniden ciddileştiği ve saatli bombanın kurulduğu dönüm noktası.', guidingQuestions: ['Orta noktada bir kutlama mı yaşanıyor yoksa büyük bir çöküş mü?', 'Oyunun kuralları ve riskler nasıl bir anda iki katına çıkıyor?'] },
      { id: 'stc_10', name: '10. Kötüler Yaklaşıyor (Bad Guys Close In - Sayfa 55-75)', act: '2. Perde (B)', targetPercent: 65, description: 'Düşmanların güçlenmesi, ekibin dağılması ve içsel şüphelerin tırmanışı.', guidingQuestions: ['Antagonist hangi beklenmedik hamleyi yapıyor?', 'Karakterin yakın çevresi ve müttefikleri nasıl çatışmaya başlıyor?'] },
      { id: 'stc_11', name: '11. Her Şey Kaybedildi (All Is Lost - Sayfa 75-90 civarı)', act: '2. Perde (B)', targetPercent: 75, description: 'Kahramanın hedeften en uzak olduğu, mentörün kaybedildiği "ölüm kokusu" anı; eski planın çöküşü.', guidingQuestions: ['Kahramanın kaybettiği en değerli şey veya kişi nedir?', 'Eski yöntemleriyle artık kazanamayacağını anladığı an hangisi?'] },
      { id: 'stc_12', name: '12. Ruhun Karanlık Gecesi (Dark Night of the Soul - Sayfa 75-85)', act: '2. Perde (B)', targetPercent: 80, description: 'All Is Lost sonrasında kahramanın içine döndüğü ve tematik dersi nihayet kavradığı duygusal yas süreci.', guidingQuestions: ['Karakter yalnız kaldığında hangi büyük içsel aydınlanmayı yaşıyor?', 'Eski kusurlu benliğini geride bırakmaya nasıl karar veriyor?'] },
      { id: 'stc_13', name: '13. 3. Perdeye Geçiş (Break into Three - Sayfa 85 civarı)', act: '3. Perde', targetPercent: 85, description: 'Öğrenilen tematik dersle üretilen dahiyane yeni plan ve son hücum kararı.', guidingQuestions: ['Karakterin aklına gelen ve kimsenin beklemediği yeni çözüm nedir?', 'Müttefiklerini bu son hamleye nasıl ikna ediyor?'] },
      { id: 'stc_14', name: '14. Final (Finale - Sayfa 85-110)', act: '3. Perde', targetPercent: 95, description: 'Antagonistle nihai yüzleşme ve kahramanın dönüşümünü kanıtladığı doruk savaşı.', guidingQuestions: ['Antagonisti mağlup ederken temadaki dersi nasıl kullanıyor?', 'Eski kusuru yerine hangi yeni gücü ortaya koyuyor?'] },
      { id: 'stc_15', name: '15. Kapanış Görüntüsü (Final Image - Sayfa 110)', act: '3. Perde', targetPercent: 100, description: 'Açılış görüntüsünün tam zıttı olan ve dönüşümü mühürleyen son kare.', guidingQuestions: ['Kapanış karesi açılış görüntüsüyle nasıl görsel bir tezat oluşturuyor?', 'Karakterin yeni dünyadaki huzuru/durumu nasıl resmediliyor?'] }
    ]
  },

  // 2. HERO'S JOURNEY (Christopher Vogler & Joseph Campbell)
  {
    id: 'heros_journey',
    category: 'film',
    title: 'Kahramanın Sonsuz Yolculuğu (Hero\'s Journey)',
    subtitle: 'Christopher Vogler & Joseph Campbell (12 Aşamalı Monomit - Oz Büyücüsü Örneği)',
    author: 'Christopher Vogler',
    badge: '12 Aşama',
    description: 'İnsan zihninin binlerce yıldır masalları algılama biçimini 12 adıma sığdıran klasik monomit modeli. (Örn: Oz Büyücüsü - Kansas sıradan dünyasından "Ev gibisi yok" eliksirine).',
    defaultPages: 110,
    beats: [
      { id: 'hj_1', name: '1. Sıradan Dünya (Ordinary World)', act: '1. Perde', targetPercent: 8, description: 'Kahramanın eksiklikleriyle yaşadığı, içinde sıkıştığı günlük dünyası (Örn: Dorothy\'nin Kansas\'ı).', guidingQuestions: ['Kahramanın günlük rutini ve ait olduğu topluluk nasıldır?', 'Ruhundaki bastırılmış huzursuzluk nedir?'] },
      { id: 'hj_2', name: '2. Maceraya Çağrı (Call to Adventure)', act: '1. Perde', targetPercent: 14, description: 'Sıradanlığı bozan bir problem veya arzu ortaya çıkar; bilinmeyene davet.', guidingQuestions: ['Kahramanın kapısını çalan haberci veya olay nedir?', 'Ona verilen görev dünyayı nasıl kurtaracak?'] },
      { id: 'hj_3', name: '3. Çağrının Reddi (Refusal of the Call)', act: '1. Perde', targetPercent: 18, description: 'Kahramanın değişime karşı duyduğu korku, güvensizlik ve direnç.', guidingQuestions: ['Kahramanın adım atmasını engelleyen en büyük korkusu nedir?', 'Hangi mazeretlerin arkasına sığınıyor?'] },
      { id: 'hj_4', name: '4. Akıl Hocasıyla Karşılaşma (Meeting the Mentor)', act: '1. Perde', targetPercent: 24, description: 'Kahramana rehberlik edecek, ona ekipman veya bilgelik verecek bir bilge bağışçının gelişi.', guidingQuestions: ['Rehber karakter kahramana hangi bilgiyi veya aracı veriyor?', 'Rehberin kendi geçmişindeki pişmanlık nedir?'] },
      { id: 'hj_5', name: '5. İlk Eşiği Geçmek (Crossing the First Threshold)', act: '1. Perde Sonu', targetPercent: 28, description: '"Uçağın tekerleklerinin yerden kesilmesi" gibi, maceranın başladığı özel dünyaya adım atış.', guidingQuestions: ['Kahraman bilinmeyen dünyanın kapısındaki bekçiyi nasıl aşıyor?', 'Eski dünyaya geri dönüş kapısı nasıl kapanıyor?'] },
      { id: 'hj_6', name: '6. Sınavlar, Dostlar ve Düşmanlar (Tests, Allies, Enemies)', act: '2. Perde (A)', targetPercent: 45, description: 'Yeni dünyanın kurallarını öğrenme süreci (Örn: Korkuluk, Teneke Adam ve Aslan ile tanışma).', guidingQuestions: ['Kahramanın yol arkadaşları kimler oluyor?', 'Yeni dünyanın hangi katı kuralına çarparak ders alıyor?'] },
      { id: 'hj_7', name: '7. En Derin Mağaraya Yaklaşım (Approach to the Inmost Cave)', act: '2. Perde (A)', targetPercent: 55, description: 'Takımın birbirini daha derin tanıdığı, tehlikenin merkezine doğru yapılan hazırlık yürüyüşü.', guidingQuestions: ['Düşmanın kalesine girmeden önce ekip nasıl hazırlanıyor?', 'Hangi şüpheler ve sırlar su yüzüne çıkıyor?'] },
      { id: 'hj_8', name: '8. Büyük Çile (The Ordeal)', act: '2. Perde (B)', targetPercent: 65, description: 'Kahramanın en büyük korkusuyla yüzleştiği, mecazi veya gerçek anlamda öldüğü ve yeniden doğduğu an.', guidingQuestions: ['Kahramanın sembolik veya gerçek anlamda öldüğü an nasıl gerçekleşiyor?', 'Küllerinden yeniden doğması neye bağlı?'] },
      { id: 'hj_9', name: '9. Ödül / İksiri Ele Geçirme (Reward - Seizing the Sword)', act: '2. Perde (B)', targetPercent: 75, description: 'Çilenin ardından gelen kutlama, hak edilen zafer, bilgi veya sihirli güç.', guidingQuestions: ['Kahraman ölümden kurtulup hangi büyük gerçeği ele geçirdi?', 'Bu ödül dünyayı kurtarmaya yetecek mi?'] },
      { id: 'hj_10', name: '10. Geri Dönüş Yolu (The Road Back / Chase)', act: '3. Perde', targetPercent: 82, description: 'Genellikle aksiyonu yükselten bir takip sahnesiyle sıradan dünyaya dönüşün başlaması.', guidingQuestions: ['Düşman intikam almak için nasıl peşine düşüyor?', 'Ödülü korumak için hangi tehlikeli kaçış yaşanıyor?'] },
      { id: 'hj_11', name: '11. Yeniden Diriliş (The Resurrection)', act: '3. Perde', targetPercent: 92, description: 'Kahramanın öğrendiği her şeyi kanıtlamak zorunda olduğu o nihai ve en arındırıcı final sınavı.', guidingQuestions: ['Kahraman tek başına hangi son fedakarlığı yapıyor?', 'Eski benliğinin tamamen öldüğünü nasıl kanıtlıyor?'] },
      { id: 'hj_12', name: '12. Eliksirle Dönüş (Return with the Elixir)', act: '3. Perde', targetPercent: 100, description: 'Kazanılan bilgeliğin, sevginin veya ilacın toplulukla paylaşılması ("Ev gibisi yok").', guidingQuestions: ['Kahramanın getirdiği iksir toplumu nasıl dönüştürüyor?', 'Yolculuk onu nasıl olgunlaştırdı?'] }
    ]
  },

  // 3. MICHAEL HAUGE - 6 AŞAMALI OLAY ÖRGÜSÜ
  {
    id: 'michael_hauge_6_stage',
    category: 'film',
    title: 'Michael Hauge 6 Aşamalı Olay Örgüsü (6-Stage Plot)',
    subtitle: '6 Aşama & 5 Milimetrik Dönüm Noktası (Titanic Örneği)',
    author: 'Michael Hauge',
    badge: '6 Aşama & 5 Dönüm',
    description: 'Süre çizgisi (durational percentage) boyunca milimetrik gerçekleşen 6 aşama ve 5 dönüm noktası. (Örn: Titanic filminde buzdağına çarpma tam %75 Büyük Aksilik noktasıdır).',
    defaultPages: 110,
    beats: [
      { id: 'mh_1', name: 'Aşama 1: Kurulum (Setup - İlk %10)', act: '1. Perde (%0 - %10)', targetPercent: 10, description: 'Karakterin sıradan hayatı gösterilir, empati bağı kurulur ve savunma kalkanı (kimliği) sergilenir.', guidingQuestions: ['Karakter kendini dış dünyaya karşı nasıl bir maske ile koruyor?', 'Mevcut statükoda onu eksik hissettiren boşluk ne?'] },
      { id: 'mh_2', name: 'Dönüm Noktası 1: Fırsat (Opportunity - %10)', act: '1. Perde (%10)', targetPercent: 12, description: 'Kahramanın önüne yeni bir kapı açılır ve yeni bir arzu uyanır.', guidingQuestions: ['Kahramanın önüne aniden çıkan beklenmedik fırsat nedir?', 'Bu fırsat onu hangi yeni alana davet ediyor?'] },
      { id: 'mh_3', name: 'Aşama 2: Yeni Durum (New Situation - %10-%25)', act: '1. Perde (%10 - %25)', targetPercent: 25, description: 'Kahramanın yeni çevreye uyum sağlama çabası ve başlangıç planını geliştirmesi.', guidingQuestions: ['Karakter yeni duruma alışmaya çalışırken ne tür acemilikler yaşıyor?', 'Hedefine ulaşmak için kafasında kurduğu ilk plan nedir?'] },
      { id: 'mh_4', name: 'Dönüm Noktası 2: Plan Değişikliği (Change of Plans - %25)', act: '1. Perde Sonu (%25)', targetPercent: 27, description: 'Kahramanın net, görünür ve fiziksel bir dış motivasyon/hedef belirlemesi.', guidingQuestions: ['İlk planı çökerterek onu gerçek ve net bir hedef koymaya zorlayan olay nedir?', 'Artık peşinden koştuğu tek somut hedef ne?'] },
      { id: 'mh_5', name: 'Aşama 3: İlerleme (Progress - %25-%50)', act: '2. Perde (%25 - %50)', targetPercent: 50, description: 'Belirlenen planın işe yarar görünmesi, ilk başarılar ve engellerin yavaş yavaş büyümesi.', guidingQuestions: ['Karakter hedefine yaklaşırken hangi küçük başarıları elde ediyor?', 'İçsel zırhını (kimliğini) kırmaya başladığı anlar neler?'] },
      { id: 'mh_6', name: 'Dönüm Noktası 3: Geri Dönüşü Olmayan Nokta (Point of No Return - %50)', act: '2. Perde Orta Nokta (%50)', targetPercent: 52, description: 'Kahramanın artık köprüleri yakarak hedefe iki ayağıyla birden bağlanması.', guidingQuestions: ['Karakterin köprüleri tamamen yaktığı eylemi nedir?', 'Artık eski hayatına neden asla dönemez?'] },
      { id: 'mh_7', name: 'Aşama 4: Karmaşıklık ve Yükselen Riskler (Complications & Higher Stakes - %50-%75)', act: '2. Perde (%50 - %75)', targetPercent: 75, description: 'Engellerin amansızlaşması, düşmanın varlığını hissettirmesi ve bedelin ölümcülleşmesi.', guidingQuestions: ['Antagonist karakteri nasıl adım adım köşeye sıkıştırıyor?', 'Karakterin kaybetme ihtimali olan en büyük değer ne?'] },
      { id: 'mh_8', name: 'Dönüm Noktası 4: Büyük Aksilik (Major Setback - %75)', act: '2. Perde Sonu (%75)', targetPercent: 78, description: 'All Is Lost (Her Şey Kaybedildi) anı; planın tamamen çökmesi (Örn: Titanic\'te buzdağına çarpma).', guidingQuestions: ['Karakteri tamamen çaresiz bırakan felaket nedir?', 'Eski korkularına dönüp teslim olma noktasına nasıl geliyor?'] },
      { id: 'mh_9', name: 'Aşama 5: Son Hamle (Final Push - %75-%90)', act: '3. Perde (%75 - %90)', targetPercent: 90, description: 'Kahramanın elindeki tüm gücüyle "ya ölüm ya kalım" diyerek yaptığı nihai mücadele (Jack ve Rose\'un hayatta kalma savaşı).', guidingQuestions: ['Karakterin gerçek potansiyelini (özünü) kucakladığı an hangisi?', 'Tüm riskleri göze alarak başlattığı son taarruz planı nedir?'] },
      { id: 'mh_10', name: 'Dönüm Noktası 5: Doruk Noktası (Climax - %90)', act: '3. Perde (%90)', targetPercent: 95, description: 'Nihai hesaplaşma ve hedefin kaderinin belirlendiği en yüksek gerilim anı.', guidingQuestions: ['Kader anında antagonist nasıl alt ediliyor?', 'Karakterin kazandığı veya kaybettiği şey nihai olarak ne oluyor?'] },
      { id: 'mh_11', name: 'Aşama 6: Sonrası (Aftermath - Son %10)', act: '3. Perde (%90 - %100)', targetPercent: 100, description: 'Dönüşüm yaşayan kahramanın yeni yaşamının gösterilmesi.', guidingQuestions: ['Karakter artık korkularından arınmış olarak nasıl yaşıyor?', 'Hikaye seyirciye hangi duygusal tatminle veda ediyor?'] }
    ]
  },

  // 4. JOHN TRUBY - 22 AŞAMALI KARAKTER ODAKLI YAPI
  {
    id: 'john_truby_22_steps',
    category: 'film',
    title: 'John Truby 22 Adımlı Karakter Odaklı Yapı',
    subtitle: 'The Anatomy of Story: Organik Olay Örgüsü (Citizen Kane & Casablanca Örneği)',
    author: 'John Truby',
    badge: '22 Adım (Organik)',
    description: 'Olay örgüsünün dışarıdan dayatılan şablon değil, karakterin en derin zayıflığından (weakness) doğduğu 22 adımlı organik mimari. (Örn: Citizen Kane ve Casablanca).',
    defaultPages: 110,
    beats: [
      { id: 'jt_1', name: '1. Öz-Aldanma, Zayıflık ve İhtiyaç (Self-Delusion, Weakness & Need)', act: '1. Perde', targetPercent: 4, description: 'Karakterin kendine söylediği yalan, ahlaki zayıflığı ve ruhsal ihtiyacı.', guidingQuestions: ['Karakterin başkalarına zarar veren ahlaki zaafı nedir?', 'Kendi hakkında inandığı büyük yalan ne?'] },
      { id: 'jt_2', name: '2. Hayalet ve Hikaye Dünyası (Ghost & Story World)', act: '1. Perde', targetPercent: 8, description: 'Karakterin geçmişinden gelen travma (hayalet) ve onu çevreleyen hikaye dünyası.', guidingQuestions: ['Geçmişinde onu yaralayan ve bugünü zehirleyen travma (hayalet) nedir?', 'Dünya bu yarayı nasıl tetikliyor?'] },
      { id: 'jt_3', name: '3. Sorun / Kriz Durumu (Problem)', act: '1. Perde', targetPercent: 12, description: 'Karakterin hayatını zorlaştıran ilk pürüz ve tıkanıklık.', guidingQuestions: ['Karakterin günlük hayatında tıkandığı somut problem nedir?'] },
      { id: 'jt_4', name: '4. Tetikleyici Olay (Inciting Incident)', act: '1. Perde', targetPercent: 15, description: 'Dengeyi bozan ve karakteri aktif bir arzuya sürükleyen olay.', guidingQuestions: ['Onu pasiflikten çıkaran şok edici gelişme nedir?'] },
      { id: 'jt_5', name: '5. Arzu / Somut Hedef (Desire)', act: '1. Perde Sonu', targetPercent: 20, description: 'Filmin sonuna kadar sürecek olan tek ve net dışsal hedef.', guidingQuestions: ['Karakterin elde etmek istediği apaçık somut hedef nedir?'] },
      { id: 'jt_6', name: '6. Müttefik(ler) (Ally)', act: '2. Perde', targetPercent: 25, description: 'Hedefe giden yolda ona eşlik eden ve farklı değerleri temsil eden dost.', guidingQuestions: ['Yol arkadaşı ona nasıl destek oluyor ve aralarındaki fikir ayrılığı ne?'] },
      { id: 'jt_7', name: '7. Muhalif / Antagonist ve Rakip Ağ (Opponent)', act: '2. Perde', targetPercent: 30, description: 'Aynı hedef için yarışan ve kahramanın zayıflığına saldıran baş rakip.', guidingQuestions: ['Antagonist aynı hedefi neden istiyor ve kahramanın hangi zaafını biliyor?'] },
      { id: 'jt_8', name: '8. Sahte İttifak Muhalifi (Fake-Ally Opponent)', act: '2. Perde', targetPercent: 35, description: 'Dost gibi görünüp düşmana hizmet eden veya kendi gizli ajandası olan karakter.', guidingQuestions: ['Kahramanın en çok güvendiği ama arkasından iş çeviren kişi kim?'] },
      { id: 'jt_9', name: '9. İlk Eylem ve Değişim (First Action & Counter-Action)', act: '2. Perde', targetPercent: 40, description: 'Kahramanın başlattığı ilk atak ve rakibin karşı hamlesi.', guidingQuestions: ['Kahramanın ilk hamlesine rakip nasıl karşılık veriyor?'] },
      { id: 'jt_10', name: '10. Plan (The Plan)', act: '2. Perde', targetPercent: 45, description: 'Rakibi alt etmek ve hedefe ulaşmak için kurulan strateji.', guidingQuestions: ['Kahramanın kurduğu ayrıntılı plan nedir?'] },
      { id: 'jt_11', name: '11. Muhalifin Planı ve Karşı Hamlesi (Opponent\'s Plan)', act: '2. Perde', targetPercent: 48, description: 'Antagonistin kahramanı tuzağa düşürmek için hazırladığı gizli plan.', guidingQuestions: ['Rakibin kahramanı gafil avlamak için kurduğu tuzak ne?'] },
      { id: 'jt_12', name: '12. Sürüş / Uygulama ve Yanılsama (Drive & False Success)', act: '2. Perde Orta Nokta', targetPercent: 52, description: 'Planın uygulanması ve işlerin yolunda gittiği yanılsaması.', guidingQuestions: ['Kahraman neden kazandığını zannediyor?'] },
      { id: 'jt_13', name: '13. Müttefikin Saldırısı / Şüphe (Attack by Ally)', act: '2. Perde', targetPercent: 58, description: 'Dostunun kahramanın ahlaki hatalarını yüzüne vurması.', guidingQuestions: ['Yol arkadaşı kahramanı hangi haksız eylemi yüzünden sertçe eleştiriyor?'] },
      { id: 'jt_14', name: '14. Görünürdeki Başarısızlık (Apparent Defeat)', act: '2. Perde', targetPercent: 65, description: 'Planın çökmesi ve hedefin imkansız hale gelmesi.', guidingQuestions: ['Büyük plan nasıl ters tepiyor ve her şey nasıl dağılıyor?'] },
      { id: 'jt_15', name: '15. İkinci Plan ve Saplantı (Second Plan & Obsession)', act: '2. Perde', targetPercent: 72, description: 'Kahramanın daha tehlikeli ve saplantılı bir taktiğe geçmesi.', guidingQuestions: ['Kahraman hedefi için hangi ahlaki sınırları zorluyor?'] },
      { id: 'jt_16', name: '16. Seyirci Vahyi / Bilgi Üstünlüğü (Audience Revelation)', act: '2. Perde Sonu', targetPercent: 78, description: 'Seyircinin kahramandan önce öğrendiği şok edici gerçek.', guidingQuestions: ['Seyirci, kahramanın henüz bilmediği hangi tehlikeyi öğreniyor?'] },
      { id: 'jt_17', name: '17. Üçüncü Hamle / Kapana Kısılma (Third Phase of Drive)', act: '3. Perde', targetPercent: 82, description: 'Tüm seçeneklerin tükenmesi ve köşeye sıkışma.', guidingQuestions: ['Kahraman nasıl tamamen çaresiz ve kuşatılmış kalıyor?'] },
      { id: 'jt_18', name: '18. Kapı, Kriz ve Ziyaret (Gate, Gauntlet, Visit to Death)', act: '3. Perde', targetPercent: 87, description: 'Ölüm deneyimi ve son savaş kapısından geçiş.', guidingQuestions: ['Kahramanın ölümü hissettiği ve korkusunu yendiği an nasıl yaşanıyor?'] },
      { id: 'jt_19', name: '19. Savaş / Doruk Yüzleşme (Battle / Climax)', act: '3. Perde', targetPercent: 92, description: 'Kahraman ile antagonistin felsefi ve fiziksel nihai savaşı.', guidingQuestions: ['Hangi tarafın dünya görüşü ve ahlakı bu savaşta galip geliyor?'] },
      { id: 'jt_20', name: '20. Kendini Keşfetme / Öz-Vahiy (Self-Revelation)', act: '3. Perde', targetPercent: 96, description: 'Kahramanın kim olduğu ve nasıl biri olması gerektiğiyle ilgili aydınlanması.', guidingQuestions: ['Kahraman kendi hataları hakkında neyi nihayet kabul ediyor?'] },
      { id: 'jt_21', name: '21. Ahlaki Karar (Moral Decision)', act: '3. Perde', targetPercent: 98, description: 'İki değer arasında yapılan ve kahramanın ruhunu kanıtlayan seçim.', guidingQuestions: ['Kahraman kişisel kazancı yerine hangi yüksek değeri seçiyor?'] },
      { id: 'jt_22', name: '22. Yeni Denge (New Equilibrium)', act: '3. Perde Sonu', targetPercent: 100, description: 'Karakterin ve dünyanın ulaştığı yeni ve kalıcı düzen.', guidingQuestions: ['Toplum ve karakter bu yolculuğun sonunda nasıl yeniden inşa ediliyor?'] }
    ]
  },

  // 5. ROBERT MCKEE - 5 ADIMLI MODEL
  {
    id: 'robert_mckee_5_steps',
    category: 'film',
    title: 'Robert McKee 5 Adımlı Dramatik Yapı',
    subtitle: '5 Steps McKee: Classical Dramatic Architecture',
    author: 'Robert McKee',
    badge: '5 Adım',
    description: '"Story" kitabının yazarı Robert McKee\'nin sebep-sonuç ilişkisine ve artan çatışma uçurumlarına dayalı klasik 5 adımlı yapısı.',
    defaultPages: 110,
    beats: [
      { id: 'rm_1', name: '1. Tetikleyici Olay (Inciting Incident)', act: '1. Perde (%0 - %20)', targetPercent: 15, description: 'Karakterin yaşam dengesini kökten bozan, iyi veya kötü yönde dengesizlik yaratan olay.', guidingQuestions: ['Karakterin hayatındaki hassas dengeyi bozan olay nedir?', 'Bu olaya karşı anında geliştirdiği tepki ve arzu nedir?'] },
      { id: 'rm_2', name: '2. İlerleyen Zorluklar (Progressive Complications)', act: '2. Perde (%20 - %75)', targetPercent: 50, description: 'Karakterin beklentileri ile gerçekliğin yarattığı uçurumun (gap) giderek derinleşmesi.', guidingQuestions: ['Karakterin her eyleminde karşısına çıkan beklenmedik engeller neler?', 'Çatışma seviyesi içsel, kişilerarası ve toplumsal olarak nasıl tırmanıyor?'] },
      { id: 'rm_3', name: '3. Kriz (Crisis)', act: '2. Perde Sonu (%75 - %85)', targetPercent: 78, description: 'Kahramanın en ağır ikilem karşısında hayatının en zorlu kararını vermek zorunda kalması.', guidingQuestions: ['Karakterin karşılaştığı "en iyi iki iyiden biri" veya "en az kötü iki kötüden biri" ikilemi nedir?', 'Bu karar karakterin karakterini (omurgasını) nasıl test ediyor?'] },
      { id: 'rm_4', name: '4. Doruk Noktası (Climax)', act: '3. Perde (%85 - %95)', targetPercent: 90, description: 'Kriz anında verilen kararın eyleme dökülmesi ve anlamlı bir değişimin gerçekleşmesi.', guidingQuestions: ['Kriz kararı nasıl patlayıcı bir eyleme dönüşüyor?', 'Değerler (örneğin aşk/nefret, zafer/mağlubiyet) tersine nasıl dönüyor?'] },
      { id: 'rm_5', name: '5. Çözüm (Resolution)', act: '3. Perde (%95 - %100)', targetPercent: 100, description: 'Tüm açık düğümlerin bağlanması, yeni dengenin oturması ve seyirciye veda.', guidingQuestions: ['Doruk noktasından sonra geriye kalan hikaye artıkları nasıl temizleniyor?', 'Yeni dünyada hayat nasıl devam ediyor?'] }
    ]
  },

  // 6. LINDA SEGER - STORY SPINE & B-HİKAYESİ
  {
    id: 'linda_seger_story_spine',
    category: 'film',
    title: 'Linda Seger Story Spine & B-Hikayesi Şablonu',
    subtitle: 'Making a Good Script Great: 5 Steps & B-Story Weaving',
    author: 'Linda Seger',
    badge: '5 Adım & B-Story',
    description: 'A-Hikayesi (olay örgüsü) ile B-Hikayesini (duygusal derinlik) kusursuzca ören senaryo doktorluğu şablonu.',
    defaultPages: 110,
    beats: [
      { id: 'ls_1', name: '1. Kurulum ve Katalizör (Setup & Catalyst)', act: '1. Perde', targetPercent: 12, description: 'Ana karakterin hayatı, ilişkileri ve onu harekete geçiren dönüştürücü katalizör.', guidingQuestions: ['Karakterin statükosundaki çatlak nedir?', 'Katalizör olay karakterin hangi zayıf noktasını vuruyor?'] },
      { id: 'ls_2', name: '2. 1. Dönüm Noktası & B-Hikayesinin Girişi (Turning Point 1 & B-Story)', act: '1. Perde Sonu', targetPercent: 25, description: 'Hikayeyi yeni yöne iten ilk dönüm noktası ve duygusal alt hikayenin başlaması.', guidingQuestions: ['Ana hikayeyi ateşleyen 1. Dönüm Noktası nedir?', 'B-Hikayesini taşıyan kişi (aşk, mentor, rakip) sahneye nasıl giriyor?'] },
      { id: 'ls_3', name: '3. Orta Nokta ve İlişkilerin Derinleşmesi (Midpoint)', act: '2. Perde Orta', targetPercent: 50, description: 'Aksiyonun hızlanması, B-Hikayesindeki ilişkinin derinleşmesi ve risklerin artması.', guidingQuestions: ['Orta noktada A-Hikayesi ile B-Hikayesi nasıl çarpışıyor?', 'Karakterin duygusal bağı hedefini nasıl etkiliyor?'] },
      { id: 'ls_4', name: '4. 2. Dönüm Noktası & İkili Kriz (Turning Point 2)', act: '2. Perde Sonu', targetPercent: 75, description: 'Hem ana hedefin hem de duygusal ilişkinin aynı anda çöktüğü en büyük dönüm noktası.', guidingQuestions: ['Aksiyon planı nasıl iflas ediyor?', 'B-Hikayesindeki ilişki hangi kırılmayla kopma noktasına geliyor?'] },
      { id: 'ls_5', name: '5. Doruk Noktası ve İki Hikayenin Birleşmesi (Climax & Integration)', act: '3. Perde', targetPercent: 95, description: 'B-Hikayesinden öğrenilen sevgi/ders sayesinde A-Hikayesindeki zaferin kazanılması.', guidingQuestions: ['Karakter B-Hikayesinden aldığı hangi güçle ana savaşı kazanıyor?', 'Her iki hikaye çizgisi finalde nasıl organik olarak birleşiyor?'] }
    ]
  },

  // 7. FRANK DANIEL - 8 SEKANS ŞABLONU
  {
    id: 'frank_daniel_8_sequences',
    category: 'film',
    title: 'Frank Daniel 8 Sekans Şablonu',
    subtitle: 'The 8-Sequence Approach (USC Screenwriting Method)',
    author: 'Frank Daniel',
    badge: '8 Sekans',
    description: 'Uzun metrajı her biri 10-15 dakikalık 8 mini-filme bölerek seyirci ilgisini sürekli zinde tutan sekans yaklaşımı.',
    defaultPages: 110,
    beats: [
      { id: 'fd_1', name: 'Sekans 1 (A): Statüko & Tetikleyici Olay', act: '1. Perde (Sayfa 1-15)', targetPercent: 12, description: 'Karakterin tanıtımı, dünyası ve ilk 10-15 dakikadaki tetikleyici şok.', guidingQuestions: ['İlk sekansın ana sorusu nedir?', 'Tetikleyici olay seyirciye nasıl bir kanca atıyor?'] },
      { id: 'fd_2', name: 'Sekans 2 (B): Tereddüt & 1. Kilit Noktası', act: '1. Perde Sonu (Sayfa 15-30)', targetPercent: 25, description: 'Karakterin ikilemi ve 2. Perdeye geçişi sağlayan geri dönüşsüz hamle.', guidingQuestions: ['Karakter neden tereddüt ediyor?', '1. Perde finalinde hangi soru yanıt buluyor ve hangi yeni soru açılıyor?'] },
      { id: 'fd_3', name: 'Sekans 3 (C): Yeni Durum & İlk Engeller', act: '2. Perde A (Sayfa 30-45)', targetPercent: 38, description: 'Yeni dünyanın keşfi ve karakterin ilk planını denerken karşılaştığı zorluklar.', guidingQuestions: ['Karakter yeni ortamda hangi ilk engellere çarpıyor?', 'Bu sekansın mini-hedefi nedir?'] },
      { id: 'fd_4', name: 'Sekans 4 (D): Orta Noktaya Yükseliş & Sahte Zafer', act: '2. Perde A (Sayfa 45-60)', targetPercent: 50, description: 'Orta nokta zirvesine giden yol; büyük bir başarı ya da sarsıcı ifşaat.', guidingQuestions: ['Orta noktada hikayenin yönünü 180 derece değiştiren gelişme ne?', 'Karakter neyi yanlış anladı?'] },
      { id: 'fd_5', name: 'Sekans 5 (E): Sonuçlar, Tepkiler & B Planı', act: '2. Perde B (Sayfa 60-75)', targetPercent: 65, description: 'Orta nokta şokunun ardından toparlanma ve yeni bir taktiğin devreye sokulması.', guidingQuestions: ['Orta noktadaki hatanın faturası nasıl ödeniyor?', 'Yeni strateji ne kadar riskli?'] },
      { id: 'fd_6', name: 'Sekans 6 (F): Ana Kriz & En Düşük Nokta', act: '2. Perde B (Sayfa 75-90)', targetPercent: 75, description: 'B Planının da çökmesi, ekibin dağılması ve her şeyin bittiği an.', guidingQuestions: ['Karakter nasıl en derin umutsuzluğa yuvarlanıyor?', 'Bu sekansın sonunda hangi kıvılcım yeniden yanıyor?'] },
      { id: 'fd_7', name: 'Sekans 7 (G): Yeni Hamle & Final Karşılaşması', act: '3. Perde (Sayfa 90-105)', targetPercent: 90, description: 'Zamana karşı yarış, son planın tatbiki ve büyük doruk noktası yüzleşmesi.', guidingQuestions: ['Zaman baskısı (saatli bomba) nasıl devreye giriyor?', 'Büyük savaş sahnesinde neler yaşanıyor?'] },
      { id: 'fd_8', name: 'Sekans 8 (H): Çözüm, Yeni Hayat & Kapanış', act: '3. Perde (Sayfa 105-115)', targetPercent: 100, description: 'Savaşın ardından yeni dengenin kurulması ve duygusal çözülüş.', guidingQuestions: ['Hikayenin temel sorusunun nihai cevabı nedir?', 'Karakterlerin hayatı hangi noktada son buluyor?'] }
    ]
  },

  // 8. LARRY BROOKS - 18 ADIMLI STORY ENGINEERING
  {
    id: 'larry_brooks_story_engineering',
    category: 'film',
    title: 'Larry Brooks 18 Adımlı "Story Engineering" Modeli',
    subtitle: 'Story Engineering: 4 Milestones, 2 Pinch Points & 18 Beats',
    author: 'Larry Brooks',
    badge: '18 Beat',
    description: 'Dört çeyrek (Setup, Response, Attack, Resolution) ve iki stratejik kıstırma noktası (Pinch Points) ile kusursuz kurgu mühendisliği.',
    defaultPages: 110,
    beats: [
      { id: 'lb_1', name: '1. Çengelleme (The Hook)', act: '1. Çeyrek (Setup)', targetPercent: 2, description: 'Okuru/seyirciyi ilk sayfada yakalayan kurgusal merak unsuru.', guidingQuestions: ['İlk sayfadaki karşı konulamaz soru/merak unsuru nedir?'] },
      { id: 'lb_2', name: '2. Kurulum ve Karakter Tutumu', act: '1. Çeyrek (Setup)', targetPercent: 8, description: 'Karakterin yaşamındaki eksiklik ve iç dünyası.', guidingQuestions: ['Karakterin seyircide empati uyandıran özelliği ne?'] },
      { id: 'lb_3', name: '3. Tetikleyici Olay (Inciting Incident)', act: '1. Çeyrek (Setup)', targetPercent: 12, description: 'Hikayeyi başlatan ilk sarsıntı.', guidingQuestions: ['Karakterin gündelik dünyasına düşen bomba ne?'] },
      { id: 'lb_4', name: '4. Tepki ve Dönüm Noktası 1 Hazırlığı', act: '1. Çeyrek (Setup)', targetPercent: 20, description: 'Tetikleyiciye verilen ilk acemi reaksiyon.', guidingQuestions: ['Karakter bu sarsıntıyı nasıl savuşturmaya çalışıyor?'] },
      { id: 'lb_5', name: '5. Birinci Kilometre Taşı (First Plot Point)', act: '1. Çeyrek Sonu', targetPercent: 25, description: 'Karakterin artık sadece tepki veren (reaktif) moda geçtiği büyük dönüm noktası.', guidingQuestions: ['Geri dönüş köprülerini atan ana gelişme nedir?'] },
      { id: 'lb_6', name: '6. Yeni Gerçekliğe Tepki Verme', act: '2. Çeyrek (Response)', targetPercent: 30, description: 'Karakterin savunmada olduğu, henüz saldırıya geçemediği süreç.', guidingQuestions: ['Karakter korkularıyla nasıl yüzleşmekten kaçıyor?'] },
      { id: 'lb_7', name: '7. Müttefikler ve İlk Direniş', act: '2. Çeyrek (Response)', targetPercent: 35, description: 'Yardım arayışı ve ilk küçük sürtüşmeler.', guidingQuestions: ['Ona kimler destek veriyor?'] },
      { id: 'lb_8', name: '8. 1. Kıstırma Noktası (First Pinch Point)', act: '2. Çeyrek (Response)', targetPercent: 37, description: 'Antagonistin gücünün ve tehdidinin doğrudan seyirciye/karaktere gösterildiği an.', guidingQuestions: ['Antagonistin acımasız gücünü kanıtlayan sahne nedir?'] },
      { id: 'lb_9', name: '9. İkinci Kıstırma Öncesi Tırmanış', act: '2. Çeyrek (Response)', targetPercent: 45, description: 'Orta noktaya yaklaşırken baskının artması.', guidingQuestions: ['Kahraman köşeye sıkıştıkça ne hissediyor?'] },
      { id: 'lb_10', name: '10. İkinci Kilometre Taşı / Orta Nokta (Midpoint)', act: '2. Çeyrek Sonu', targetPercent: 50, description: 'Karakterin kurbandan savaşçıya (reaktiften proaktife) dönüştüğü aydınlanma.', guidingQuestions: ['Karakter pasif kurban rolünden savaşçı rolüne nasıl geçiyor?'] },
      { id: 'lb_11', name: '11. Karşı Saldırıya Geçiş (Attack Phase)', act: '3. Çeyrek (Attack)', targetPercent: 55, description: 'Karakterin inisiyatif alarak düşmana saldırmaya başlaması.', guidingQuestions: ['Kahramanın başlattığı ilk proaktif taarruz nedir?'] },
      { id: 'lb_12', name: '12. 2. Kıstırma Noktası (Second Pinch Point)', act: '3. Çeyrek (Attack)', targetPercent: 62, description: 'Antagonistin beklenmedik ölümcül bir karşı darbe vurması.', guidingQuestions: ['Antagonist kahramanın planını nasıl bozguna uğratıyor?'] },
      { id: 'lb_13', name: '13. Yükselen Çatışma ve Kuşatma', act: '3. Çeyrek (Attack)', targetPercent: 70, description: 'Her iki tarafın da tüm kartlarını açması.', guidingQuestions: ['Çatışma nasıl geri dönülemez bir savaşa evriliyor?'] },
      { id: 'lb_14', name: '14. Üçüncü Kilometre Taşı (Plot Point 2 / All is Lost)', act: '3. Çeyrek Sonu', targetPercent: 75, description: 'Son kriz; çözümü sağlayacak son bilgi kırıntısının elde edilmesi.', guidingQuestions: ['Her şey bitti derken bulunan son hayati bilgi ne?'] },
      { id: 'lb_15', name: '15. Son Savaş Hazırlığı', act: '4. Çeyrek (Resolution)', targetPercent: 82, description: 'Son güçlerin toplanması ve stratejinin kurulması.', guidingQuestions: ['Kahraman ekibini son savaşa nasıl motive ediyor?'] },
      { id: 'lb_16', name: '16. Zirve Mücadele (The Climax)', act: '4. Çeyrek (Resolution)', targetPercent: 92, description: 'Ana sorunun tek ve nihai cevaba kavuştuğu çarpışma.', guidingQuestions: ['Doruk noktasında nihai zafer/kayıp nasıl gerçekleşiyor?'] },
      { id: 'lb_17', name: '17. Çözüm ve Rahatlama (Resolution)', act: '4. Çeyrek (Resolution)', targetPercent: 97, description: 'Savaş sonrası nefes alma ve yaraları sarma.', guidingQuestions: ['Karakterler savaşın ardından birbirlerine ne söylüyor?'] },
      { id: 'lb_18', name: '18. Son Söz ve Kapanış (Final Resonance)', act: '4. Çeyrek Sonu', targetPercent: 100, description: 'Hikayenin ana fikrinin seyircide yankılandığı son veda.', guidingQuestions: ['Seyircinin zihninde kalacak son duygu ve düşünce ne?'] }
    ]
  },

  // 9. DAVID SIEGEL - 9 PERDELİK ŞABLON
  {
    id: 'david_siegel_9_acts',
    category: 'film',
    title: 'David Siegel 9 Perdelik Şablon',
    subtitle: 'The 9-Act Structure for Thrillers & Complex Plots',
    author: 'David Siegel',
    badge: '9 Perde',
    description: 'Özellikle gerilim, gizem ve karmaşık olay örgülü sinema filmlerinde ritmi adım adım tırmandıran 9 perdeli model.',
    defaultPages: 110,
    beats: [
      { id: 'ds_1', name: '1. Perde: Biri (Someone) - Statüko & Karakter', act: '1. Perde', targetPercent: 10, description: 'Karakterin günlük dünyası, çevresi ve mevcut konumu.', guidingQuestions: ['Karakterimiz kimdir ve dünyasındaki düzen nasıldır?'] },
      { id: 'ds_2', name: '2. Perde: Bir Şey İstiyor (Wants Something) - Hedef', act: '2. Perde', targetPercent: 20, description: 'Karakterin yaşamındaki dengeyi bozan ve bir istek uyandıran olay.', guidingQuestions: ['Karakterin aniden tutkuyla istediği somut hedef nedir?'] },
      { id: 'ds_3', name: '3. Perde: Engeller Başlar (Problems Arise)', act: '3. Perde', targetPercent: 35, description: 'Hedefe giden yolda ilk engellerin ve uyarıların belirmesi.', guidingQuestions: ['Yoluna çıkan ilk tehlikeli pürüzler ve uyarı işaretleri neler?'] },
      { id: 'ds_4', name: '4. Perde: Başarısız Olur (Apparent Failure) - Çöküş', act: '4. Perde', targetPercent: 48, description: 'Karakterin ilk denemesinde başarısızlığa uğraması ve yanılması.', guidingQuestions: ['Karakter neden hedefine ulaşamıyor ve nerede yanılıyor?'] },
      { id: 'ds_5', name: '5. Perde: Gizli Gerçek / Orta Nokta (Midpoint Turn)', act: '5. Perde', targetPercent: 55, description: 'Asıl gizli problemin ve gerçek düşmanın ortaya çıkması.', guidingQuestions: ['Olayların arkasındaki asıl büyük komplo veya gizli gerçek nedir?'] },
      { id: 'ds_6', name: '6. Perde: Yeni Girişim (New Effort) - Bilinçli Hamle', act: '6. Perde', targetPercent: 70, description: 'Karakterin gerçeği bilerek başlattığı daha sert ve bilinçli mücadele.', guidingQuestions: ['Gerçeği öğrenen karakter hangi yeni yöntemle saldırıyor?'] },
      { id: 'ds_7', name: '7. Perde: Büyük İmtihan (Major Crisis) - Fedakarlık', act: '7. Perde', targetPercent: 80, description: 'En karanlık an; karakterin her şeyini feda etmek zorunda kalması.', guidingQuestions: ['Karakter kazanmak için hangi en değerli şeyini feda etmek zorunda?'] },
      { id: 'ds_8', name: '8. Perde: Zirve Mücadele (Climax) - Son Çarpışma', act: '8. Perde', targetPercent: 92, description: 'Gerçek düşmanla yüzleşme ve nihai zaferin kazanılması.', guidingQuestions: ['Büyük hesaplaşmada düşman nasıl gafil avlanıyor?'] },
      { id: 'ds_9', name: '9. Perde: Yeni Denge / Sonuç (Resolution)', act: '9. Perde', targetPercent: 100, description: 'Tüm sırların çözülmesi ve yeni hayatın başlaması.', guidingQuestions: ['Karakter bu mücadeleden sonra nasıl biri haline geldi?'] }
    ]
  },

  // 10. ERIC EDSON - 23 ADIMLI "KAHRAMANIN EYLEMLERİ"
  {
    id: 'eric_edson_23_actions',
    category: 'film',
    title: 'Eric Edson 23 Adımlı "Kahramanın Eylemleri" (Hero Goal Sequences)',
    subtitle: 'The Story Map: 21-23 Sekans & Taze Haber (Gravity Örneği)',
    author: 'Eric Edson',
    badge: '23 Eylem',
    description: 'Her biri 2-7 sayfa süren 23 dinamik sekans; her sekansta tek bir fiziksel hedef ve sekans sonu "Taze Haber" (Fresh News) mekaniği (Örn: Gravity - Dr. Ryan Stone\'un istasyonlar arası amansız hedef takibi).',
    defaultPages: 110,
    beats: [
      { id: 'ee_1', name: '1. Başlangıç Durumu & Karakter Kusuru', act: '1. Perde', targetPercent: 4, description: 'Kahramanın hayatındaki eksiklik ve içsel çatışması.', guidingQuestions: ['Kahramanın hayatındaki ana kusur nedir?'] },
      { id: 'ee_2', name: '2. İlk Tehdit / Uyarı (Fresh News 1)', act: '1. Perde', targetPercent: 8, description: 'Yaklaşan fırtınanın ilk habercisi.', guidingQuestions: ['Karakterin dikkatini çeken ilk tehlike nedir?'] },
      { id: 'ee_3', name: '3. Tetikleyici Olay & İtiraz', act: '1. Perde', targetPercent: 12, description: 'Hayatın altüst oluşu ve ilk direnç.', guidingQuestions: ['Hayatını sarsan ana olay nedir?'] },
      { id: 'ee_4', name: '4. İlk Karar & Eyleme Geçiş (Fresh News 2)', act: '1. Perde', targetPercent: 16, description: 'Görevi mecburen kabul etme kararı.', guidingQuestions: ['Onu eyleme geçiren mecburiyet ne?'] },
      { id: 'ee_5', name: '5. Yeni Alana Giriş & Sınır Bekçisi', act: '1. Perde Sonu', targetPercent: 22, description: 'Yeni ortama adım atarken aşılan engel.', guidingQuestions: ['İlk kapıdan nasıl geçiyor?'] },
      { id: 'ee_6', name: '6. Hedef Sekansı 1: Keşif & İlk Bilgi', act: '2. Perde (A)', targetPercent: 27, description: 'Yeni dünyada ilk somut bilginin peşine düşüş.', guidingQuestions: ['İlk bulmak istediği ipucu nedir?'] },
      { id: 'ee_7', name: '7. Hedef Sekansı 2: Müttefik Bulma', act: '2. Perde (A)', targetPercent: 32, description: 'Kendine yardımcı olacak kişiyi ikna etme çabası.', guidingQuestions: ['Müttefiki nasıl yanına çekiyor?'] },
      { id: 'ee_8', name: '8. Hedef Sekansı 3: İlk Tuzağı Aşma', act: '2. Perde (A)', targetPercent: 38, description: 'Düşmanın kurduğu ilk pusudan sıyrılma.', guidingQuestions: ['Pusudan nasıl kurtuluyor?'] },
      { id: 'ee_9', name: '9. Hedef Sekansı 4: İpuçlarını Birleştirme', act: '2. Perde (A)', targetPercent: 44, description: 'Büyük resmin ilk parçalarını çözme.', guidingQuestions: ['Hangi önemli bağlantıyı keşfediyor?'] },
      { id: 'ee_10', name: '10. Hedef Sekansı 5: Orta Nokta Baskını', act: '2. Perde Orta Nokta', targetPercent: 50, description: 'Büyük saldırı ve risklerin ikiye katlanması.', guidingQuestions: ['Orta noktada kim kime baskın yapıyor?'] },
      { id: 'ee_11', name: '11. Hedef Sekansı 6: Kayıpları Telafi', act: '2. Perde (B)', targetPercent: 55, description: 'Orta nokta sonrası zararı azaltma çabası.', guidingQuestions: ['Kayıplarını nasıl onarmaya çalışıyor?'] },
      { id: 'ee_12', name: '12. Hedef Sekansı 7: Yeni Plan Geliştirme', act: '2. Perde (B)', targetPercent: 60, description: 'Daha sert ve riskli yeni bir taktiğe geçiş.', guidingQuestions: ['Yeni planın getirdiği tehlike ne?'] },
      { id: 'ee_13', name: '13. Hedef Sekansı 8: Antagonisti Sıkıştırma', act: '2. Perde (B)', targetPercent: 65, description: 'Düşmanın zayıf noktasına doğrudan hamle.', guidingQuestions: ['Düşmanın açığını nasıl yakalıyor?'] },
      { id: 'ee_14', name: '14. Hedef Sekansı 9: İhanet / Yanlış Yönlendirme', act: '2. Perde (B)', targetPercent: 70, description: 'Beklenmedik bir ihanetle sarsılma.', guidingQuestions: ['Kim arkadan vuruyor?'] },
      { id: 'ee_15', name: '15. Hedef Sekansı 10: Her Şey Bitti Noktası', act: '2. Perde Sonu', targetPercent: 75, description: 'Tüm ümitlerin tükendiği çöküş.', guidingQuestions: ['Her şeyin bittiği an nasıl yaşanıyor?'] },
      { id: 'ee_16', name: '16. Hedef Sekansı 11: İçsel Aydınlanma', act: '3. Perde', targetPercent: 79, description: 'Karakterin küllerinden doğduğu an.', guidingQuestions: ['Ruhundaki uyanış nasıl gerçekleşiyor?'] },
      { id: 'ee_17', name: '17. Hedef Sekansı 12: Son İttifak', act: '3. Perde', targetPercent: 83, description: 'Kalan tüm dostları bir araya getirme.', guidingQuestions: ['Son orduyu nasıl topluyor?'] },
      { id: 'ee_18', name: '18. Hedef Sekansı 13: Kaleye Sızma', act: '3. Perde', targetPercent: 87, description: 'Düşman üssüne gizlice veya zorla giriş.', guidingQuestions: ['Güvenlik hattı nasıl aşılıyor?'] },
      { id: 'ee_19', name: '19. Hedef Sekansı 14: Son Engel', act: '3. Perde', targetPercent: 91, description: 'Baş düşmandan önceki son devasa bariyer.', guidingQuestions: ['Son muhafız nasıl yeniliyor?'] },
      { id: 'ee_20', name: '20. Hedef Sekansı 15: Zirve Düello', act: '3. Perde', targetPercent: 95, description: 'Antagonistle teke tek ölümcül yüzleşme.', guidingQuestions: ['Antagonist nasıl alt ediliyor?'] },
      { id: 'ee_21', name: '21. Hedef Sekansı 16: Hayatta Kalma & Kaçış', act: '3. Perde', targetPercent: 97, description: 'Çöken kaleden son anda kurtulma.', guidingQuestions: ['Yıkımdan nasıl kaçıyor?'] },
      { id: 'ee_22', name: '22. Hedef Sekansı 17: Ödülü Teslim Etme', act: '3. Perde', targetPercent: 99, description: 'Görev sonucunun topluma sunulması.', guidingQuestions: ['Toplum nasıl kurtarılıyor?'] },
      { id: 'ee_23', name: '23. Yeni Denge & Tamamlanış', act: '3. Perde Sonu', targetPercent: 100, description: 'Yeni huzur ve dönüşmüş karakter.', guidingQuestions: ['Karakterin son huzurlu hali nasıldır?'] }
    ]
  },

  // 11. JULE SELBO - 11 ADIMLI KARAKTER MERKEZLİ ŞABLON (WANT VS NEED)
  {
    id: 'jule_selbo_want_need',
    category: 'film',
    title: 'Jule Selbo 11 Adımlı Karakter Merkezli Şablon',
    subtitle: 'Screenplay Story: Want vs. Need & Character Driven Arc',
    author: 'Jule Selbo',
    badge: '11 Adım',
    description: 'Karakterin yüzeydeki somut arzusu (Want) ile ruhunun derin ihtiyacı (Need) arasındaki çatışmayı merkeze alan güçlü karakter draması modeli.',
    defaultPages: 110,
    beats: [
      { id: 'js_1', name: '1. Karakterin Dünyası ve İç Yarası (Ghost / Wound)', act: '1. Perde', targetPercent: 8, description: 'Karakterin geçmişten taşıdığı yara ve oluşturduğu savunma kalkanı.', guidingQuestions: ['Karakterin geçmişte aldığı en büyük duygusal darbe nedir?', 'Bu darbe yüzünden insanlara nasıl mesafeli duruyor?'] },
      { id: 'js_2', name: '2. Dışsal İstek (Want) vs İçsel İhtiyaç (Need) Belirleme', act: '1. Perde', targetPercent: 15, description: 'Karakterin istediğini sandığı şey ile gerçekte ruhunu iyileştirecek şeyin ayrımı.', guidingQuestions: ['Karakter neyi elde ederse mutlu olacağını sanıyor (Want)?', 'Gerçekte iyileşmek için neye muhtaç (Need)?'] },
      { id: 'js_3', name: '3. Tetikleyici Olay ve İsteğin Eyleme Dönüşmesi', act: '1. Perde', targetPercent: 22, description: 'Dışsal olayın karakteri "İstek" peşinde koşmaya zorlaması.', guidingQuestions: ['Karakteri isteğinin peşinden koşturan tetikleyici olay nedir?'] },
      { id: 'js_4', name: '4. Karakterin Yanılsaması (Lie Believed)', act: '1. Perde Sonu', targetPercent: 28, description: 'Karakterin kendi hakkındaki yanlış inancı savunarak yola çıkması.', guidingQuestions: ['Karakter hangi yanlış inançla hareket ediyor?'] },
      { id: 'js_5', name: '5. İlk Çatışmalar ve Sahte Maske', act: '2. Perde (A)', targetPercent: 40, description: 'İsteğe doğru ilerlerken eski alışkanlıkların yarattığı sürtüşmeler.', guidingQuestions: ['Eski kusurları yeni ortamda nasıl krizler yaratıyor?'] },
      { id: 'js_6', name: '6. Orta Nokta - İhtiyacın İlk Işığı (Flicker of Need)', act: '2. Perde Orta Nokta', targetPercent: 50, description: 'Karakterin gerçek ihtiyacını bir anlığına tattığı ve etkilendiği an.', guidingQuestions: ['Karakter gerçek sevgiyi/dürüstlüğü ilk kez nerede tadıyor?', 'Bu durum onu neden korkutuyor?'] },
      { id: 'js_7', name: '7. Maskenin Çatlaması ve Savunmasızlık', act: '2. Perde (B)', targetPercent: 62, description: 'İstek ile İhtiyaç arasındaki gerilimin karakteri yıpratması.', guidingQuestions: ['Karakter neden iki hedef arasında bocalıyor?'] },
      { id: 'js_8', name: '8. En Ağır İmtihan - İstek mi İhtiyaç mı? (The Choice)', act: '2. Perde Sonu', targetPercent: 75, description: 'Karakterin dışsal isteğini elde etmek üzereyken içsel ihtiyacını feda etme eşiğine gelmesi.', guidingQuestions: ['Karakter hedefini seçerse ruhunu nasıl kaybedecek?'] },
      { id: 'js_9', name: '9. Büyük Dönüşüm ve Gerçeğin Kabulü', act: '3. Perde', targetPercent: 85, description: 'Dışsal istekten vazgeçip içsel ihtiyacı (gerçek değerleri) seçme kararı.', guidingQuestions: ['Karakter isteğini (Want) feda edip ihtiyacını (Need) nasıl kucaklıyor?'] },
      { id: 'js_10', name: '10. İhtiyacın Gücüyle Doruk Noktası', act: '3. Perde', targetPercent: 95, description: 'Yeni içsel gücü sayesinde çözümsüz görünen krizin aşılması.', guidingQuestions: ['Ruhsal dönüşümü sayesinde ana problemi nasıl çözüyor?'] },
      { id: 'js_11', name: '11. Tamamlanış ve Yeni Bilinç Düzeyi', act: '3. Perde Sonu', targetPercent: 100, description: 'Karakterin artık bütünleşmiş ve huzurlu bir bireye dönüşmesi.', guidingQuestions: ['Karakter artık dünyayı nasıl farklı görüyor?'] }
    ]
  },

  // 12. RONALD TOBIAS - 20 MASTER PLOT ŞABLONU
  {
    id: 'ronald_tobias_20_plots',
    category: 'film',
    title: 'Ronald Tobias 20 Master Plot Modeli',
    subtitle: '20 Master Plots & Core Archetypal Motors',
    author: 'Ronald Tobias',
    badge: '8 Aşama & 20 Tür',
    description: 'Arayış, İntikam, Kurtarma, Kaçış, Aşk, Başkalaşım gibi 20 temel kurgu arketipinin ortak dramatik motoru.',
    defaultPages: 110,
    beats: [
      { id: 'rt_1', name: '1. Olay Örgüsü Türü & Çekim Gücü (Plot Archetype)', act: '1. Perde', targetPercent: 10, description: '20 Master Plot türünden birinin (örn: Arayış, İntikam, Kurtarma, Yasak Aşk vb.) seçilmesi ve dünyası.', guidingQuestions: ['Hikayenizin ana motoru olan Master Plot türü hangisi (Arayış, İntikam, Kurtarma, Kaçış vb.)?', 'Bu türün ana vaadi nedir?'] },
      { id: 'rt_2', name: '2. Başlangıç Durumu & Kışkırtıcı Dürtü', act: '1. Perde', targetPercent: 20, description: 'Karakteri bu türe özgü yolculuğa iten ahlaki veya fiziksel kıvılcım.', guidingQuestions: ['Karakteri intikam almaya, aramaya veya kaçmaya iten ilk haksızlık ne?'] },
      { id: 'rt_3', name: '3. Birinci Ayrım & Hedef Rotası', act: '1. Perde Sonu', targetPercent: 30, description: 'Karakterin rotasını çizip maceraya resmi olarak başlaması.', guidingQuestions: ['Karakter hedefine ulaşmak için hangi kesin rotaya giriyor?'] },
      { id: 'rt_4', name: '4. Derinleşen Çatışma & Testler', act: '2. Perde (A)', targetPercent: 45, description: 'Türün doğasından kaynaklanan tipik engeller ve ahlaki sınavlar.', guidingQuestions: ['Bu kurgu türünün doğasında olan en zorlu engeller neler?'] },
      { id: 'rt_5', name: '5. Merkez Kriz & Ahlaki İkilem', act: '2. Perde Orta Nokta', targetPercent: 55, description: 'Karakterin peşinde olduğu şeyin gerçek bedelini gördüğü dönüm noktası.', guidingQuestions: ['Peşinde olduğu intikamın, aşkın veya paranın bedeli ne kadar ağırlaşıyor?'] },
      { id: 'rt_6', name: '6. Geri Dönüşsüz Zirve & Ağır Bedel', act: '2. Perde Sonu', targetPercent: 75, description: 'Karakterin bedel ödemeden çıkamayacağı çıkmaz sokak.', guidingQuestions: ['Karakter hangi ağır bedeli ödemek zorunda kalıyor?'] },
      { id: 'rt_7', name: '7. Nihai Karşılaşma & Çözülme', act: '3. Perde', targetPercent: 90, description: 'Kurgu türünün vaat ettiği büyük final yüzleşmesi.', guidingQuestions: ['Master Plot arketipinin beklenen büyük yüzleşmesi nasıl vuku buluyor?'] },
      { id: 'rt_8', name: '8. Yeni Varoluş & Tematik Mesaj', act: '3. Perde Sonu', targetPercent: 100, description: 'Yolculuğun insan doğası hakkında verdiği nihai felsefi ders.', guidingQuestions: ['Bu yolculuk insan doğası hakkında seyirciye ne söylüyor?'] }
    ]
  },

  // 13. JILL CHAMBERLAIN - "NUTSHELL" (ÖZET YAPI) TEKNİĞİ
  {
    id: 'jill_chamberlain_nutshell',
    category: 'film',
    title: 'Jill Chamberlain "Nutshell" (Özet Yapı) Tekniği',
    subtitle: '8 Bağlantılı Eleman: Want vs. Need & Kusur Dönüşümü (Tootsie Örneği)',
    author: 'Jill Chamberlain',
    badge: '8 Elemanlı Nutshell',
    description: 'Yazarların "durum" (situation) yerine gerçek bir "hikaye" kurmasını sağlayan; Karakter Kusuru (Flaw), İstek (Want) ve İhtiyaç (Need) çatışmasını 8 birbirine bağlı halkayla çözen yöntem. (Örn: Tootsie).',
    defaultPages: 110,
    beats: [
      { id: 'nc_1', name: '1. Karakter Kusuru (Flaw)', act: '1. Perde (%0 - %10)', targetPercent: 8, description: 'Karakterin hayatını zorlaştıran ve başkalarına zarar veren temel kusuru (Örn: Tootsie\'de Michael Dorsey\'nin bencil ve uyumsuz tavrı).', guidingQuestions: ['Karakterin hayatını ve ilişkilerini sabote eden temel kişilik kusuru nedir?', 'Bu kusurunu nasıl savunuyor ve haklı görüyor?'] },
      { id: 'nc_2', name: '2. İstek / Yüzeysel Hedef (Want)', act: '1. Perde (%10 - %20)', targetPercent: 15, description: 'Karakterin başlangıçta elde etmek istediği yüzeysel ve somut dışsal amaç (Örn: Bir pembe dizide kadın kılığına girip rol kapmak).', guidingQuestions: ['Karakterin bilinçli olarak arzuladığı somut dış hedef nedir?', 'Bu hedefe ulaşırsa her şeyin düzeleceğini neden sanıyor?'] },
      { id: 'nc_3', name: '3. Tuzak / Kışkırtıcı Fırsat (The Catch)', act: '1. Perde Sonu (%20 - %25)', targetPercent: 25, description: 'İsteğe ulaşmak için kusurlu benliğiyle kabul ettiği ve sonradan başına büyük dert açacak taviz veya yöntem.', guidingQuestions: ['Hedefe ulaşmak için hangi tehlikeli/kusurlu yöntemi seçiyor?', 'Bu yöntem ileride hangi ahlaki düğümü yaratacak?'] },
      { id: 'nc_4', name: '4. İlerleme & Aldatıcı Başarı (Progress)', act: '2. Perde A (%25 - %50)', targetPercent: 40, description: 'Kusurlu yöntemin ilk başta harika çalışması ve hedefin yaklaştığı yanılsaması.', guidingQuestions: ['Kusurlu planı ilk etapta nasıl şaşırtıcı bir başarı getiriyor?', 'Karakter nerede güvende olduğunu zannediyor?'] },
      { id: 'nc_5', name: '5. Orta Nokta Kırılması (Midpoint Turn)', act: '2. Perde Orta Nokta (%50)', targetPercent: 50, description: 'Oyunun kurallarının değiştiği ve karakterin asıl İhtiyacını (Need) ilk kez hissettiği dönüm noktası.', guidingQuestions: ['Orta noktada planı nasıl tersine dönmeye başlıyor?', 'Asıl ihtiyacı olan şeyin (sevgi, dürüstlük, saygı) ilk kıvılcımı nerede parlıyor?'] },
      { id: 'nc_6', name: '6. Büyük Aksilik & Kriz (Major Setback)', act: '2. Perde Sonu (%75)', targetPercent: 75, description: 'Eski kusurlu yöntemin tamamen patlaması; yalanın veya sahte zırhın iflas etmesi.', guidingQuestions: ['Karakterin kurduğu yalan/tuzak nasıl herkesin gözü önünde patlıyor?', 'Tüm planların çöktüğü o dip nokta nasıl gerçekleşiyor?'] },
      { id: 'nc_7', name: '7. İhtiyacın Kucaklanması & Doruk Noktası (The Need Embraced & Climax)', act: '3. Perde (%85 - %95)', targetPercent: 90, description: 'Karakterin yüzeysel İsteğini (Want) bırakıp asıl İhtiyacını (Need - Dürüstlük, Sevgi, Saygı) kucaklayarak zafer kazanması.', guidingQuestions: ['Karakter hangi fedakarlıkla yüzeysel isteğini terk edip gerçek ihtiyacını seçiyor?', 'Büyük doruk noktasında bu içsel değişim nasıl zafere dönüşüyor?'] },
      { id: 'nc_8', name: '8. Çözüm & Dönüşüm (Resolution)', act: '3. Perde Sonu (%95 - %100)', targetPercent: 100, description: 'Kusurunu yenen karakterin yeni, dürüst ve arınmış kimliğiyle huzura ermesi.', guidingQuestions: ['Karakterin dönüşümü çevresindeki dünyayı nasıl iyileştiriyor?', 'Yeni dünyada kurulan dürüst denge nasıldır?'] }
    ]
  },

  // 14. JEFF KITCHEN & WILLIAM T. PRICE - GERİYE DOĞRU NEDEN-SONUÇ TEKNİĞİ
  {
    id: 'jeff_kitchen_reverse_cause_effect',
    category: 'film',
    title: 'Jeff Kitchen: Geriye Doğru Neden-Sonuç Tekniği',
    subtitle: 'Sequence, Proposition, Plot & Reverse Cause and Effect (1908 Ekolü)',
    author: 'Jeff Kitchen & William Thompson Price',
    badge: 'Neden-Sonuç Mühendisliği',
    description: 'Hikayeyi sonundan kurmaya başlayıp geriye doğru her adımda "Buna ne sebep oldu?" sorusuyla inşa eden, gereksiz sahneleri sıfırlayan dramatik mühendislik yöntemi.',
    defaultPages: 110,
    beats: [
      { id: 'jk_1', name: '1. Çıkarım & Merkez İkilem (Proposition & Central Dilemma)', act: 'Yapısal Temel', targetPercent: 10, description: 'Hikayenin kanıtlayacağı temel ahlaki iddia (Proposition) ve çözülmesi gereken ana ikilem.', guidingQuestions: ['Senaryonun kanıtlayacağı temel dramatik önerme/çıkarım nedir?', 'Karakterin çözmek zorunda olduğu merkez ikilem nedir?'] },
      { id: 'jk_2', name: '2. Nihai Sonuç / Bitiş Noktası (The Ultimate Outcome)', act: 'Tersine Başlangıç Noktası', targetPercent: 100, description: 'Hikayenin varacağı nihai nokta; mühendislik buradan geriye doğru örülecektir.', guidingQuestions: ['Hikayenin son karesinde karakter nereye ulaşıyor?', 'Bu nihai sonuca yol açan son olay neydi?'] },
      { id: 'jk_3', name: '3. Doruk Noktasını Tetikleyen Son Sebep (Climax Cause)', act: '3. Perde', targetPercent: 90, description: 'Nihai sonuca yol açan kaçınılmaz son darbe ve "Buna ne sebep oldu?" sorusunun cevabı.', guidingQuestions: ['Doruk noktasındaki patlamayı zorunlu kılan bir önceki eylem neydi?'] },
      { id: 'jk_4', name: '4. Büyük Krizin Nedensel Zinciri (Crisis Causality)', act: '2. Perde Sonu', targetPercent: 75, description: 'Karakteri son savaşa mecbur bırakan büyük çöküşün mantıksal ve geri dönülemez sebebi.', guidingQuestions: ['Büyük krizi kaçınılmaz hale getiren orta nokta hatası neydi?'] },
      { id: 'jk_5', name: '5. Orta Nokta Kırılmasının Sebebi (Midpoint Causality)', act: '2. Perde Orta Nokta', targetPercent: 50, description: 'Karakterin stratejisini değiştirmesine neden olan organik bilgi veya çatışma.', guidingQuestions: ['Orta noktadaki kırılmaya sebep olan ilk perde eylemi neydi?'] },
      { id: 'jk_6', name: '6. 1. Perde Kilidinin Nedensel Bağı (Plot Point 1 Cause)', act: '1. Perde Sonu', targetPercent: 25, description: 'Karakteri sıradan dünyasından çıkaran dışsal baskının sebep-sonuç ilişkisi.', guidingQuestions: ['Karakteri yeni dünyaya adım atmaya mecbur bırakan doğrudan sebep nedir?'] },
      { id: 'jk_7', name: '7. Tetikleyici Olayın Kökeni & Kurulum (Setup & Root Cause)', act: '1. Perde', targetPercent: 12, description: 'Tüm bu domino taşlarını deviren ilk mantıksal kıvılcım.', guidingQuestions: ['Tüm zinciri başlatan ilk kıvılcımın ardındaki kaçınılmaz sebep neydi?'] }
    ]
  },

  // 15. DAN HARMON - HİKAYE ÇEMBERİ (THE STORY CIRCLE / PLOT EMBRYO)
  {
    id: 'dan_harmon_story_circle',
    category: 'film',
    title: 'Dan Harmon Hikaye Çemberi (The Story Circle)',
    subtitle: '8 Aşamalı Dairesel Yapı & Plot Embryo (The Dark Knight Örneği)',
    author: 'Dan Harmon (Community & Rick and Morty)',
    badge: '8 Aşamalı Çember',
    description: 'Joseph Campbell\'ın monomitini her yazarın cebinde taşıyabileceği 8 adımlı pratik bir çembere indirgeyen dairesel model. (Örn: The Dark Knight - Batman\'in konfor alanından çıkışı, Joker\'in kaos dünyası, Rachel\'ın kaybı ve Kara Şövalye dönüşümü).',
    defaultPages: 110,
    beats: [
      { id: 'sc_1', name: '1. You (Sen / Konfor Alanı - Sayfa 1-12)', act: '1. Perde (%0 - %12)', targetPercent: 12, description: 'Karakter kendi tanıdık dünyasında, alışık olduğu konfor alanındadır (Örn: Batman\'in Gotham\'daki statükosu).', guidingQuestions: ['Karakterin mevcut konfor alanı ve günlük rutini nasıldır?', 'Huzurlu görünen dünyasındaki gizli eksiklik nedir?'] },
      { id: 'sc_2', name: '2. Need (İhtiyaç / Arzu - Sayfa 12-25)', act: '1. Perde Sonu (%12 - %25)', targetPercent: 25, description: 'Karakter içten içe bir eksiklik hisseder veya bir şeyi tutkuyla elde etmek ister (Örn: Batman\'in mutlak düzeni sağlama arzusu).', guidingQuestions: ['Karakteri harekete geçiren bastırılamaz içsel arzu veya eksiklik nedir?', 'Mevcut düzeni sürdürmesini imkansız kılan dürtü ne?'] },
      { id: 'sc_3', name: '3. Go (Git / Bilinmeyene Geçiş - Sayfa 25-37)', act: '2. Perde A (%25 - %37)', targetPercent: 37, description: 'Karakter bu arzu peşinde alışık olmadığı, yabancı ve tekinsiz yeni bir dünyaya adım atar (Örn: Joker\'in kuralsız kaos dünyası).', guidingQuestions: ['Karakter konfor alanını terk edip hangi kuralsız/yabancı dünyaya girdi?', 'Bu yeni dünyanın eski dünyadan en büyük farkı ne?'] },
      { id: 'sc_4', name: '4. Search (Ara / Mücadele & Uyum - Sayfa 37-55)', act: '2. Perde A (%37 - %50)', targetPercent: 50, description: 'Yeni dünyanın kurallarına adapte olmaya çalışır, zorlu sınavlar verir ve düşmanı arar.', guidingQuestions: ['Karakter yeni ortamda hangi acemilikleri ve tehlikeli sınavları yaşıyor?', 'Hedefe yaklaşmak için hangi ipuçlarını takip ediyor?'] },
      { id: 'sc_5', name: '5. Find (Bul / Hedefe Ulaşma - Sayfa 55-70)', act: '2. Perde B (%50 - %65)', targetPercent: 65, description: 'Karakter aradığı şeyi nihayet bulur, hedefine ulaşır veya düşmanını köşeye sıkıştırır.', guidingQuestions: ['Karakter aradığı şeyi (veya düşmanını) tam olarak nerede ve nasıl buluyor?', 'Bu zafer anı neden aslında sahte bir güvenlik hissi veriyor?'] },
      { id: 'sc_6', name: '6. Take (Al / Ağır Bedel Ödeme - Sayfa 70-85)', act: '2. Perde Sonu (%65 - %78)', targetPercent: 78, description: 'Elde ettiği şeyin karşılığında çok ağır bir bedel öder veya en değerli varlığını feda eder (Örn: Batman\'in Rachel\'ı kaybetmesi).', guidingQuestions: ['Bu zaferin faturası ne kadar ağır oldu?', 'Karakterin kaybettiği en kıymetli kişi veya inanç nedir?'] },
      { id: 'sc_7', name: '7. Return (Dön / Geri Dönüş - Sayfa 85-98)', act: '3. Perde (%78 - %90)', targetPercent: 90, description: 'Elde ettiği ders ve hazineyle başlangıçtaki tanıdık dünyasına geri döner.', guidingQuestions: ['Karakter eski dünyasına hangi kaçınılmaz gerçekle ve yara ile geri dönüyor?', 'Şehri veya toplumu onu nasıl karşılıyor?'] },
      { id: 'sc_8', name: '8. Change (Değiş / Nihai Dönüşüm - Sayfa 98-110)', act: '3. Perde Sonu (%90 - %100)', targetPercent: 100, description: 'Artık hem içsel hem de dışsal olarak tamamen değişmiştir; yeni varoluşunu sahiplenir (Örn: Batman\'in sessiz bir koruyucu olan "Kara Şövalye"ye dönüşmesi).', guidingQuestions: ['Karakter 1. adımdaki konfor alanındaki kişiden ne kadar farklı birine dönüştü?', 'Hikaye seyirciye hangi güçlü dönüşüm hissiyle veda ediyor?'] }
    ]
  },

  // 16. KISHŌTENKETSU (起承転結) - DOĞU ASYA ANLATI ESTETİĞİ
  {
    id: 'kishotenketsu_4_act',
    category: 'film',
    title: 'Kishōtenketsu (起承転結) 4 Perdeli Anlatı',
    subtitle: 'Çatışmasız Doğu Asya Estetiği & Perspektif Kırılması (Totoro & Parasite Örneği)',
    author: 'Klasik Doğu Asya Ekolü (Qǐ chéng zhuǎn hé)',
    badge: '4 Perde (Ki-Shō-Ten-Ketsu)',
    description: 'Aristotelesçi çatışma yerine kontrast, merak, perspektif kırılması (Twist) ve felsefi sentezle ilerleyen 2000 yıllık kadim Doğu Asya yapısı. (Örn: Komşum Totoro ve Parazit).',
    defaultPages: 110,
    beats: [
      { id: 'kt_1', name: '1. Ki (起 - Giriş / Durum Kurulumu - Sayfa 1-25)', act: '1. Perde (Ki)', targetPercent: 22, description: 'Karakterler, ilişkiler ve mekân tanıtılır, durum kurulur. Büyük bir çatışma başlatılmaz; durumun atmosferi resmedilir (Örn: Parazit\'te ailenin günlük yoksul rutini veya Totoro\'da yeni eve taşınma).', guidingQuestions: ['Hikayenin dünyası ve karakterlerin günlük durumu nasıl bir atmosferle kuruluyor?', 'Seyircide merak uyandıran saf görsel detaylar neler?'] },
      { id: 'kt_2', name: '2. Shō (承 - Gelişme / Derinleşme - Sayfa 25-55)', act: '2. Perde (Shō)', targetPercent: 50, description: 'İlk perdede kurulan durum derinleştirilir, dünya detaylandırılır ve genişletilir. Hikaye organik ve akıcı akar; yapay düşman yoktur (Örn: Parazit\'te tüm ailenin adım adım eve yerleşmesi).', guidingQuestions: ['Durum nasıl daha zengin, eğlenceli veya detaylı bir hale getiriliyor?', 'Karakterler bu ortamda nasıl rahatça hareket ediyor?'] },
      { id: 'kt_3', name: '3. Ten (転 - Döndürme / Twist / Kırılma - Sayfa 55-85)', act: '3. Perde (Ten)', targetPercent: 78, description: 'İlk iki perdeyle doğrudan bağlantısız gibi görünen şok edici yeni bir unsur/durum sahneye girer; türü ve bakış açısını 180 derece büker (Örn: Parazit\'te gizli sığınak kapısının açılması).', guidingQuestions: ['Hikayenin tonunu ve gidişatını tamamen sarsan beklenmedik yeni durum nedir?', 'Bu kırılma seyircinin ilk iki perdeye bakışını nasıl temelden değiştiriyor?'] },
      { id: 'kt_4', name: '4. Ketsu (結 - Sonuç / Sentez & Katarsis - Sayfa 85-110)', act: '4. Perde (Ketsu)', targetPercent: 100, description: 'Üçüncü perdedeki kırılma (Ten) ile ilk iki perdedeki dünya birleştirilir ve derin, felsefi bir senteze/katarsise ulaşılır (Örn: Parazit\'in trajik finali veya Totoro\'nun büyüleyici doğa kucaklaması).', guidingQuestions: ['İlk iki perdenin sıradanlığı ile üçüncü perdenin şoku nasıl anlamlı bir senteze ulaşıyor?', 'Hikaye seyircinin zihninde hangi kalıcı felsefi/duygusal yankıyı bırakıyor?'] }
    ]
  },

  // 17. PAUL CHITLIK - YEDİ NOKTALI YAPI (7-POINT STRUCTURE)
  {
    id: 'paul_chitlik_7_point',
    category: 'film',
    title: 'Paul Chitlik: Yedi Noktalı Yapı (7-Point Structure)',
    subtitle: 'Paul Chitlik (39 Steps to Better Screenwriting - Thelma & Louise ve In & Out Örneği)',
    author: 'Paul Chitlik',
    badge: '7 Noktalı Yapı (39 Steps)',
    description: 'Paul Chitlik\'in "39 Steps to Better Screenwriting" kitabında sunduğu, özellikle Hollywood ve ticari sinemada kusursuz işleyen 7 noktalı dramatik harita. (Örn: Thelma & Louise ve In & Out filmleri).',
    defaultPages: 110,
    beats: [
      { 
        id: 'pc_1', 
        name: '1. Sıradan Hayat (Ordinary Life - Sayfa 1-12)', 
        act: '1. Perde (%0 - %10)', 
        targetPercent: 10, 
        description: 'Karakterin dünyasını, eksikliklerini/kusurlarını ve neden değişmesi gerektiğini görürüz.', 
        guidingQuestions: [
          'Karakterin mevcut dünyası ve sıradan rutini nasıldır?', 
          'Karakterin hayatında neden kesin ve acil bir değişime ihtiyaç var?'
        ] 
      },
      { 
        id: 'pc_2', 
        name: '2. Kışkırtıcı Olay (Inciting Incident - Sayfa 12-18)', 
        act: '1. Perde (%10 - %15)', 
        targetPercent: 15, 
        description: 'Karakteri karar almaya ve eyleme geçmeye zorlayan dışsal bir kırılma.', 
        guidingQuestions: [
          'Karakterin dengesini bozan ve onu seçim yapmaya zorlayan olay nedir?', 
          'Bu olay sıradan hayatın kapısını nasıl kapatıyor?'
        ] 
      },
      { 
        id: 'pc_3', 
        name: '3. Hedef ve Plan (Goal & Plan - Sayfa 25-30)', 
        act: '1. Perde Sonu / 2. Perdeye Geçiş (%25)', 
        targetPercent: 25, 
        description: 'Birinci perdenin sonunda karakterin netleşen fiziksel hedefi ve bu hedefi başarmak için kurduğu somut plan.', 
        guidingQuestions: [
          'Karakterin 1. perdenin sonunda kilitlendiği net fiziksel hedef nedir?', 
          'Hedefine ulaşmak için uygulamaya koyduğu ilk strateji/plan nedir?'
        ] 
      },
      { 
        id: 'pc_4', 
        name: '4. Orta Nokta (Midpoint / Büyük Farkındalık - Sayfa 55 civarı)', 
        act: '2. Perde Orta Nokta (%50)', 
        targetPercent: 50, 
        description: 'Karakterin kendisi hakkındaki büyük farkındalığı; "İçimdeki bu kusuru (flaw) aşmalıyım" diyerek hedefinin veya eyleminin yönünü kökten değiştirmesi.', 
        guidingQuestions: [
          'Karakter orta noktada kendi içindeki hangi büyük kusuru (flaw) fark ediyor?', 
          'Bu farkındalık planın ve eylemlerin yönünü nasıl 180 derece değiştiriyor?'
        ] 
      },
      { 
        id: 'pc_5', 
        name: '5. En Düşük Nokta (All Is Lost / Çöküş ve Hatırlama - Sayfa 75-85)', 
        act: '2. Perde Sonu (%75)', 
        targetPercent: 75, 
        description: 'Planın tamamen çöktüğü, her şeyin bittiği an. Ancak burada karakter bir dış tetikleyiciyle hedefini yeniden hatırlar.', 
        guidingQuestions: [
          'Plan nasıl tamamen çöküyor ve karakter her şeyini kaybediyor?', 
          'Onu ayağa kaldıran ve asıl hedefini hatırlatan dışsal tetikleyici/işaret nedir?'
        ] 
      },
      { 
        id: 'pc_6', 
        name: '6. Son Mücadele (Final Challenge / Climax - Sayfa 85-100)', 
        act: '3. Perde (%90)', 
        targetPercent: 90, 
        description: 'Engelleri ve düşmanı aşmak için yapılan o en büyük, nihai ve cesur hamle.', 
        guidingQuestions: [
          'Karakter nihai hedefine ulaşmak için hangi son ve en büyük mücadeleye girişiyor?', 
          'Orta noktada edindiği içsel farkındalığı bu çatışmada nasıl kullanıyor?'
        ] 
      },
      { 
        id: 'pc_7', 
        name: '7. Sonsuz Değişim (Change / Aftermath - Sayfa 100-110)', 
        act: '3. Perde Sonu (%100)', 
        targetPercent: 100, 
        description: 'Karakterin hayatının ve kişiliğinin bir daha asla eskisi gibi olmayacağının, kalıcı dönüşümünün gösterilmesi.', 
        guidingQuestions: [
          'Karakterin hayatının bir daha asla eskisi gibi olmayacağını gösteren son an nedir?', 
          'Bu nihai dönüşüm izleyicide nasıl bir yankı bırakıyor?'
        ] 
      }
    ]
  },

  // ==========================================
  // GELENEKSEL DİZİ / TV ŞABLONLARI (11 MODEL)
  // ==========================================

  // SAVE THE CAT! TV PILOT ŞABLONU (15 BEAT - TV DRAMA & STREAMING)
  {
    id: 'save_the_cat_tv_pilot',
    category: 'series',
    title: 'Save the Cat! TV Pilot Şablonu',
    subtitle: 'Save the Cat! Writes for TV: 15 Beat TV Pilot Yapısı & Dizi Motoru',
    author: 'Blake Snyder & Jamie Nash Ekolü',
    badge: '15 Beat TV Pilot (60 Sayfa)',
    description: 'Blake Snyder\'ın efsanevi 15 beat yapısının 1 saatlik televizyon ve streaming pilotlarına uyarlanmış hali. Teaser\'dan Dizi Motoru ve Tag\'e kadar diziye özel dramatik kırılmalar.',
    defaultPages: 60,
    beats: [
      // ACT I: OLAĞAN DÜNYA / TEZ (%1 - %20)
      {
        id: 'stc_tv_1',
        name: '1. Opening Image (Açılış Görüntüsü / Teaser - %0-1)',
        act: '1. Perde / Tez (Sayfa 1)',
        targetPercent: 1,
        description: 'TV pilotlarında Teaser veya Cold Open sahnemizdir. Seyirciyi ilk saniyede yakalayan (hook) görsel ve tematik kanca; karakterin/dünyanın dönüşümden önceki "öncesi" resmidir (Örn: Stranger Things laboratuvar canavar saldırısı).',
        guidingQuestions: [
          'İlk 1-2 dakikada seyirciyi ekrana kitleyecek görsel ve tematik şok kancası (hook) nedir?',
          'Karakterin veya evrenin dönüşümden önceki "öncesi" hali nasıl resmediliyor?'
        ]
      },
      {
        id: 'stc_tv_2',
        name: '2. Theme Stated (Temanın Belirtilmesi - %5)',
        act: '1. Perde / Tez (Sayfa 3-5)',
        targetPercent: 5,
        description: 'Genellikle yan bir karakterin ana kahramanın yüzüne söylediği, kahramanın o an anlamadığı ama tüm dizinin/sezonun felsefi omurgasını oluşturan önermedir. Kusuru (flaw) ve içsel ihtiyacı (need) işaret eder.',
        guidingQuestions: [
          'Dizinin felsefi omurgasını oluşturan ve kahramanın yüzüne söylenen tema cümlesi nedir?',
          'Bu önerme kahramanın hangi temel kusurunu (flaw) ve içsel ihtiyacını (need) kaşıyor?'
        ]
      },
      {
        id: 'stc_tv_3',
        name: '3. Set-Up (Kurulum & Durgunluk = Ölüm - %1-10)',
        act: '1. Perde / Tez (Sayfa 1-6)',
        targetPercent: 10,
        description: 'Kahramanın A-Hikayesi dünyası ve en önemlisi "Durgunluk = Ölüm" (Stasis = Death) hali sergilenir. Pilotun kilit yan karakterleri (ensemble cast) tanıtılır ve gelecekteki çatışmaların tohumları ekilir.',
        guidingQuestions: [
          'Kahraman bu şekilde yaşamaya devam ederse neden mecazi veya fiziksel olarak yok olacak (Stasis = Death)?',
          'Ensemble kadrodaki kilit yan karakterler ve aralarındaki potansiyel sürtünmeler nasıl kuruluyor?'
        ]
      },
      {
        id: 'stc_tv_4',
        name: '4. Catalyst (Katalizör / Kışkırtıcı Olay - %10)',
        act: '1. Perde / Tez (Sayfa 6-10)',
        targetPercent: 10,
        description: 'Kahramanın sıradan dünyasını altüst eden geri çevrilemez dışsal olaydır. Dizi boyunca sürecek olan ana gizemi veya problemi ateşler (Örn: Stranger Things\'te Will Byers\'ın kaçırılması).',
        guidingQuestions: [
          'Kahramanın sıradan dünyasını yıkan ve dizi boyunca sürecek gizemi başlatan olay nedir?',
          'Bu olay kahramanı nasıl geri dönüşü olmayan bir mecburiyete sokuyor?'
        ]
      },
      {
        id: 'stc_tv_5',
        name: '5. Debate (Tartışma / Dizi Motoru Sınavı - %10-20)',
        act: '1. Perde / Tez (Sayfa 10-12)',
        targetPercent: 20,
        description: 'Kahramanın ve çevresindekilerin krize direndiği "Ben bu işe girmeli miyim?" aşamasıdır. TV pilotlarında "Bu karakterin haftalarca/yıllarca sürecek bu serüveni sürdürebilecek dizi motoru var mı?" (franchise question) testine dönüşür.',
        guidingQuestions: [
          'Kahraman bu maceraya/suça/göreve girmemek için hangi bahanelerle direniyor?',
          'Dizinin yıllarca sürmesini sağlayacak temel franchise sorusu ve dizi motoru burada nasıl test ediliyor?'
        ]
      },
      {
        id: 'stc_tv_6',
        name: '6. Break into 2 / Break into the Series (Diziye Geçiş - %20)',
        act: '1. Perde Sonu / 2. Perdeye Geçiş (Sayfa 12-15)',
        targetPercent: 20,
        description: 'Kahramanın proaktif bir kararla bilinmeyen, tekinsiz "Tersine Dünya"ya (Antitez) adım atmasıdır. Sinemada 2. perdeye geçiştir; TV\'de doğrudan "Dizinin Başladığı An"dır (Break into the Series).',
        guidingQuestions: [
          'Kahraman hangi geri dönüşsüz, proaktif kararı alarak dizinin asıl motorunu çalıştırıyor?',
          'Eski güvenli dünya ile yeni tekinsiz dünya arasındaki sınır nasıl aşılıyor?'
        ]
      },

      // ACT II: TERSİNE DÜNYA / ANTİTEZ (%20 - %80)
      {
        id: 'stc_tv_7',
        name: '7. B Story (B Hikayesi & The Blend - %22)',
        act: '2. Perde / Antitez (Sayfa 15-18)',
        targetPercent: 22,
        description: 'Kahramana temanın felsefi dersini öğretecek mentor, aşk ilgisi veya yeni ortağın dahil olması. TV\'de yan karakterleri (ensemble) derinleştiren ve ana olayla örülen çoklu kanallardır (The Blend).',
        guidingQuestions: [
          'Kahramana felsefi dersi verecek olan B-hikayesi karakteri (mentor, aşk, yeni ortak) kimdir?',
          'Yan karakterlerin (ensemble) hikayeleri ana olay örgüsüne nasıl ustalıkla örülüyor (The Blend)?'
        ]
      },
      {
        id: 'stc_tv_8',
        name: '8. Fun and Games (Oyun ve Eğlence / Konseptin Vaadi - %20-50)',
        act: '2. Perde / Antitez (Sayfa 18-30)',
        targetPercent: 50,
        description: 'Dizinin fragmanına veya afişine koyacağınız ikonik sahnelerin yaşandığı yerdir (Promise of the Premise). Kahraman yeni dünyanın kurallarını öğrenirken bocalar; seyirci diziyi izleme gerekçesini burada deneyimler.',
        guidingQuestions: [
          'Dizinin afişine ve fragmanına girecek o en eğlenceli/gerilimli konsept sahneleri (Promise of the Premise) neler?',
          'Kahraman yeni dünyanın tuhaf kurallarıyla boğuşurken hangi sınavları veriyor?'
        ]
      },
      {
        id: 'stc_tv_9',
        name: '9. Midpoint (Orta Nokta / Sahte Zafer & Ticking Clock - %50)',
        act: '2. Perde / Antitez (Sayfa 30-35)',
        targetPercent: 50,
        description: 'Sahte Zafer veya Sahte Yenilgi anıdır. Riskler aniden katlanır, geri dönüş köprüleri havaya uçar. TV pilotlarında genellikle zamana karşı yarış (ticking clock) başlar veya en büyük reklam/akt kırılması patlar.',
        guidingQuestions: [
          'Orta noktada yaşanan sahte zafer (False Victory) veya sahte hezimet (False Defeat) nedir?',
          'Tansiyonu tavan yaptıran ve zamana karşı yarışı (ticking clock) başlatan kırılma nedir?'
        ]
      },
      {
        id: 'stc_tv_10',
        name: '10. Bad Guys Close In (Kötüler Yaklaşıyor & İçsel İblisler - %50-75)',
        act: '2. Perde / Antitez (Sayfa 35-45)',
        targetPercent: 75,
        description: 'Dışsal düşmanların (antagonistler, polis) ve içsel iblislerin (şüphe, kıskançlık, kusurlar) çemberi kahramanın etrafında daraltması. B Hikayesi çatırdar, ekip içi güven sarsılır.',
        guidingQuestions: [
          'Düşmanlar ve sistem kahramanı nasıl köşeye sıkıştırıyor?',
          'Ekip içindeki güven nasıl çatlıyor ve kahramanın içsel kusurları durumu nasıl felakete sürüklüyor?'
        ]
      },
      {
        id: 'stc_tv_11',
        name: '11. All Is Lost (Her Şey Kaybedildi & Whiff of Death - %75)',
        act: '2. Perde / Antitez (Sayfa 45-48)',
        targetPercent: 75,
        description: 'Kahramanın en dip noktasıdır (Rock Bottom). Başlangıçtaki "Durgunluk = Ölüm" kokusu (Whiff of Death) geri döner; kahraman mecazi veya gerçek bir kayıp yaşar (delil yok olur, ortak ayrılır, kovulur).',
        guidingQuestions: [
          'Kahramanın her şeyini kaybettiği ve çaresiz kaldığı o mutlak dip anı (Rock Bottom) nedir?',
          'Hangi somut veya mecazi ölüm/kayıp (Whiff of Death) yaşanıyor?'
        ]
      },
      {
        id: 'stc_tv_12',
        name: '12. Dark Night of the Soul (Ruhun Karanlık Gecesi - %75-85)',
        act: '2. Perde / Antitez (Sayfa 48-52)',
        targetPercent: 85,
        description: 'Kahramanın çaresizlik içinde karanlığıyla ve inançsızlığıyla baş başa kaldığı depresif içsel çöküştür. "Ben kimim ki bunu başaracağım?" dediği ve eski benliğinin tamamen öldüğü kriz noktasıdır.',
        guidingQuestions: [
          'Kahraman tek başına kaldığında kendi yetersizliği ve suçluluğuyla nasıl yüzleşiyor?',
          'Eski düşünce biçiminin tamamen ölmesi ve teslimiyet nasıl tasvir ediliyor?'
        ]
      },

      // ACT III: SENTEZ (%85 - %100)
      {
        id: 'stc_tv_13',
        name: '13. Break into 3 (3. Perdeye Geçiş / Aydınlanma & Yeni Fikir - %85)',
        act: '3. Perde / Sentez (Sayfa 52-54)',
        targetPercent: 85,
        description: 'B Hikayesinden öğrenilen felsefi ders veya gözden kaçan küçük bir ipucu sayesinde kahramanın aklında şimşek çakmasıdır (The Epiphany). Karakter bu yeni bilinçle son bir nihai hamle planlar.',
        guidingQuestions: [
          'B-Hikayesinden veya geçmişteki bir detaydan doğan o büyük aydınlanma (Epiphany) nedir?',
          'Kahraman tez ve antitezi birleştirerek hangi yeni çözüm planını kuruyor?'
        ]
      },
      {
        id: 'stc_tv_14',
        name: '14. Finale (Final / Pilot Hesaplaşması & Yeni Statüko - %85-99)',
        act: '3. Perde / Sentez (Sayfa 54-58)',
        targetPercent: 99,
        description: 'Pilot bölümün ana çatışmasının zirveye ulaşıp çözüldüğü andır. Kahraman öğrendiği dersi uygulayarak pilot krizini aşar. TV finalleri kapıyı tamamen kapatmaz; yeni bir "Statüko" kurar (The New Normal).',
        guidingQuestions: [
          'Pilot bölümün büyük hesaplaşması nasıl çözülüyor ve kahraman dersini nasıl uyguluyor?',
          'Dizinin geleceğini garantileyen yeni "Normal" (The New Normal) nasıl kuruluyor?'
        ]
      },
      {
        id: 'stc_tv_15',
        name: '15. Final Image (Son Görüntü / Tag & Değişim Kokusu - %100)',
        act: '3. Perde / Sentez (Sayfa 59-60)',
        targetPercent: 100,
        description: '1. beat olan "Açılış Görüntüsü"nün tam zıttı veya onun dönüştüğünü kanıtlayan ayna görüntüsüdür (Whiff of Change). Seyirciye dizinin nereye gideceğini fısıldayan ve sonraki bölümleri izleme arzusu uyandıran nihai mühürdür.',
        guidingQuestions: [
          'Açılış görüntüsüne ayna tutan ve dünyadaki/karakterdeki değişimi (Whiff of Change) kanıtlayan son kare nedir?',
          'Seyirciyi 2. bölümü izlemek için sabırsızlandıran o nihai dizi kapanış mühürü nedir?'
        ]
      }
    ]
  },

  // 13. DANIEL CALVISI - "BENCHMARK 1-HOUR PILOT" (5 AKTLI YAPI)
  {
    id: 'tv_calvisi_5_act_pilot',
    category: 'series',
    title: 'Daniel Calvisi "Benchmark 1-Hour Pilot"',
    subtitle: '5 Aktlı ABD TV Pilot Standardı (Teaser + 5 Act - Story Maps)',
    author: 'Daniel Calvisi',
    badge: '5 Akt Pilot (60 Sayfa)',
    description: 'ABD televizyonculuğunda kabul gören, belirli sayfa aralıklarıyla 5 akt ve 1 kanca sahnesine (Teaser) dayanan endüstri standardı 1 saatlik pilot şablonu.',
    defaultPages: 60,
    beats: [
      { id: 'dcp_1', name: 'Teaser / Giriş & Kanca (Sayfa 2-10)', act: 'Teaser (Sayfa 2-10)', targetPercent: 15, description: 'Dünyayı ve konsepti tanıtır; izleyiciyi ekran başında tutacak ilk krizi veya ilgi çekici durumu kurar.', guidingQuestions: ['İlk 5-8 sayfada seyirciyi ekrana çivileyecek görsel/dramatik şok kancası nedir?', 'Pilotun ana dünyası nasıl kuruluyor?'] },
      { id: 'dcp_2', name: 'Act One: İkilemin Derinleşmesi & Hedef (Sayfa 12-15)', act: 'Act One (Sayfa 12-15)', targetPercent: 25, description: 'Karakterlerin temel ikilemi derinleşir, pilot bölümün somut ana hedefi belirlenir.', guidingQuestions: ['Karakterin bu bölümde çözmek zorunda olduğu net fiziksel hedef nedir?', 'Statükoyu yıkan kırılma ne?'] },
      { id: 'dcp_3', name: 'Act Two: Yeni Dünyaya Adım & Engeller (Sayfa 16-30)', act: 'Act Two (Sayfa 16-30)', targetPercent: 50, description: 'Kahraman yeni dünyaya adım atar, ilk büyük engellerle yüzleşmeye başlar.', guidingQuestions: ['Karakter yeni ortamda hangi ilk zorlu kurallarla çarpışıyor?', 'B-Hikayesi devreye nasıl giriyor?'] },
      { id: 'dcp_4', name: 'Act Three: Tansiyon Tırmanışı & Orta Nokta (Sayfa 31-40)', act: 'Act Three (Sayfa 31-40)', targetPercent: 66, description: 'Engeller tırmanır, tansiyon yükselir, oyunun kuralları ve riskler ikiye katlanır.', guidingQuestions: ['3. Aktın sonunda tansiyonu tepeye fırlatan orta nokta kırılması nedir?', 'Hangi beklenmedik sır ortaya çıkıyor?'] },
      { id: 'dcp_5', name: 'Act Four: En Düşük Nokta / Çöküş (Sayfa 41-48)', act: 'Act Four (Sayfa 41-48)', targetPercent: 80, description: 'Kahramanın her şeyi kaybettiği, umutların tükendiği en düşük nokta (All is Lost).', guidingQuestions: ['Kahramanın elindeki tüm kozlar nasıl tükeniyor?', 'Sevdiklerini korumak için hangi çaresiz kararı alıyor?'] },
      { id: 'dcp_6', name: 'Act Five: Büyük Hesaplaşma & Cliffhanger (Sayfa 49-60)', act: 'Act Five (Sayfa 49-60)', targetPercent: 100, description: 'Büyük hesaplaşma, yüzleşme ve bir sonraki bölüme veya sezona kapı aralayan ucu açık cliffhanger.', guidingQuestions: ['Pilot bölümün ana davası nasıl sonuçlanıyor?', 'Seyirciyi 2. bölümü izlemek zorunda bırakan son sahnedeki şok edici sezon kancası nedir?'] }
    ]
  },

  // 14. JEN GRISANTI - 1 SAATLİK DRAMA ŞABLONU (6 AKTLI YAPI)
  {
    id: 'tv_grisanti_6_act_drama',
    category: 'series',
    title: 'Jen Grisanti 1 Saatlik Drama Şablonu',
    subtitle: '6 Aktlı Dinamik TV Formülü & İkilem (Dilemma) Modeli',
    author: 'Jen Grisanti',
    badge: '6 Akt Drama',
    description: 'Her akt sonunda tematik rezonans ve kriz üreten, A-B-C hikaye ikilemleriyle örülü modern 6 aktlık televizyon draması yapısı.',
    defaultPages: 60,
    beats: [
      { id: 'jg6_1', name: 'Cold Open / Temel İkilemler (Dilemma)', act: 'Cold Open', targetPercent: 10, description: 'A, B ve bazen de C hikayesindeki temel ikilemlerin (dilemma) kurulması.', guidingQuestions: ['Karakteri ahlaki bir seçim yapmak zorunda bırakan açılış ikilemi nedir?', 'İkilem karakterin içsel yarasına nasıl dokunuyor?'] },
      { id: 'jg6_2', name: 'Act I: Hedeflerin Kurulması & İlk Engel', act: 'Act I', targetPercent: 25, description: 'Ana karakterlerin somut hedeflerinin belirlenmesi, ilk adımlar ve A hikayesindeki ilk büyük engelin belirmesi.', guidingQuestions: ['Karakter hedefe doğru adım atarken karşısına dikilen ilk büyük bariyer ne?'] },
      { id: 'jg6_3', name: 'Act II: Engellerin Tırmanması', act: 'Act II', targetPercent: 42, description: 'A hikayesindeki engellerin tırmanması veya yeni engellerin ortaya çıkışı.', guidingQuestions: ['İlk plan çökerken tehlike nasıl iki katına çıkıyor?', 'Yan karakterler hedefe nasıl köstek oluyor?'] },
      { id: 'jg6_4', name: 'Act III: Çarpışan Hedefler & Orta Nokta', act: 'Act III', targetPercent: 60, description: 'A ve B hikayelerinin çatışması; karakterin kişisel hayatıyla mesleki görevinin çarpışması.', guidingQuestions: ['Karakterin özel hayatındaki sır görevi nasıl baltalıyor?', 'Orta noktada kartlar nasıl yeniden dağıtılıyor?'] },
      { id: 'jg6_5', name: 'Act IV: Büyük Risk & Tehlike (Jeopardy)', act: 'Act IV', targetPercent: 78, description: 'Karakterin veya sevdiklerinin büyük bir hayati/mesleki tehlike (jeopardy) altında kalması.', guidingQuestions: ['4. Aktın sonunda karakter nasıl ölümle veya yok oluşla burun buruna geliyor?'] },
      { id: 'jg6_6', name: 'Act V: En Dip Nokta & Son Hamle', act: 'Act V', targetPercent: 90, description: 'Tüm umutların bittiği an ve son fedakarlık hamlesinin planlanması.', guidingQuestions: ['Karakter son gücünü nereden buluyor ve müttefiklerini nasıl ikna ediyor?'] },
      { id: 'jg6_7', name: 'Act VI: Büyük Çözüm & Tematik Rezonans', act: 'Act VI', targetPercent: 100, description: 'Büyük hesaplaşma, bölümün çözümü ve başlangıçtaki ikilemle tematik yankı oluşturan kapanış.', guidingQuestions: ['Kapanış anı açılıştaki ikileme nasıl felsefi bir yanıt veriyor?'] }
    ]
  },

  // 15. KLASİK 2-AKTLI SITCOM ŞABLONU (Jurgen Wolff & Carl Sautter)
  {
    id: 'tv_wolff_sautter_2_act_sitcom',
    category: 'series',
    title: 'Klasik 2-Aktlı Sitcom Şablonu',
    subtitle: 'Jurgen Wolff & Carl Sautter (Friends, Golden Girls Modeli)',
    author: 'Jurgen Wolff & Carl Sautter',
    badge: '2 Akt Sitcom (30 Sayfa)',
    description: 'Tek bir büyük reklam arası içeren, krizin 1. aktın sonunda zirve yaptığı geleneksel 2 aktlık stüdyo sitcomu yapısı.',
    defaultPages: 30,
    beats: [
      { id: 'ws_1', name: 'Teaser / Soğuk Açılış (İsteğe Bağlı - Sayfa 1-3)', act: 'Teaser (Sayfa 1-3)', targetPercent: 10, description: 'Bölümün ana konusuyla doğrudan ilişkili olmak zorunda olmayan, bağımsız komik açılış sahnesi.', guidingQuestions: ['Karakterlerin absürt mizacını sergileyen 2 dakikalık komedi skeci nedir?'] },
      { id: 'ws_2', name: '1. Akt: Problem, Komplikasyonlar & Kriz (Sayfa 4-15)', act: 'Act One (Sayfa 4-15)', targetPercent: 50, description: 'Karakterler, asıl problem ve ilk komplikasyonlar tanıtılır; reklam arasından hemen önce en büyük kriz/rezillik patlar.', guidingQuestions: ['Ana karakter hangi küçük sorunu örtbas etmeye çalışırken durumu devasa bir krize dönüştürüyor?', 'Reklam öncesi patlayan kriz ne?'] },
      { id: 'ws_3', name: '2. Akt: Yanlış Anlaşılmalar & Çözüm (Sayfa 16-27)', act: 'Act Two (Sayfa 16-27)', targetPercent: 90, description: 'Karakterler komplikasyonlarla mücadele eder, yanlış anlaşılmalar tırmanır ve nihayetinde problem beklenmedik şekilde çözülür.', guidingQuestions: ['Yanlış anlaşılmalar nasıl zincirleme komediye dönüşüyor ve nasıl tatlıya bağlanıyor?'] },
      { id: 'ws_4', name: 'Tag / Epilogue (Kapanış Esprisi - Sayfa 28-30)', act: 'Tag (Sayfa 28-30)', targetPercent: 100, description: 'Olay çözüldükten sonra jenerik öncesinde veya sırasında yayınlanan kısa, komik kapanış sahnesi.', guidingQuestions: ['Bölümün konusuna eğlenceli bir nokta koyan son mini espri nedir?'] }
    ]
  },

  // 16. JEN GRISANTI - 3-AKTLI SITCOM ŞABLONU
  {
    id: 'tv_grisanti_3_act_sitcom',
    category: 'series',
    title: 'Jen Grisanti 3-Aktlı Modern Sitcom',
    subtitle: 'Cold Open + 3 Perde + Tag (Dramatik Komedi Mimarisi)',
    author: 'Jen Grisanti',
    badge: '3 Akt Modern Sitcom',
    description: 'Komedilerin dramatik yapılara daha çok yaklaştığı modern dönem için tasarlanan 3 aktlık ve risk (jeopardy) odaklı sitcom şablonu.',
    defaultPages: 30,
    beats: [
      { id: 'jg3_1', name: 'Cold Open: Dünya & Konsept (0-3. Dakika)', act: 'Cold Open', targetPercent: 10, description: 'Dünyanın, karakterlerin ve bölümün konseptinin kurulması.', guidingQuestions: ['Bu bölümdeki komik durumun fitilini ateşleyen ilk sahne nedir?'] },
      { id: 'jg3_2', name: 'Act I: İkilemler & İlk Engel (4-10. Dakika)', act: 'Act I', targetPercent: 35, description: 'A ve B hikayelerindeki ikilemlerin kurulması; akt sonunda A hikayesindeki hedefe yönelik ilk engelin çıkması.', guidingQuestions: ['Karakterlerin hedeflerinin önüne dikilen ilk komik engel nedir?'] },
      { id: 'jg3_3', name: 'Act II: Engellerin Çarpışması & Tehlike/Risk (11-22. Dakika)', act: 'Act II', targetPercent: 75, description: 'A ve B hikayelerinin çarpışması; akt sonunda karakterin büyük bir itibar/ilişki riski (jeopardy) altında kalması.', guidingQuestions: ['Karakterin tüm yalanlarının ortaya çıkma tehlikesiyle yüz yüze geldiği an hangisi?'] },
      { id: 'jg3_4', name: 'Act III: Engellerin Aşılması & Çözüm (23-28. Dakika)', act: 'Act III', targetPercent: 92, description: 'Engellerin aşılması ve her bir hikayenin (özellikle A hikayesinin) çözüme kavuşturulması.', guidingQuestions: ['Karakterler rezil olmadan veya gerçeği kabul ederek durumu nasıl kurtarıyor?'] },
      { id: 'jg3_5', name: 'Tag: Kapanış Esprisi (29-30. Dakika)', act: 'Tag', targetPercent: 100, description: 'Önceki hikayelerden bir unsuru veya C koşucusunu alıp genişleten kısa kapanış sahnesi.', guidingQuestions: ['Seyirciyi tebessümle uğurlayan son tag esprisi nedir?'] }
    ]
  },

  // 17. YARIM SAATLİK KABLO / DİJİTAL DRAMEDY (Grisanti & Landau)
  {
    id: 'tv_cable_digital_dramedy',
    category: 'series',
    title: 'Yarım Saatlik Kablo / Dijital Dramedy Şablonu',
    subtitle: 'Kesintisiz 6 Aşamalı Organik Model (Fleabag, Barry Tarzı)',
    author: 'Jen Grisanti & Neil Landau',
    badge: 'Dramedy (Reklamsız)',
    description: 'Reklam arası olmayan, kesintisiz akan ve sinematik roman tadında ilerleyen yarım saatlik dramedi formülü (İkilem -> Hedef -> İlk Engel -> Tırmanan Engel -> Dönüm Noktası -> Çözüm).',
    defaultPages: 30,
    beats: [
      { id: 'cdd_1', name: '1. Aşama: İkilemin Kurulması (Dilemma)', act: 'Açılış', targetPercent: 15, description: 'Karakterin iç dünyasındaki derin ahlaki veya duygusal ikilem.', guidingQuestions: ['Karakterin içinde debelendiği acı-tatlı ikilem nedir?'] },
      { id: 'cdd_2', name: '2. Aşama: İkilemden Doğan Hedef (Goal)', act: 'İlk Çeyrek', targetPercent: 30, description: 'Bu ikilemi aşmak veya örtmek için belirlediği somut hedef.', guidingQuestions: ['Karakter bu ikilem yüzünden hangi eyleme girişiyor?'] },
      { id: 'cdd_3', name: '3. Aşama: İlk Engel (First Obstacle)', act: 'Orta Öncesi', targetPercent: 50, description: 'Hedefe giderken karşılaşılan ilk gerçekçi ve trajikomik engel.', guidingQuestions: ['Karakterin hedefine toslayan ilk pürüz nedir?'] },
      { id: 'cdd_4', name: '4. Aşama: Tırmanan Engel (Escalating Obstacle)', act: 'Orta Sonrası', targetPercent: 70, description: 'Durumun daha da sarpa sarması ve kontrolün kaybedilmesi.', guidingQuestions: ['Karakter durumu kurtarmaya çalışırken nasıl daha derin batıyor?'] },
      { id: 'cdd_5', name: '5. Aşama: Dönüm Noktası (Turning Point)', act: 'Doruk Öncesi', targetPercent: 88, description: 'Karakterin kendi iç gerçeğiyle yüzleştiği ve bir aydınlanma yaşadığı kilit kırılma.', guidingQuestions: ['Karakterin maskesinin düştüğü duygusal an hangisi?'] },
      { id: 'cdd_6', name: '6. Aşama: Çözüm & Yeni Gerçeklik (Resolution)', act: 'Kapanış', targetPercent: 100, description: 'Klasik sitcom gibi sıfırlanmayan, karakterin ruhunda iz bırakan dürüst ve organik çözülüş.', guidingQuestions: ['Karakter bu 30 dakikanın sonunda nasıl biraz daha dönüşmüş olarak kalıyor?'] }
    ]
  },

  // 18. MULTI-STRAND (ÇOK KANALLI) DİZİ ANLATI ŞABLONU
  {
    id: 'tv_multi_strand_ensemble',
    category: 'series',
    title: 'Multi-Strand (Çok Kanallı) Dizi Anlatı Şablonu',
    subtitle: 'A-Plot (Ana Olay), B-Plot (Kişisel Ark), C-Plot (Mizahi Runner)',
    author: 'Ensemble TV Writers Room',
    badge: 'Multi-Strand (A-B-C)',
    description: 'Bir bölüm içinde A (Ana olay örgüsü), B (Kişisel/duygusal alt konu) ve C (Mizahi koşucu) kanallarının kusursuz bir ritimle birbirine örüldüğü TV kurgusu.',
    defaultPages: 60,
    beats: [
      { id: 'ms_1', name: '1. Aşama: Kanalların Açılışı (A, B ve C Tohumları)', act: '1. Perde', targetPercent: 15, description: 'A ana davası başlar, B kişisel krizinin ilk sinyali verilir, C mizahi koşucusu fırlatılır.', guidingQuestions: ['A ana olay örgüsü nedir? B kişisel hikayesi kiminle ilgilidir? C mizahi kancası nedir?'] },
      { id: 'ms_2', name: '2. Aşama: A Hikayesinin İlerlemesi & B\'nin Derinleşmesi', act: '2. Perde A', targetPercent: 35, description: 'A davasında ilk ipucu; B hikayesinde karakterin duygusal çatışması alevlenir.', guidingQuestions: ['A hikayesindeki ilk büyük dönüm noktası nedir? B ilişkisi nasıl geriliyor?'] },
      { id: 'ms_3', name: '3. Aşama: C Koşucusunun Zirvesi & A-B Çarpışması', act: '2. Perde Orta', targetPercent: 55, description: 'C hikayesi komik bir mini zirveye ulaşır; A ve B hikayeleri birbirlerinin ayağına basmaya başlar.', guidingQuestions: ['C hikayesindeki komik patlama nedir? A ve B nerede kesişiyor?'] },
      { id: 'ms_4', name: '4. Aşama: Kanalların Eşzamanlı Krizi', act: '2. Perde B', targetPercent: 75, description: 'Hem A hem de B hikayesinde işlerin aynı anda en karanlık noktaya varması.', guidingQuestions: ['A davası nasıl çıkmaza giriyor ve B ilişkisi nasıl kopma noktasına geliyor?'] },
      { id: 'ms_5', name: '5. Aşama: A Hikayesinin Doruk Noktası & B Çözülüşü', act: '3. Perde', targetPercent: 90, description: 'A ana davasının çözüldüğü büyük aksiyon/mahkeme sahnesi; B ilişkisinde alınan karar.', guidingQuestions: ['A ana davası nasıl sonuçlanıyor? B duygusal ilişkisi nasıl bir karara varıyor?'] },
      { id: 'ms_6', name: '6. Aşama: Sezonluk Tohumlar & Kapanış Armonisi', act: '3. Perde Sonu', targetPercent: 100, description: 'A, B ve C kanallarının sakinleşmesi ve sonraki bölümlere uzanacak serial tohumların ekilmesi.', guidingQuestions: ['Bölümün son sahnesinde gelecek haftayı besleyecek hangi tohum ekiliyor?'] }
    ]
  },

  // 19. TELEVİZYON FİLMİ / MOW (7 AKTLIK YAPI)
  {
    id: 'tv_mow_7_act_movie',
    category: 'series',
    title: 'Televizyon Filmi / MOW (7 Aktlık Şablon)',
    subtitle: 'Movie of the Week: 7 Reklam Arası & "Holy Shit!" Anları',
    author: 'Network TV MOW Formatı',
    badge: '7 Akt MOW (94 Sayfa)',
    description: '94 dakikalık TV filmini her biri 13-14 sayfalık 7 eşit akta bölen ve her reklam öncesine tansiyonu patlatan bir "Holy Shit!" anı yerleştiren katı TV film matematiği.',
    defaultPages: 94,
    beats: [
      { id: 'mow_1', name: '1. Akt: Statüko & Tetikleyici Kriz (Sayfa 1-14)', act: 'Act 1 (Sayfa 1-14)', targetPercent: 14, description: 'Karakterin tanıtımı, normal hayatın çöküşü ve 1. Reklam Öncesi Kanca (Holy Shit 1).', guidingQuestions: ['İlk 14 sayfanın sonunda seyircinin kanal değiştirmesini engelleyecek ilk şok kanca nedir?'] },
      { id: 'mow_2', name: '2. Akt: Yeni Tehlike & Kurbanın Çıkmazı (Sayfa 15-28)', act: 'Act 2 (Sayfa 15-28)', targetPercent: 28, description: 'Tehlikenin büyümesi, kahramanın tuzağa düşmesi ve 2. Reklam Kancası.', guidingQuestions: ['Kahraman nasıl bir kumpasın ortasında kaldığını fark ediyor?'] },
      { id: 'mow_3', name: '3. Akt: Çember Daralıyor (Sayfa 29-42)', act: 'Act 3 (Sayfa 29-42)', targetPercent: 42, description: 'Düşmanın ilk büyük saldırısı, müttefik kaybı ve 3. Reklam Kancası.', guidingQuestions: ['42. sayfada patlayan ve yarım saat kuşağını kurtaran kriz ne?'] },
      { id: 'mow_4', name: '4. Akt: Orta Nokta Şoku (Sayfa 43-56)', act: 'Act 4 (Sayfa 43-56)', targetPercent: 57, description: 'Oyunun kurallarının tamamen değişmesi; en güvenilen kişinin şüpheliye dönüşmesi (Holy Shit 4).', guidingQuestions: ['56. sayfadaki orta nokta kırılmasında ortaya çıkan sarsıcı sır nedir?'] },
      { id: 'mow_5', name: '5. Akt: Geri Dönüşsüz Kuşatma (Sayfa 57-70)', act: 'Act 5 (Sayfa 57-70)', targetPercent: 74, description: 'Karakterin polisten/düşmandan kaçması, delillerin karartılması ve 5. Reklam Kancası.', guidingQuestions: ['Karakter nasıl tek başına ve çaresiz kalıyor?'] },
      { id: 'mow_6', name: '6. Akt: En Karanlık Nokta (All is Lost - Sayfa 71-84)', act: 'Act 6 (Sayfa 71-84)', targetPercent: 88, description: 'Her şeyin kaybedildiği, düşmanın mutlak galip göründüğü 6. Reklam Kancası.', guidingQuestions: ['Düşman kahramanı köşeye kıstırdığında ne söylüyor?'] },
      { id: 'mow_7', name: '7. Akt: Büyük Final & Hesaplaşma (Sayfa 85-94)', act: 'Act 7 (Sayfa 85-94)', targetPercent: 100, description: 'Kahramanın zekasıyla düşmanı alt ettiği son 10 dakikalık ölümcül yüzleşme ve adalet.', guidingQuestions: ['Düşman son hesaplaşmada nasıl kendi tuzağına düşürülüyor?'] }
    ]
  },

  // 20. KLASİK "AĞACA ÇIKARMA" (UP THE TREE) ŞABLONU
  {
    id: 'tv_up_the_tree_structure',
    category: 'series',
    title: 'Klasik "Ağaca Çıkarma" (Up the Tree) Şablonu',
    subtitle: 'Alex Epstein & Jurgen Wolff (Ağaca Çıkar -> Taş At / Ateşe Ver -> İndir)',
    author: 'Alex Epstein & Jurgen Wolff',
    badge: 'Up the Tree Modeli',
    description: 'Dramatik yazarlığın en pratik formülü: 1. Perde Karakteri ağaca çıkar (kriz ver), 2. Perde Kafasına taşlar at ve ağacı ateşe ver (tırmandır), 3. Perde Ağaçtan indir (çöz).',
    defaultPages: 60,
    beats: [
      { id: 'utt_1', name: '1. Aşama: Karakteri Ağaca Çıkar (Beginning - Get Him Up a Tree)', act: '1. Perde', targetPercent: 25, description: 'Karaktere çözülmesi imkansız gibi görünen büyük bir problem veya kışkırtıcı bir kriz yükleyip onu savunmasız bir dala çıkarırsınız.', guidingQuestions: ['Karakteri apar topar ağaca çıkaran (krizin kucağına iten) başlangıç problemi nedir?'] },
      { id: 'utt_2', name: '2. Aşama: Kafasına Taşlar At (Complication - Throw Stones at Him)', act: '2. Perde A', targetPercent: 50, description: 'Karakter ağaçtayken problemleri tırmandırır, yanlış anlamaları üst üste yığar ve kaçış yollarını birer birer tıkarsınız.', guidingQuestions: ['Karakter aşağı inmeye çalışırken kafasına hangi beklenmedik taşlar (engeller) yağıyor?'] },
      { id: 'utt_3', name: '3. Aşama: Ağacı Ateşe Ver! (Modern Twist - Set the Tree on Fire!)', act: '2. Perde B', targetPercent: 75, description: 'Modern televizyonun kuralı; taş atmak yetmez, ağacın altını ateşe verip karakteri mutlak bir ölüm-kalım ikilemine sokarsınız.', guidingQuestions: ['Durumu "ya şimdi zıplayacak ya da yanacak" noktasına getiren alev nedir?'] },
      { id: 'utt_4', name: '4. Aşama: Karakteri Ağaçtan İndir (Resolution - Get Him Down)', act: '3. Perde', targetPercent: 100, description: 'Karakterin kendi içsel zekası veya radikal bir fedakarlıkla ağaçtan kurtulması veya yeni duruma uyum sağlaması.', guidingQuestions: ['Karakter ağaçtan aşağı nasıl dönüşmüş ve ders almış biri olarak iniyor?'] }
    ]
  },

  // 21. MİNİ DİZİ / SINIRLI SERİ OMURGASI (Dizi / TV)
  {
    id: 'tv_limited_series_6_ep',
    category: 'series',
    title: 'Mini Dizi / Sınırlı Seri Omurgası (6 Bölüm)',
    subtitle: '6-Episode Limited Series Master Arc Architecture',
    author: 'Limited Series Framework',
    badge: '6 Bölüm Master Arc',
    description: 'Chernobyl, Queen\'s Gambit gibi 6-8 bölümlük prestij mini dizilerin tüm sezonunu tek bir master hikaye arkı olarak kurgulayan şablon.',
    defaultPages: 60,
    beats: [
      { id: 'min_1', name: 'Bölüm 1: Günah / Başlangıç & Dünyanın Çöküşü', act: 'Bölüm 1 (Tetikleyici)', targetPercent: 16, description: 'Ana olayın patlaması, suçun/felaketin işlenmesi ve tüm karakterlerin kaderinin bağlanması.', guidingQuestions: ['Tüm sezonu başlatacak affedilmez günah veya felaket nedir?', 'Karakterler bu olayın etrafında nasıl kümeleniyor?'] },
      { id: 'min_2', name: 'Bölüm 2: Derinleşme & Sırlar', act: 'Bölüm 2 (Yeni Dünya)', targetPercent: 33, description: 'Buzdağının altının görünmesi, ilk soruşturmalar ve karakterlerin gizli ajandaları.', guidingQuestions: ['Görünenin ardındaki çürümüşlük veya gizem nasıl ortaya çıkıyor?', 'Hangi karakter neyi saklıyor?'] },
      { id: 'min_3', name: 'Bölüm 3: Çatallanma & Tehlikeli İttifaklar', act: 'Bölüm 3 (Yükseliş)', targetPercent: 50, description: 'Karakterlerin kendi çıkarlarını korumak için beklenmedik ittifaklar kurması ve gerilimin tırmanması.', guidingQuestions: ['Düşmanlar hangi zorunlulukla işbirliği yapıyor?', 'Ahlaki sınırlar nasıl esniyor?'] },
      { id: 'min_4', name: 'Bölüm 4: Orta Nokta Şoku & Geri Dönüşsüzlük', act: 'Bölüm 4 (Dönüm Noktası)', targetPercent: 66, description: 'Sezonun orta noktası; büyük bir cinayet, ifşaat veya kaçış ile kartların yeniden dağıtılması.', guidingQuestions: ['Tüm teorileri altüst eden devasa kırılma noktası nedir?', 'Kim saf değiştiriyor veya kim eleniyor?'] },
      { id: 'min_5', name: 'Bölüm 5: Çöküş & Ruhun Karanlık Gecesi', act: 'Bölüm 5 (En Karanlık An)', targetPercent: 83, description: 'Sistemin veya suçlunun baskın gelmesi, masumların ezilmesi ve kahramanın en dip noktası.', guidingQuestions: ['Herkesin kaybettiği ve adaletin bittiği zannedilen an nasıl hissettiriliyor?'] },
      { id: 'min_6', name: 'Bölüm 6: Hesaplaşma & Külleri Toplama', act: 'Bölüm 6 (Final)', targetPercent: 100, description: 'Nihai mahkeme/yüzleşme, gerçeğin bedeli, günahların ödenmesi ve yeni gerçeklik.', guidingQuestions: ['Gerçek hangi ağır bedellerle ortaya çıkıyor?', 'Hayatta kalanlar bu yangından geriye nasıl bir dersle çıkıyor?'] }
    ]
  },

  // 22. TV PİLOT & DİZİ MOTORU ŞABLONU (Dizi / TV)
  {
    id: 'tv_series_engine_pitch',
    category: 'series',
    title: 'TV Pilot & Dizi Motoru Şablonu (Series Engine)',
    subtitle: 'Series Engine, Franchise Hook & Character Dynamic Matrix',
    author: 'Showrunner Development System',
    badge: 'Dizi Motoru & Pitch',
    description: 'Bir dizinin yüzlerce bölüm boyunca tükenmeden akmasını sağlayan dizi motorunu (Series Engine) ve pilot kurgusunu inşa eden showrunner modeli.',
    defaultPages: 60,
    beats: [
      { id: 'eng_1', name: '1. Dizi Motoru / Temel Soru (Series Engine)', act: 'Dizi Omurgası', targetPercent: 15, description: 'Dizinin her hafta veya her sezon karakterleri harekete geçiren tükenmez motoru ve ana çatışması.', guidingQuestions: ['Bu dizide karakterleri her hafta/sezon çatışmaya sokan bitmek bilmez motor nedir?', 'Dizinin temel felsefi sorusu ne?'] },
      { id: 'eng_2', name: '2. Pilot Kancası & Evrenin Kuralları (Pilot Hook)', act: 'Pilot Açılışı', targetPercent: 30, description: 'Pilot bölümün seyirciye tanıttığı dünyanın benzersiz kuralları ve görsel dili.', guidingQuestions: ['Bu evrenin diğer benzer dizilerden ayrılan en çarpıcı kuralı nedir?'] },
      { id: 'eng_3', name: '3. Karakter Çatışma Çemberi (Flaws vs Goals)', act: 'Karakter Dinamiği', targetPercent: 45, description: 'Karakterlerin birbirlerinin zayıflıklarını kaşıdığı kapalı devre ilişki çemberi.', guidingQuestions: ['Karakterler aynı evin/ofisin içinde neden birbirlerine mahkumlar?', 'Kim kime tahammül edemiyor?'] },
      { id: 'eng_4', name: '4. İlişki Matrisi & Statüko Gerilimi', act: 'İlişki Matrisi', targetPercent: 60, description: 'Aşk üçgenleri, gizli rekabetler ve değişmeyen dengenin yarattığı mizah/gerilim.', guidingQuestions: ['İlişkilerdeki bastırılmış cinsel veya mesleki gerilim nasıl korunuyor?'] },
      { id: 'eng_5', name: '5. Sezonluk Ana Gizem / Master Arc (Season Arc)', act: 'Sezonluk Olay Örgüsü', targetPercent: 75, description: 'Tüm sezon boyunca azar azar çözülen büyük A-hikayesi motoru.', guidingQuestions: ['1. Sezon boyunca çözülmeye çalışılacak büyük sır nedir?'] },
      { id: 'eng_6', name: '6. Bölümlük Prosedürel Döngü (Case of the Week)', act: 'Bölümlük Döngü', targetPercent: 90, description: 'Her bölümde başlayıp biten mini macera veya vaka döngüsünün işleyiş mekanizması.', guidingQuestions: ['Tipik bir bölümde vaka nasıl gelir, araştırılır ve çözülür?'] },
      { id: 'eng_7', name: '7. Sezon Finali Hedefi & Dönüşüm Vaadi', act: 'Gelecek Vaadi', targetPercent: 100, description: '1. Sezon sonunda vaat edilen büyük patlama ve dizinin gelecekteki potansiyeli.', guidingQuestions: ['1. Sezon finalinde hangi büyük statüko yıkılacak ve 2. Sezona nasıl alan açılacak?'] }
    ]
  },

  // ==========================================
  // DİJİTAL PLATFORM & ON-DEMAND ŞABLONLARI (8 MODEL - NETFLIX, HBO, AMAZON)
  // ==========================================

  // 23. THE SLOW-BURN CASE-OF-THE-SEASON (On-Demand)
  {
    id: 'stream_slow_burn',
    category: 'streaming',
    title: 'The Slow-Burn Case-of-the-Season',
    subtitle: 'Sezonluk Ağır Ateş Akışı & Romanesk Binge Kurgusu',
    author: 'Neil Landau & SVOD Romanesk Ekolü',
    badge: 'Sezonluk Vaka (10 Saat)',
    description: 'Haftalık vaka yerine sezonun tamamını 10 saatlik kesintisiz bir roman (potboiler novel) gibi işleyen, vakanın karakter dönüşümüne ayna tuttuğu derin streaming modeli.',
    defaultPages: 60,
    beats: [
      { id: 'sb_1', name: '1. Olayın Fitili & Yüzeydeki Sakinlik (The Spark in Still Water)', act: '1. Perde (%0 - %15)', targetPercent: 12, description: 'Küçük ama tekinsiz bir olayla başlar; yüzeydeki kasaba veya aile huzurunun altındaki derin çatlak sezdirilir.', guidingQuestions: ['Sezon boyunca yanacak olan ilk gizem kıvılcımı nedir?', 'Görünürdeki huzurlu statüko ne kadar tekinsiz ve kırılgan?'] },
      { id: 'sb_2', name: '2. Katman Katman Açılma & Karakterlerin Yaraları (Unpeeling the Onion)', act: '1. Perde Sonu (%15 - %30)', targetPercent: 25, description: 'Vaka alelacele çözülmek yerine karakterlerin geçmiş travmalarını, aile sırlarını ve saklanan günahları açığa çıkarır.', guidingQuestions: ['Vaka karakterlerin hangi bastırılmış geçmiş travmasını veya aile sırrını tetikliyor?', 'Soruşturma derinleştikçe kimler köşeye sıkışıyor?'] },
      { id: 'sb_3', name: '3. Binge Kancası & Şüphe Çemberi (The Binge Hook)', act: '2. Perde A (%30 - %50)', targetPercent: 42, description: 'Her bölüm sonunda izleyiciyi sonraki bölüme fırlatan sırlar; herkesin potansiyel suçluya veya yalancıya dönüşmesi.', guidingQuestions: ['Şüphe oku her bölümde nasıl farklı bir ana karaktere dönüyor?', 'İzleyicinin "bir bölüm daha" izlemesini sağlayan psikolojik kanca nedir?'] },
      { id: 'sb_4', name: '4. Sezonun Orta Noktası: Dipsiz Kuyu (The Abyss Midpoint)', act: '2. Perde Orta Nokta (%50 - %65)', targetPercent: 55, description: 'Vakanın tahmin edilenden çok daha karanlık ve sistemik bir çürümeye dayandığının anlaşılması; geri dönüşsüz eşik.', guidingQuestions: ['Soruşturmayı geri dönüşü olmayan bir ahlaki çıkmaza sokan büyük kırılma nedir?', 'Kahramanın başlangıçtaki tüm inançları nasıl yerle bir oluyor?'] },
      { id: 'sb_5', name: '5. Ağır Ateş Tırmanışı & Kaçınılmaz Çöküş (The Slow Boil Collapse)', act: '2. Perde Sonu (%65 - %85)', targetPercent: 75, description: 'Ahlaki sınırların tamamen silinmesi, karakterlerin içsel zırhlarının parçalanması ve yüzleşmenin kapıya dayanması.', guidingQuestions: ['Kahraman gerçeğe ulaşmak için hangi kutsal/ahlaki kuralını çiğnemek zorunda kalıyor?', 'Aile veya dostluk bağları nasıl geri dönülemez biçimde kopuyor?'] },
      { id: 'sb_6', name: '6. Sezon Zirvesi: Gerçeğin Çıplaklığı (The Naked Truth Climax)', act: '3. Perde (%85 - %95)', targetPercent: 90, description: 'Katilin veya sırrın ortaya çıkışı; ancak burada zafer sevinci değil, yaşanan büyük yıkımın acı ve çıplak ağırlığı hakimdir.', guidingQuestions: ['Gerçek ortaya çıktığında karakterler nasıl bir ruhsal enkazla baş başa kalıyor?', 'Asıl suçlu sadece bir kişi mi yoksa tüm sistem mi?'] },
      { id: 'sb_7', name: '7. Sonrası & Değişen Ruhlar (The Lingering Aftermath)', act: '3. Perde Sonu (%95 - %100)', targetPercent: 100, description: 'Romanesk kapanış; vaka kapansa da karakterlerin hayatının asla eskisi gibi olamayacağı hissi ve kalan tortu.', guidingQuestions: ['Bu 10 saatlik yangının ardından karakterlerin ruhunda kalan kalıcı yara nedir?', 'Toplum bu sırla yaşamaya nasıl devam edecek?'] }
    ]
  },

  // 24. THE STORY TENTACLE (On-Demand)
  {
    id: 'stream_story_tentacle',
    category: 'streaming',
    title: 'The Story Tentacle (Hikâye Dokunacı)',
    subtitle: 'Çoklu Protagonist & Paralel Coğrafyalar (Neil Landau Modeli)',
    author: 'Neil Landau & Game of Thrones Ekolü',
    badge: 'Çoklu Protagonist',
    description: 'Ana tematik gövdeden uzanan ve farklı coğrafyalarda yaşayan bağımsız kahramanların (dokunaçların) kendi mikro arklarını yaşadığı, sezon finalinde birleşen devasa anlatı şemsiyesi.',
    defaultPages: 60,
    beats: [
      { id: 'stt_1', name: '1. Tematik Gövde & Dağınık Dünyalar (The Central Spine)', act: '1. Perde', targetPercent: 15, description: 'Dizinin ana tematik fikri kurulur; farklı coğrafyalardaki 3-5 bağımsız dokunaç karakter ve dünyaları tanıtılır.', guidingQuestions: ['Birbirini hiç tanımayan veya ayrı düşmüş bu karakterleri bağlayan ortak felsefi gövde (güç, hayatta kalma, adalet) nedir?', 'Her coğrafyanın görsel ve ahlaki atmosferi nasıl ayrışıyor?'] },
      { id: 'stt_2', name: '2. Dokunaçların Bağımsız Mikro Çatışmaları (Independent Micro-Arcs)', act: '1. Perde Sonu', targetPercent: 30, description: 'Her karakter kendi yerel dünyasında hayatta kalma ve otoriteye karşı var olma mücadelesi verir.', guidingQuestions: ['Her dokunacın (karakterin) kendine has mini-antagonisti ve yerel tehlikesi nedir?', 'Karakterler kendi mikro hedeflerine nasıl kilitleniyor?'] },
      { id: 'stt_3', name: '3. Görünmez Rezonans & Çapraz Etkiler (Cross-Current Echoes)', act: '2. Perde Orta Nokta', targetPercent: 50, description: 'Bir coğrafyadaki olayın fırtınası, binlerce kilometre ötedeki diğer dokunacı dolaylı yoldan sarsar.', guidingQuestions: ['Kuzeydeki bir ölüm veya karar, Güneydeki dokunacın kaderini nasıl dalga etkisiyle sarsıyor?', 'İzleyicinin kurduğu zihinsel köprüler neler?'] },
      { id: 'stt_4', name: '4. Dokunaçların Kırılma Noktaları (Parallel Convergences)', act: '2. Perde Sonu', targetPercent: 72, description: 'Her kahramanın kendi dünyasındaki en karanlık çaresizliğe ve ihanete aynı anda yuvarlanması.', guidingQuestions: ['Farklı cephelerdeki karakterler aynı anda hangi ölümcül sınavlarla sınanıyor?', 'Kimlerin dokunacı kesiliyor veya mutasyona uğruyor?'] },
      { id: 'stt_5', name: '5. Dokunaçların Düğümlenmesi & Büyük Çarpışma (The Great Climax Tangle)', act: '3. Perde', targetPercent: 90, description: 'Yolların, orduların veya sırların finalde aynı merkez noktada kesişmesi ve devasa hesaplaşma.', guidingQuestions: ['Sezon boyunca birbirini görmeyen dokunaçlar nerede ve nasıl çarpışıyor?', 'Hangi karakter diğerinin kaderini mühürlüyor?'] },
      { id: 'stt_6', name: '6. Yeni Güç Dengesi & Yeniden Çizilen Harita (The Redrawn Map)', act: '3. Perde Sonu', targetPercent: 100, description: 'Coğrafi ve politik haritanın yeniden çizilmesi, yeni sezona açılan devasa kanca.', guidingQuestions: ['Bu çarpışmadan sonra dünyadaki güç dengesi nasıl el değiştirdi?', 'Gelecek sezon hangi yeni dokunaçlar filizlenecek?'] }
    ]
  },

  // 25. THE MACRO/MICRO CONTRAST (On-Demand)
  {
    id: 'stream_macro_micro',
    category: 'streaming',
    title: 'The Macro / Micro Contrast Şablonu',
    subtitle: 'Devasa Sistem Çarkları vs. Kahramanın En Gizli Yarası',
    author: 'Paolo Sorrentino & Peter Morgan Ekolü',
    badge: 'Makro/Mikro Zıtlığı',
    description: 'Vatikan, Monarşi veya küresel holdingler gibi acımasız makro çarklar ile bu sistemin merkezindeki kahramanın çocuksu yalnızlığı ve mikro travmaları arasındaki tezat.',
    defaultPages: 60,
    beats: [
      { id: 'mm_1', name: '1. Makro Sistemin İhtişamı ve Soğukluğu (The Monolithic System)', act: '1. Perde', targetPercent: 15, description: 'Kurumun devasa ritüelleri, bin yıllık dogmaları ve acımasız kurumsal çarkları sergilenir.', guidingQuestions: ['Hikayenin geçtiği devasa kurumun (kilise, saray, finans devleti) insanı ezen kuralı nedir?', 'Mekanlar ve protokoller nasıl bir güç zırhı oluşturuyor?'] },
      { id: 'mm_2', name: '2. Mikro Zaaf ve Gizli Çocukluk Travması (The Hidden Vulnerability)', act: '1. Perde Sonu', targetPercent: 30, description: 'En tepedeki muktedir kahramanın yalnız kaldığı odadaki en kırılgan, çocuksu veya bağımlı hali.', guidingQuestions: ['Milyonları yöneten kahramanın geceleri yapayalnız kaldığında ağladığı çocukluk yarası ne?', 'Hangi küçük nesneye veya anıya saplantılı?'] },
      { id: 'mm_3', name: '3. Kurumsal Görev ile Kişisel Saplantının Çatışması (Public Duty vs Private Need)', act: '2. Perde Orta Nokta', targetPercent: 50, description: 'Kahramanın kurumsal bir kararı alırken kendi içsel intikamını veya onay arayışını yansıtması.', guidingQuestions: ['Kahraman makro gücünü kendi mikro yarasını iyileştirmek için nasıl tehlikeli biçimde kullanıyor?', 'Bürokrasi bu durumu nasıl bir tehdit olarak algılıyor?'] },
      { id: 'mm_4', name: '4. Sistemin Kahramanı Yutma Tehdidi (The System Strikes Back)', act: '2. Perde Sonu', targetPercent: 72, description: 'Kurumun eski muhafızları ve bürokrasi, kahramanın zaafını keşfedip onu yok etmek için saldırır.', guidingQuestions: ['Sistem, kahramanın insani zayıflığını kullanarak onu nasıl köşeye sıkıştırıyor?', 'Kahraman hangi kutsal/resmi maskesini kaybetme tehlikesiyle karşı karşıya?'] },
      { id: 'mm_5', name: '5. Kutsal / Resmi Sahnede İçsel Patlama (The Intimate Showdown)', act: '3. Perde', targetPercent: 90, description: 'Milyonların izlediği bir tören, balkon konuşması veya basın toplantısında içsel yaranın dışa vurulması.', guidingQuestions: ['Devasa makro arenada kahraman kendi mikro gerçeğini ve çığlığını dünyaya nasıl haykırıyor?', 'Tarihsel bir an nasıl derinden kişisel bir hesaplaşmaya dönüşüyor?'] },
      { id: 'mm_6', name: '6. Yalnız Zirve & Maskenin Dönüşü (The Lonely Throne)', act: '3. Perde Sonu', targetPercent: 100, description: 'Zafer kazansa bile kahramanın devasa sarayında yapayalnız kalması, sistemin soğukluğunun devamı.', guidingQuestions: ['Zirvede kalan kahramanın ödediği nihai ruhsal bedel nedir?', 'Makro ihtişam ile mikro yalnızlık son karede nasıl tezat oluşturuyor?'] }
    ]
  },

  // 26. THE UNRELIABLE NARRATOR (On-Demand)
  {
    id: 'stream_unreliable_narrator',
    category: 'streaming',
    title: 'The Unreliable Narrator (Güvenilmez Anlatıcı)',
    subtitle: 'Sanrısal Kurgu, Çarpıtılmış Gerçeklik & Zihinsel Labirent',
    author: 'Sam Esmail & Post-Modern TV Ekolü',
    badge: 'Zihinsel Sanrı & Deşifre',
    description: 'Dışsal gerçeklik yerine karakterin travma, akıl sağlığı veya narsisizmle çarpıtılmış zihnini takip ettiğimiz; dönüm noktalarının illüzyonların deşifre olmasıyla yaşandığı on-demand modeli.',
    defaultPages: 60,
    beats: [
      { id: 'un_1', name: '1. Çarpıtılmış Dünyanın Kurulması (The Distorted Reality)', act: '1. Perde', targetPercent: 15, description: 'Anlatıcı seyirciyle doğrudan konuşur veya olayları kendi filtresinden anlatarak sahte bir gerçeklik inşa eder.', guidingQuestions: ['Karakter dünyaya bakarken neyi yanlış veya abartılı yorumluyor?', 'Seyirciyi kendi çarpıtılmış doğrusuna nasıl inandırıyor ve suç ortağı yapıyor?'] },
      { id: 'un_2', name: '2. Gerçeklikteki İlk Çatlaklar (Glitch in the Matrix)', act: '1. Perde Sonu', targetPercent: 30, description: 'Seyircinin "bir şeyler ters gidiyor" dediği küçük tutarsızlıklar, kayıp zamanlar ve hafıza boşlukları.', guidingQuestions: ['Anlatıcının hikayesindeki ilk bariz mantık hatası veya şüpheli detay nedir?', 'Çevresindekiler ona neden tuhaf bakıyor?'] },
      { id: 'un_3', name: '3. Sanrı ile Eylemin İç İçe Geçmesi (The Delusion Drives the Plot)', act: '2. Perde Orta Nokta', targetPercent: 50, description: 'Karakter kendi zihninde yarattığı bir figürle veya komployla ortak operasyona girişir.', guidingQuestions: ['Karakterin sanrısı onu gerçek dünyada hangi somut ve tehlikeli eyleme itiyor?', 'Seyirci sanrı ile gerçeği ayırt etmekte nasıl zorlanıyor?'] },
      { id: 'un_4', name: '4. Büyük Deşifre / Ayna Kırılması (The Shattering Reveal)', act: '2. Perde Sonu', targetPercent: 75, description: 'Seyircinin ve karakterin aynı anda gerçeği fark etmesi; rehberin aslında kendisi veya bir hayal olması.', guidingQuestions: ['Seyirciyi şok eden ve tüm geçmiş sahneleri baştan aşağı yeniden okutan büyük ifşaat nedir?', 'Karakter kendi yalanıyla nasıl yüzleşiyor?'] },
      { id: 'un_5', name: '5. Gerçekle Yüzleşmenin Ağır Şoku (The Disintegration)', act: '3. Perde', targetPercent: 88, description: 'Zihindeki sahte zırh çökünce karakterin gerçek dünyadaki yıkımla ve işlediği suçlarla baş başa kalması.', guidingQuestions: ['Sanrılar kalktığında karakterin gerçekte kime ne zarar verdiği nasıl anlaşılıyor?', 'Zihinsel dağılmanın ardından toparlanma çabası nasıl işliyor?'] },
      { id: 'un_6', name: '6. Yeni Bilinç & Seyirciyle Dürüst Veda (Acceptance of Broken Self)', act: '3. Perde Sonu', targetPercent: 100, description: 'Karakterin kendi kusurlu ve kırık zihnini kabul etmesi; seyirciye dürüst bir farkındalıkla veda edişi.', guidingQuestions: ['Karakter kendini kandırmaktan vazgeçip hangi acı gerçekle yaşamayı öğreniyor?', 'Seyirciyle kurduğu gizli bağ son anda nasıl çözülüyor?'] }
    ]
  },

  // 27. THE COMMERCIAL-FREE / TEASER-AND-FOUR-ACT (On-Demand)
  {
    id: 'stream_commercial_free',
    category: 'streaming',
    title: 'The Commercial-Free / Teaser-and-Four-Act Modeli',
    subtitle: 'Reklamsız Süre ve Perde Esnekliği (Landmark Sahneler)',
    author: 'Jill Soloway & SVOD Dramedy Ekolü',
    badge: 'Teaser + 4 Perde (Organik)',
    description: '12 dakikada bir reklam arasına girme zorunluluğunu çözen; yapay cliffhanger yerine içsel karakter dönüm noktaları (Landmark Sahneler) ve esnek süreyle nefes alan organik streaming yapısı.',
    defaultPages: 45,
    beats: [
      { id: 'cf_1', name: '1. Teaser: Karakterin Mahrem Anı (The Intimate Cold Open)', act: 'Teaser', targetPercent: 10, description: 'Reklam kaygısı gütmeyen, karakterin sessiz bir anını veya organik bir sohbetini yakalayan samimi açılış.', guidingQuestions: ['Karakterin iç dünyasını kelimeler olmadan anlatan açılış detayı nedir?', 'Sahnenin süresi neden aceleye getirilmiyor?'] },
      { id: 'cf_2', name: '2. 1. Perde: Gündelik Rutin ve Duygusal Kırılma (First Landmark)', act: '1. Perde', targetPercent: 30, description: 'Karakterin hayatındaki küçük ama derin bir duygusal dalgalanma; yapay patlama olmadan tırmanan gerilim.', guidingQuestions: ['Dışsal bir patlama olmadan karakterin içinde kopan ilk sessiz fırtına nedir?', 'Hangi samimi diyalog onu sarsıyor?'] },
      { id: 'cf_3', name: '3. 2. Perde: Atmosferik Derinleşme & Uzun Sahneler (Atmospheric Immersion)', act: '2. Perde', targetPercent: 55, description: 'Kesintisiz akan uzun diyaloglar, sofralar ve karakterlerin birbirlerinin sınırlarını test etmesi.', guidingQuestions: ['Karakterlerin maskelerini düşüren kesintisiz ve uzun sahne nasıl akıyor?', 'Atmosfer seyirciye nasıl nüfuz ediyor?'] },
      { id: 'cf_4', name: '4. 3. Perde: Duygusal Nirengi / Kriz Noktası (Emotional Landmark)', act: '3. Perde', targetPercent: 80, description: 'Dışsal bir felaket değil; bir itiraf, sessizlik veya terk ediliş anının yarattığı sarsıntı.', guidingQuestions: ['Bölümün en yüksek duygusal yüzleşmesi hangi küçük odada veya anda yaşanıyor?', 'Karakter neyi gizlemeyi artık başaramıyor?'] },
      { id: 'cf_5', name: '5. 4. Perde & Organik Çözülüş (Organic Resonation)', act: '4. Perde', targetPercent: 100, description: 'Reklam arası cliffhanger\'ı yerine seyircinin zihninde yankılanan derin bir müzik, bakış ve açık uçlu kapanış.', guidingQuestions: ['Seyirciye sonraki bölüme geçme isteği veren duygusal merak duygusu nasıl bırakılıyor?', 'Bölüm hangi anlamlı sessizlikle son buluyor?'] }
    ]
  },

  // 28. THE SUBSCRIBER-DRIVEN NICHE PORTFOLIO (On-Demand)
  {
    id: 'stream_niche_portfolio',
    category: 'streaming',
    title: 'The Subscriber-Driven Niche Portfolio Şablonu',
    subtitle: 'Niş, Sansürsüz ve Tutkulu Kitle Anlatısı',
    author: 'Jenji Kohan & Streaming Portfolio Ekolü',
    badge: 'Niş & Tutku (Passion)',
    description: 'Geniş kitleleri yüzeysel memnun etmek yerine, belirli kitleleri "ölümüne sadık" (passion) kılacak; sansürsüz, cesur, marjinal ve daha önce ana akım TV\'de işlenmemiş aykırı karakter dünyaları.',
    defaultPages: 60,
    beats: [
      { id: 'np_1', name: '1. Aykırı / Marjinal Dünyanın Çiğ Tanıtımı (The Unfiltered World)', act: '1. Perde', targetPercent: 15, description: 'Ana akım televizyonun göstermekten çekindiği kapalı/marjinal bir evrenin tüm dürüstlüğüyle açılması.', guidingQuestions: ['Bu evrenin geleneksel televizyonda asla gösterilmeyen çiğ ve sansürsüz gerçeği nedir?', 'Dünya seyirciyi ilk andan nasıl şoke ediyor veya büyülüyor?'] },
      { id: 'np_2', name: '2. Önyargıları Yıkan Aykırı Karakterler (Subverting the Trope)', act: '1. Perde Sonu', targetPercent: 30, description: 'Karikatürize edilmiş klişelerin yerine derin, çelişkili ve kusurlu gerçek insanların konulması.', guidingQuestions: ['Karakter seyircinin ilk baştaki önyargısını hangi beklenmedik insanlığıyla kırıyor?', 'Hangi tabu davranış onun günlük gerçeği?'] },
      { id: 'np_3', name: '3. Sistemik Baskı ve Kabile İçi Dinamikler (Tribal Micro-Politics)', act: '2. Perde Orta Nokta', targetPercent: 50, description: 'Kapalı topluluk içindeki mikro hiyerarşi, dayanışma, gizli ticaret ve çatışmalar.', guidingQuestions: ['Bu marjinal topluluk kendi içinde nasıl acımasız kurallar ve dayanışma ağları işletiyor?', 'Otorite bu kabileye nasıl baskı kuruyor?'] },
      { id: 'np_4', name: '4. Tabuların Yıkıldığı Ahlaki Sınav (Breaking the Taboo)', act: '2. Perde Sonu', targetPercent: 75, description: 'Toplumun tabu saydığı bir konuda karakterin almak zorunda kaldığı radikal tutum ve direniş.', guidingQuestions: ['Karakter hangi toplumsal tabuyu yıkarak kendi özgürlüğünü veya sevdiklerini savunuyor?', 'Bedeli ne kadar ağırlaşıyor?'] },
      { id: 'np_5', name: '5. Sisteme Karşı Kolektif Direniş / İsyan (The Raw Climax)', act: '3. Perde', targetPercent: 90, description: 'Bireysel değil, grubun/kabilenin ortak onuru için başkaldırısı ve sansürsüz patlama.', guidingQuestions: ['Karakterler dış dünyaya ve baskıcı otoriteye karşı nasıl tek yürek oluyor?', 'İsyan anında yaşanan çarpıcı görsel detay nedir?'] },
      { id: 'np_6', name: '6. Özgünlüğün Zaferi & Sadakat Mührü (Unapologetic Truth)', act: '3. Perde Sonu', targetPercent: 100, description: 'Özür dilemeyen, kimliğini gururla sahiplenen ve izleyicide derin tutku yaratan kapanış.', guidingQuestions: ['Bu hikaye hedef kitlesine hangi cesaret ve görünürlük mesajını bırakıyor?', 'Geleneksel TV kalıpları nasıl tamamen aşılmış oldu?'] }
    ]
  },

  // 29. THE SMOOTH-BINGING & DIRECT-TO-SERIES (On-Demand)
  {
    id: 'stream_smooth_binging',
    category: 'streaming',
    title: 'The Smooth-Binging & Direct-to-Series Şablonu',
    subtitle: 'Recap Reddi, Organik Evren İnşası & Kesintisiz Binge Akışı',
    author: 'Ted Sarandos & Duffer Brothers Ekolü',
    badge: 'Direct-to-Series (Binge)',
    description: '"Geçen Bölümde" (Previously on) özetlerini çöpe atan, pilot bölüme kaba bilgi yüklemesi yapmadan evreni zamana yayan, bölümleri tek bir kesintisiz film şeridi gibi bağlayan modern binge-watching modeli.',
    defaultPages: 55,
    beats: [
      { id: 'sbng_1', name: '1. Bilgi Yüklemesiz Organik Başlangıç (No Exposition Dump)', act: 'Bölüm Girişi', targetPercent: 12, description: 'Dünyayı diyalogla açıklamak yerine karakterleri doğrudan hareket halinde yakalama; gizemin parça parça serpiştirilmesi.', guidingQuestions: ['Karakterlerin dünyasını uzun uzun açıklamak yerine hangi merak uyandırıcı eylemle gösteriyorsunuz?', 'Seyirci evrenin kurallarını yaşayarak nasıl keşfediyor?'] },
      { id: 'sbng_2', name: '2. Önceki Bölümün Küllerinden Doğuş (Seamless Transition)', act: 'İlk Çeyrek', targetPercent: 25, description: 'Özet vermeden, bir önceki bölümün son karesinin getirdiği momentumla doğrudan devam etme.', guidingQuestions: ['Bir önceki bölümün bıraktığı gerilim ateşi nasıl hiç soğumadan bu bölüme aktarılıyor?', 'Geçişte seyirciye zaman kaybettirmeyen kanca ne?'] },
      { id: 'sbng_3', name: '3. Katmanlı Yan Yollar & Eşzamanlı Dinamizm (Multi-Track Escalation)', act: 'Orta Bölüm', targetPercent: 50, description: 'Farklı karakter gruplarının aynı gizemin farklı uçlarını birbirlerinden habersiz kovalaması.', guidingQuestions: ['Farklı karakter grupları tehlikenin hangi farklı ipuçlarını aynı anda takip ediyor?', 'Kurgusal tempo nasıl sürekli yüksek tutuluyor?'] },
      { id: 'sbng_4', name: '4. İzleyiciyi \'Sonraki Bölüm\' Butonuna Kilitleyen Kriz (The Binge Trigger)', act: 'Üçüncü Çeyrek', targetPercent: 75, description: 'Pasif bir bekleme yerine seyircinin refleks olarak sonraki bölüme basmasını sağlayacak acil tehlike.', guidingQuestions: ['Bölümün sonuna doğru patlayan ve ertelenemez olan acil tehdit nedir?', 'Seyirci ekrandan ayrılmayı neden göze alamıyor?'] },
      { id: 'sbng_5', name: '5. Sezonluk Puzzle\'ın Kritik Parçasının Oturması (The Missing Piece Climax)', act: 'Zirve Anı', targetPercent: 90, description: 'Sezonun genel gizeminde devasa bir aydınlanma yaşanması ama hemen ardından yeni bir sorunun doğması.', guidingQuestions: ['Bu bölümde çözülen büyük sır, arkasından hangi daha devasa tehlikeyi doğuruyor?'] },
      { id: 'sbng_6', name: '6. Kesintisiz Sezon Akışı Kapanışı (The Continuous Cliffhanger)', act: 'Bölüm Sonu', targetPercent: 100, description: 'Bölüm sonu hissi yaratmayan, adeta 10 saatlik bir filmin sahne geçişi gibi duran son an.', guidingQuestions: ['Kapanış karesi seyircide nasıl "hemen şimdi sıradakini izlemeliyim" dürtüsü uyandırıyor?'] }
    ]
  },

  // 30. SHORT-FORM CHAPTERED MOVIE (On-Demand)
  {
    id: 'stream_short_form_chaptered',
    category: 'streaming',
    title: 'Short-Form Chaptered Movie (Bölümlü Kısa Format)',
    subtitle: '7-10 Dakikalık Mini-Bölümler & Mobil Öncelikli Kurgu',
    author: 'Jeffrey Katzenberg & Quibi / Micro-Streaming Ekolü',
    badge: '7-10 Dk Mini-Chapter',
    description: 'Büyük bir sinema filmini veya sezonu 7-10 dakikalık bağımsız mini-bölümlere bölen; her 8 dakikada kendi mini-aksiyon eğrisini kurup sonraki bölüme sıçrayan kancayla bitiren hiper-ritmik şablon.',
    defaultPages: 10,
    beats: [
      { id: 'sf_1', name: '1. Dakika: Anında Kanca & Saniyeler İçinde Tehlike (Instant Hook)', act: '0-2. Dakika', targetPercent: 15, description: 'Seyircinin dikkatini ilk 30 saniyede yakalayan doğrudan aksiyon, tehlike veya şok.', guidingQuestions: ['İlk 30 saniyede izleyicinin ekranı kaydırmasını (scroll) engelleyecek görsel veya işitsel şok nedir?', 'Ana çatışma nasıl anında patlıyor?'] },
      { id: 'sf_2', name: '3. Dakika: Mikro Hedef & Zamana Karşı Yarış (Micro-Goal & Ticking Clock)', act: '3-4. Dakika', targetPercent: 40, description: 'Bu 8 dakikalık mini-bölüm içinde çözülmesi gereken acil ve tek bir mikro hedef.', guidingQuestions: ['Karakterin bu 8 dakika içinde hayatta kalmak veya kaçmak için yapması gereken tek şey ne?', 'Zaman baskısı nasıl hissettiriliyor?'] },
      { id: 'sf_3', name: '5. Dakika: Beklenmedik Bariyer & Ani Tırmanış (The Rapid Twist)', act: '5-6. Dakika', targetPercent: 65, description: 'Küçük hedefin aniden daha büyük bir tehlikeye toslaması ve planın bozulması.', guidingQuestions: ['Karakter hedefe ulaştığını sandığı anda önüne hangi beklenmedik bariyer çıkıyor?'] },
      { id: 'sf_4', name: '7. Dakika: Mini-Doruk Noktası & Çarpışma (The Mini-Climax)', act: '7-8. Dakika', targetPercent: 85, description: 'Bu parçanın içindeki en yüksek aksiyon, yüzleşme veya ölümden kıl payı kurtulma anı.', guidingQuestions: ['Bu mini-bölümün 7. dakikasında yaşanan patlama veya yüzleşme nasıl sonuçlanıyor?'] },
      { id: 'sf_5', name: '8-10. Dakika: Hiper-Kanca / Sıçrama Noktası (The Hyper Cliffhanger)', act: '9-10. Dakika', targetPercent: 100, description: 'Seyirciye nefes aldırmadan hemen sonraki 8 dakikayı başlatacak ölüm-kalım kancası.', guidingQuestions: ['Son 15 saniyede patlayan ve sonraki bölümü zorunlu kılan devasa şok nedir?'] }
    ]
  }
];

interface StoryBeatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ScreenplayElement[];
  selectedTemplateId?: string;
  onSelectTemplate?: (templateId: string) => void;
  beatAnswers: Record<string, string>;
  onSaveBeatAnswer: (beatId: string, answer: string) => void;
  targetPageCount?: number;
  onUpdateTargetPageCount?: (pages: number) => void;
  theme: 'dark' | 'light';
}

export default function StoryBeatsModal({
  isOpen,
  onClose,
  elements,
  selectedTemplateId = 'save_the_cat',
  onSelectTemplate,
  beatAnswers,
  onSaveBeatAnswer,
  targetPageCount = 110,
  onUpdateTargetPageCount,
  theme
}: StoryBeatsModalProps) {
  const [activeTemplateId, setActiveTemplateId] = useState(selectedTemplateId);
  const [activeBeatId, setActiveBeatId] = useState<string>('');
  const [pageTarget, setPageTarget] = useState(targetPageCount);
  const [viewMode, setViewMode] = useState<'editor' | 'catalog'>('editor');
  const [mainCategory, setMainCategory] = useState<'film' | 'series'>('film');
  const [seriesFilter, setSeriesFilter] = useState<'all' | 'broadcast' | 'streaming'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTemplate = useMemo(() => {
    return STORY_TEMPLATES.find(t => t.id === activeTemplateId) || STORY_TEMPLATES[0];
  }, [activeTemplateId]);

  // If active template category changes or starts, align mainCategory
  React.useEffect(() => {
    if (activeTemplate.category === 'film') {
      setMainCategory('film');
    } else {
      setMainCategory('series');
      if (activeTemplate.category === 'series') {
        setSeriesFilter('broadcast');
      } else if (activeTemplate.category === 'streaming') {
        setSeriesFilter('streaming');
      }
    }
  }, [activeTemplate.id]);

  // Keep first beat selected if template changes
  React.useEffect(() => {
    if (activeTemplate.beats.length > 0 && (!activeBeatId || !activeTemplate.beats.some(b => b.id === activeBeatId))) {
      setActiveBeatId(activeTemplate.beats[0].id);
    }
  }, [activeTemplate, activeBeatId]);

  const filmCount = useMemo(() => STORY_TEMPLATES.filter(t => t.category === 'film').length, []);
  const seriesCount = useMemo(() => STORY_TEMPLATES.filter(t => t.category === 'series' || t.category === 'streaming').length, []);
  const broadcastCount = useMemo(() => STORY_TEMPLATES.filter(t => t.category === 'series').length, []);
  const streamingCount = useMemo(() => STORY_TEMPLATES.filter(t => t.category === 'streaming').length, []);

  // Templates filtered for Catalog view
  const catalogTemplates = useMemo(() => {
    return STORY_TEMPLATES.filter(tmpl => {
      // Main category filter: 'film' vs 'series' (series includes broadcast and streaming)
      if (mainCategory === 'film') {
        if (tmpl.category !== 'film') return false;
      } else {
        if (tmpl.category === 'film') return false;
        if (seriesFilter === 'broadcast' && tmpl.category !== 'series') return false;
        if (seriesFilter === 'streaming' && tmpl.category !== 'streaming') return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tmpl.title.toLowerCase().includes(q) ||
        tmpl.subtitle.toLowerCase().includes(q) ||
        tmpl.author.toLowerCase().includes(q) ||
        tmpl.badge.toLowerCase().includes(q) ||
        tmpl.description.toLowerCase().includes(q)
      );
    });
  }, [mainCategory, seriesFilter, searchQuery]);

  const selectedBeat = useMemo(() => {
    return activeTemplate.beats.find(b => b.id === activeBeatId) || activeTemplate.beats[0];
  }, [activeTemplate, activeBeatId]);

  const selectedBeatIndex = useMemo(() => {
    return activeTemplate.beats.findIndex(b => b.id === activeBeatId);
  }, [activeTemplate, activeBeatId]);

  const getTemplateCompletion = (tmpl: StoryTemplate) => {
    const total = tmpl.beats.length;
    const filled = tmpl.beats.filter(b => !!beatAnswers[b.id]?.trim()).length;
    return {
      total,
      filled,
      percent: total > 0 ? Math.round((filled / total) * 100) : 0
    };
  };

  const completionStats = useMemo(() => {
    return getTemplateCompletion(activeTemplate);
  }, [activeTemplate, beatAnswers]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTemplate = (template: StoryTemplate) => {
    setActiveTemplateId(template.id);
    onSelectTemplate?.(template.id);
    setPageTarget(template.defaultPages);
    onUpdateTargetPageCount?.(template.defaultPages);
    setViewMode('editor');
  };

  const getCategoryLabel = (category: 'film' | 'series' | 'streaming') => {
    if (category === 'film') return 'Sinema Filmi';
    if (category === 'series') return 'Geleneksel Dizi / TV';
    return 'Dijital Platform & On-Demand';
  };

  const handleExportPDF = () => {
    let bodyHtml = `
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-val">${pageTarget}</div>
          <div class="stat-lbl">Hedef Sayfa</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">%${completionStats.percent}</div>
          <div class="stat-lbl">Tamamlanma Oranı</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${completionStats.filled} / ${completionStats.total}</div>
          <div class="stat-lbl">Dolu Beat Sayısı</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${activeTemplate.badge}</div>
          <div class="stat-lbl">Yapı Modeli</div>
        </div>
      </div>
    `;

    // Group beats by act
    let currentAct = '';
    activeTemplate.beats.forEach((b) => {
      if (b.act !== currentAct) {
        currentAct = b.act;
        bodyHtml += `<div class="section-title"><span>✦</span> ${escapeHtml(currentAct)}</div>`;
      }

      const targetPage = Math.max(1, Math.round((b.targetPercent / 100) * pageTarget));
      const answer = beatAnswers[b.id];

      bodyHtml += `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${escapeHtml(b.name)}</div>
            <div class="card-badge">~${targetPage}. Sayfa (%${b.targetPercent})</div>
          </div>
          <p style="font-size: 9pt; color: #475569; margin-bottom: 6px;">${escapeHtml(b.description)}</p>
          ${b.guidingQuestions.length > 0 ? `
            <div class="guiding-questions">
              <strong>Rehber Sorular:</strong>
              <ul>
                ${b.guidingQuestions.map(q => `<li>${escapeHtml(q)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="writer-note">
            <div class="writer-note-label">Yazarın Olay Örgüsü & Notları:</div>
            ${answer ? escapeHtml(answer) : '<em style="color: #94a3b8;">(Bu beat için henüz bir olay örgüsü veya sahne notu girilmedi.)</em>'}
          </div>
        </div>
      `;
    });

    printStyledDocument({
      title: `Hikaye Geliştirme Planı: ${activeTemplate.title}`,
      categoryBadge: getCategoryLabel(activeTemplate.category),
      subtitle: `${activeTemplate.subtitle} • Hedef: ${pageTarget} Sayfa`,
      bodyHtml,
      accentColor: '#2563eb'
    });
  };

  const handleExportMD = () => {
    let md = `# HİKAYE GELİŞTİRME PLANI: ${activeTemplate.title}\n\n`;
    md += `* **Kategori:** ${getCategoryLabel(activeTemplate.category)}\n`;
    md += `* **Model:** ${activeTemplate.subtitle}\n`;
    md += `* **Hedef Sayfa:** ${pageTarget} Sayfa\n`;
    md += `* **Tamamlanma:** %${completionStats.percent} (${completionStats.filled}/${completionStats.total} Beat)\n\n---\n\n`;

    let currentAct = '';
    activeTemplate.beats.forEach((b) => {
      const targetPage = Math.max(1, Math.round((b.targetPercent / 100) * pageTarget));
      if (b.act !== currentAct) {
        currentAct = b.act;
        md += `\n# ✦ ${currentAct.toUpperCase()}\n\n`;
      }
      md += `## ${b.name}\n`;
      md += `* **Konum:** ~${targetPage}. Sayfa (%${b.targetPercent})\n`;
      md += `* **Açıklama:** ${b.description}\n\n`;
      if (b.guidingQuestions.length > 0) {
        md += `**Rehber Sorular:**\n`;
        b.guidingQuestions.forEach(q => { md += `> * ${q}\n`; });
        md += `\n`;
      }
      md += `### Yazarın Notları:\n${beatAnswers[b.id] || '_Henüz bir not girilmedi._'}\n\n---\n\n`;
    });

    downloadUtf8File(md, `Hikaye_Plani_${activeTemplate.id}.md`, 'text/markdown;charset=utf-8');
  };

  const handleExportDOCX = async () => {
    try {
      const docChildren: any[] = [
        new Paragraph({ 
          children: [
            new TextRun({ 
              text: `HİKAYE GELİŞTİRME PLANI: ${activeTemplate.title}`, 
              bold: true, 
              size: 32,
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 150 }
        }),
        new Paragraph({ 
          children: [
            new TextRun({ 
              text: `Kategori: ${getCategoryLabel(activeTemplate.category)}  |  Model: ${activeTemplate.subtitle}  |  Hedef: ${pageTarget} Sayfa  |  Tamamlanma: %${completionStats.percent}`,
              italics: true,
              size: 20,
              color: "64748B",
              font: "Arial"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 350 }
        })
      ];

      let currentAct = '';
      activeTemplate.beats.forEach((b) => {
        const targetPage = Math.max(1, Math.round((b.targetPercent / 100) * pageTarget));
        
        if (b.act !== currentAct) {
          currentAct = b.act;
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `✦ ${currentAct.toUpperCase()}`,
                  bold: true,
                  size: 24,
                  color: "1E40AF",
                  font: "Arial"
                })
              ],
              spacing: { before: 300, after: 120 }
            })
          );
        }

        docChildren.push(
          new Paragraph({ 
            children: [
              new TextRun({ 
                text: `${b.name}`, 
                bold: true, 
                size: 22, 
                font: "Arial" 
              }),
              new TextRun({ 
                text: `  (~${targetPage}. Sayfa - %${b.targetPercent})`, 
                italics: true, 
                color: "64748B", 
                size: 18, 
                font: "Arial" 
              })
            ],
            spacing: { before: 180, after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Tanım: ${b.description}`,
                italics: true,
                size: 18,
                color: "475569",
                font: "Arial"
              })
            ],
            spacing: { after: 80 }
          })
        );

        if (b.guidingQuestions.length > 0) {
          b.guidingQuestions.forEach((q) => {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${q}`,
                    italics: true,
                    size: 18,
                    color: "3B82F6",
                    font: "Arial"
                  })
                ],
                indent: { left: 360 },
                spacing: { after: 40 }
              })
            );
          });
        }

        const answerText = beatAnswers[b.id] || '(Bu aşama için henüz not girilmedi.)';
        const answerLines = answerText.split('\n');

        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "YAZARIN NOTLARI & OLAY ÖRGÜSÜ:",
                bold: true,
                size: 16,
                color: "0F172A",
                font: "Arial"
              })
            ],
            indent: { left: 240 },
            spacing: { before: 80, after: 40 }
          })
        );

        answerLines.forEach(al => {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: al,
                  size: 20,
                  font: "Arial"
                })
              ],
              indent: { left: 240 },
              spacing: { after: 60 }
            })
          );
        });

        docChildren.push(new Paragraph({ text: "", spacing: { after: 120 } }));
      });

      const doc = new Document({ 
        sections: [{ 
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
          },
          children: docChildren 
        }] 
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Hikaye_Plani_${activeTemplate.id}.docx`);
    } catch (err: any) {
      console.error(err);
      alert('Word dosyası oluşturulurken bir hata oluştu: ' + (err.message || String(err)));
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      templateId: activeTemplateId,
      templateTitle: activeTemplate.title,
      pageTarget,
      beatAnswers,
      exportedAt: new Date().toISOString()
    };
    downloadUtf8File(JSON.stringify(exportData, null, 2), `Hikaye_Plani_${activeTemplate.id}.json`, 'application/json;charset=utf-8');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text);
          if (data.templateId && STORY_TEMPLATES.some(t => t.id === data.templateId)) {
            setActiveTemplateId(data.templateId);
            onSelectTemplate?.(data.templateId);
          }
          if (data.pageTarget) {
            setPageTarget(data.pageTarget);
            onUpdateTargetPageCount?.(data.pageTarget);
          }
          if (data.beatAnswers && typeof data.beatAnswers === 'object') {
            Object.entries(data.beatAnswers).forEach(([k, v]) => {
              onSaveBeatAnswer(k, v as string);
            });
          }
          alert("Hikaye planı başarıyla içe aktarıldı!");
        } else {
          alert("Lütfen geçerli bir .json hikaye planı dosyası seçin.");
        }
      } catch (err) {
        alert("Dosya yüklenirken hata oluştu.");
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const bgModal = theme === 'dark' ? 'bg-[#181c24] text-slate-100 border-[#2a3441]' : 'bg-[#FFFFF0] text-slate-800 border-[#c8bea8]';
  const sidebarBg = theme === 'dark' ? 'bg-[#12161c] border-[#222a35]' : 'bg-[#f4eee1] border-[#dfd6c5]';
  const cardBg = theme === 'dark' ? 'bg-[#202732] border-[#2d3847]' : 'bg-white border-[#e0d6c3]';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm select-none">
        <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportFile} className="hidden" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.97 }}
          className={`w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${bgModal}`}
        >
          {/* ============================================================ */}
          {/* TOP GLOBAL HEADER */}
          {/* ============================================================ */}
          <div className={`px-5 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${theme === 'dark' ? 'bg-[#141820] border-[#222a35]' : 'bg-[#ece4d6] border-[#dfd6c5]'}`}>
            {/* Left: Branding & Current Context */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8]' : 'bg-blue-600/15 text-blue-700'}`}>
                <Compass size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold truncate">Hikaye Geliştirici & Şablonlar</h2>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 border ${
                    theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-700 border-[#c8bea8]'
                  }`}>
                    {activeTemplate.category === 'film' ? '🎬 FİLM' : activeTemplate.category === 'series' ? '📺 DİZİ / TV' : '🌐 ON-DEMAND'}
                  </span>
                </div>
                <p className="text-[11px] opacity-70 truncate font-medium">
                  {viewMode === 'catalog' ? `${STORY_TEMPLATES.length} Endüstri Standardı Model Kataloğu` : `${activeTemplate.title} — ${activeTemplate.author}`}
                </p>
              </div>
            </div>

            {/* Right: View Switcher, Targets, Exports, Close */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Main View Toggle Buttons */}
              <div className="flex items-center p-0.5 rounded-lg border border-inherit bg-black/5 dark:bg-white/5">
                <button
                  onClick={() => setViewMode('catalog')}
                  className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'catalog'
                      ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 shadow-sm' : 'bg-blue-700 text-white shadow-sm')
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <LayoutGrid size={13} />
                  <span>Şablon Kataloğu ({STORY_TEMPLATES.length})</span>
                </button>
                <button
                  onClick={() => setViewMode('editor')}
                  className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'editor'
                      ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 shadow-sm' : 'bg-blue-700 text-white shadow-sm')
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <PenTool size={13} />
                  <span>Beat Editörü</span>
                </button>
              </div>

              {/* Target Pages (Only shown in editor or available everywhere) */}
              {viewMode === 'editor' && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono bg-black/5 dark:bg-white/5 border-inherit">
                  <Target size={13} className="opacity-70" />
                  <span className="opacity-75">Hedef:</span>
                  <input 
                    type="number" 
                    min={5} 
                    max={300} 
                    value={pageTarget} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 110;
                      setPageTarget(val);
                      onUpdateTargetPageCount?.(val);
                    }}
                    className="w-11 bg-transparent text-center font-bold outline-none border-b border-dashed border-current"
                  />
                  <span className="opacity-70">sf.</span>
                </div>
              )}

              {/* Import / Export Group (Editor View) */}
              {viewMode === 'editor' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                      theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border-[#c8bea8]'
                    }`}
                    title="Hikaye Planı İçe Aktar (.json)"
                  >
                    <Upload size={13} />
                    <span className="hidden lg:inline">İçe Aktar</span>
                  </button>

                  <button
                    onClick={handleExportMD}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                      theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border-[#c8bea8]'
                    }`}
                    title="Markdown olarak indir (.md)"
                  >
                    <Download size={13} />
                    <span>.md</span>
                  </button>

                  <button
                    onClick={handleExportDOCX}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                      theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border-[#c8bea8]'
                    }`}
                    title="Word belgesi olarak indir (.docx)"
                  >
                    <Download size={13} />
                    <span>.docx</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                      theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border-[#c8bea8]'
                    }`}
                    title="PDF tablosu olarak indir (.pdf)"
                  >
                    <Download size={13} />
                    <span>.pdf</span>
                  </button>
                </div>
              )}

              {/* Close Button */}
              <button 
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#2d3640] text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}
                title="Kapat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* VIEW 1: ŞABLON SEÇİM / KEŞİF KATALOĞU (CATALOG MODE) */}
          {/* ============================================================ */}
          {viewMode === 'catalog' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* TOP LEVEL 2 PRIMARY TABS */}
              <div className={`p-3.5 border-b shrink-0 ${theme === 'dark' ? 'bg-[#12161c] border-[#222a35]' : 'bg-[#f7f2e8] border-[#dfd6c5]'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-4xl mx-auto">
                  {/* 1. SİNEMA FİLMİ ŞABLONLARI */}
                  <button
                    onClick={() => {
                      setMainCategory('film');
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                      mainCategory === 'film'
                        ? (theme === 'dark' 
                            ? 'bg-[#252c33] border-[#6ba3e8] text-[#6ba3e8] shadow-sm' 
                            : 'bg-[#dfd7ca] border-blue-700 text-slate-950 shadow-sm')
                        : (theme === 'dark'
                            ? 'bg-[#181e28]/70 border-[#263140] hover:bg-[#1f2735] text-slate-300'
                            : 'bg-white border-[#dfd6c5] hover:bg-[#fcfaf6] text-slate-700')
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        mainCategory === 'film'
                          ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 font-bold' : 'bg-blue-700 text-white font-bold')
                          : (theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                      }`}>
                        <Film size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm">Sinema Filmi & Evrensel Anlatı</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            mainCategory === 'film' ? (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800') : 'bg-slate-500/20 opacity-70'
                          }`}>
                            {filmCount} Model
                          </span>
                        </div>
                        <p className="text-[11px] opacity-70 truncate mt-0.5">
                          Save the Cat, Hero's Journey, 6-Stage, Chitlik 7-Point, Harmon Çemberi...
                        </p>
                      </div>
                    </div>
                    {mainCategory === 'film' && (
                      <CheckCircle2 size={18} className={`shrink-0 ${theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'}`} />
                    )}
                  </button>

                  {/* 2. DİZİ & DİJİTAL PLATFORM ŞABLONLARI */}
                  <button
                    onClick={() => {
                      setMainCategory('series');
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                      mainCategory === 'series'
                        ? (theme === 'dark' 
                            ? 'bg-[#252c33] border-[#6ba3e8] text-[#6ba3e8] shadow-sm' 
                            : 'bg-[#dfd7ca] border-blue-700 text-slate-950 shadow-sm')
                        : (theme === 'dark'
                            ? 'bg-[#181e28]/70 border-[#263140] hover:bg-[#1f2735] text-slate-300'
                            : 'bg-white border-[#dfd6c5] hover:bg-[#fcfaf6] text-slate-700')
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        mainCategory === 'series'
                          ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 font-bold' : 'bg-blue-700 text-white font-bold')
                          : (theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                      }`}>
                        <Tv size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm">Dizi & Dijital Platform Şablonları</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            mainCategory === 'series' ? (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800') : 'bg-slate-500/20 opacity-70'
                          }`}>
                            {seriesCount} Model
                          </span>
                        </div>
                        <p className="text-[11px] opacity-70 truncate mt-0.5">
                          1 Saatlik TV Dramaları, Sitcomlar, Slow-Burn, Streaming & On-Demand...
                        </p>
                      </div>
                    </div>
                    {mainCategory === 'series' && (
                      <CheckCircle2 size={18} className={`shrink-0 ${theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'}`} />
                    )}
                  </button>
                </div>
              </div>

              {/* SUB-FILTERS & SEARCH BAR */}
              <div className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${theme === 'dark' ? 'bg-[#141820] border-[#222a35]' : 'bg-[#ece4d6] border-[#dfd6c5]'}`}>
                {/* Secondary Sub-Category Filter (Only active when Dizi is selected) */}
                {mainCategory === 'series' ? (
                  <div className="flex items-center gap-1 p-0.5 rounded-lg border border-inherit bg-black/5 dark:bg-white/5">
                    <button
                      onClick={() => setSeriesFilter('all')}
                      className={`px-3 py-1 rounded-md font-bold transition-all ${
                        seriesFilter === 'all'
                          ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 shadow-sm' : 'bg-blue-700 text-white shadow-sm')
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      Tüm Dizi Şablonları ({seriesCount})
                    </button>
                    <button
                      onClick={() => setSeriesFilter('broadcast')}
                      className={`px-3 py-1 rounded-md font-bold flex items-center gap-1 transition-all ${
                        seriesFilter === 'broadcast'
                          ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 shadow-sm' : 'bg-blue-700 text-white shadow-sm')
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Tv size={12} />
                      <span>Geleneksel TV & Sitcom ({broadcastCount})</span>
                    </button>
                    <button
                      onClick={() => setSeriesFilter('streaming')}
                      className={`px-3 py-1 rounded-md font-bold flex items-center gap-1 transition-all ${
                        seriesFilter === 'streaming'
                          ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 shadow-sm' : 'bg-blue-700 text-white shadow-sm')
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Globe size={12} />
                      <span>On-Demand / Streaming ({streamingCount})</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs opacity-75 font-semibold">
                    <Film size={14} className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'} />
                    <span>Hollywood, Bağımsız & Klasik Sinema Modelleri ({catalogTemplates.length} Model)</span>
                  </div>
                )}

                {/* Instant Search Box */}
                <div className="flex items-center gap-2 flex-1 max-w-sm ml-auto">
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="text"
                      placeholder={mainCategory === 'film' ? "Film şablonu veya yazar ara..." : "Dizi şablonu veya format ara..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-8 py-1.5 rounded-xl text-xs outline-none border transition-all ${
                        theme === 'dark' ? 'bg-[#12161c] border-slate-700 focus:border-[#6ba3e8]' : 'bg-white border-[#d8cdba] focus:border-blue-600'
                      }`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 text-xs"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CLEAN SADE LIST VIEW (REPLACES BULKY CARDS) */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 custom-scrollbar">
                {catalogTemplates.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center opacity-60">
                    <Search size={32} className="mb-2 opacity-50" />
                    <p className="font-semibold text-sm">Aradığınız kriterlere uygun şablon bulunamadı.</p>
                    <p className="text-xs opacity-75 mt-1">Farklı bir arama terimi deneyebilir veya filtreyi temizleyebilirsiniz.</p>
                  </div>
                ) : (
                  <div className="max-w-5xl mx-auto space-y-2 pb-2">
                    {catalogTemplates.map((template, idx) => {
                      const isSelected = activeTemplateId === template.id;
                      const isFilm = template.category === 'film';
                      const isSeries = template.category === 'series';
                      const isStreaming = template.category === 'streaming';
                      const completion = getTemplateCompletion(template);

                      return (
                        <div
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className={`px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                            isSelected
                              ? (theme === 'dark'
                                  ? 'bg-[#1d2736] border-[#6ba3e8] ring-1 ring-[#6ba3e8]/40 shadow-sm'
                                  : 'bg-[#edf4ff] border-blue-600 ring-1 ring-blue-500/40 shadow-sm'
                                )
                              : (theme === 'dark'
                                  ? 'bg-[#181f2a]/60 border-[#242f3d] hover:bg-[#1e2736] hover:border-slate-600'
                                  : 'bg-white border-[#e3dacf] hover:bg-[#fbf8f2] hover:border-[#cfc4b0]'
                                )
                          }`}
                        >
                          {/* Left: Index + Main Info */}
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            {/* Number index badge */}
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 sm:mt-0 ${
                              isSelected
                                ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-600 text-white')
                                : (theme === 'dark' ? 'bg-slate-800 text-slate-400 group-hover:text-slate-200' : 'bg-slate-100 text-slate-600 group-hover:text-slate-900')
                            }`}>
                              {idx + 1}
                            </div>

                            {/* Info Stack */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`font-bold text-xs sm:text-sm leading-tight transition-colors ${
                                  isSelected 
                                    ? (theme === 'dark' ? 'text-blue-300 font-extrabold' : 'text-blue-700 font-extrabold') 
                                    : 'group-hover:text-blue-500'
                                }`}>
                                  {template.title}
                                </h3>

                                {/* Category Tag */}
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${
                                  theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {template.badge}
                                </span>

                                {/* Target Pages */}
                                <span className="text-[10px] font-mono opacity-60">
                                  ~{template.defaultPages} sf.
                                </span>
                              </div>

                              {/* Subtitle / Author */}
                              <p className="text-xs opacity-75 font-medium mt-0.5 truncate">
                                {template.subtitle}
                              </p>

                              {/* Description Snippet */}
                              <p className="text-[11px] opacity-70 mt-1 line-clamp-1 leading-relaxed hidden sm:block">
                                {template.description}
                              </p>
                            </div>
                          </div>

                          {/* Right: Progress & Action Button */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* Fill Progress if any */}
                            {completion.filled > 0 && (
                              <div className="hidden md:flex items-center gap-1 text-[11px] font-mono text-emerald-500 font-semibold">
                                <CheckCircle size={12} />
                                <span>{completion.filled}/{completion.total}</span>
                              </div>
                            )}

                            {/* Selection Action */}
                            {isSelected ? (
                              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                                theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-600 text-white'
                              }`}>
                                <Check size={13} />
                                <span className="hidden sm:inline">Aktif Model</span>
                                <ArrowRight size={13} />
                              </div>
                            ) : (
                              <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                theme === 'dark'
                                  ? 'bg-slate-800/80 group-hover:bg-[#6ba3e8] group-hover:text-slate-950 text-slate-300'
                                  : 'bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700'
                              }`}>
                                <span>Seç & Yaz</span>
                                <ChevronRight size={13} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 2: BEAT YAZIM & ÇALIŞMA ALANI (WORKSPACE MODE) */}
          {/* ============================================================ */}
          {viewMode === 'editor' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* COMPACT ACTIVE MODEL BANNER */}
              <div className={`px-5 py-2.5 border-b flex items-center justify-between gap-3 text-xs shrink-0 ${theme === 'dark' ? 'bg-[#181e28] border-[#222a35]' : 'bg-[#f7f2e8] border-[#dfd6c5]'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setViewMode('catalog')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-800 hover:bg-slate-700 text-[#6ba3e8] border-slate-700' 
                        : 'bg-white hover:bg-slate-50 text-blue-700 border-[#dfd6c5]'
                    }`}
                  >
                    <ArrowLeft size={13} />
                    <span>Şablon Değiştir</span>
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold truncate text-xs sm:text-sm">{activeTemplate.title}</span>
                      <span className="text-[10px] opacity-60 font-mono hidden sm:inline">({activeTemplate.badge})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-75 font-mono">
                      {completionStats.filled} / {completionStats.total} Beat (%{completionStats.percent})
                    </span>
                    <div className="w-20 sm:w-28 h-2 rounded-full bg-slate-500/20 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${theme === 'dark' ? 'bg-[#6ba3e8]' : 'bg-blue-700'}`}
                        style={{ width: `${completionStats.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* MAIN SPLIT EDITOR VIEW */}
              <div className="flex-1 flex overflow-hidden">
                {/* LEFT: BEATS LIST SIDEBAR */}
                <div className={`w-72 sm:w-88 border-r flex flex-col shrink-0 ${sidebarBg}`}>
                  <div className="px-4 py-2.5 border-b border-inherit flex items-center justify-between text-xs font-semibold">
                    <span className="opacity-80">Hikaye Aşamaları ({activeTemplate.beats.length})</span>
                    <span className="text-[11px] font-mono opacity-60">Hedef: ~{pageTarget} sf.</span>
                  </div>

                  {/* BEATS SCROLLABLE LIST */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                    {activeTemplate.beats.map((beat, idx) => {
                      const isSelected = activeBeatId === beat.id;
                      const hasAnswer = !!beatAnswers[beat.id]?.trim();
                      const targetPage = Math.max(1, Math.round((beat.targetPercent / 100) * pageTarget));

                      return (
                        <button
                          key={beat.id}
                          onClick={() => setActiveBeatId(beat.id)}
                          className={`w-full p-2.5 rounded-xl text-left transition-all border flex items-start justify-between gap-2 ${
                            isSelected
                              ? (theme === 'dark' ? 'bg-[#252c33] text-[#6ba3e8] border-[#6ba3e8] font-bold shadow-md' : 'bg-[#dfd7ca] text-slate-950 border-blue-700 font-bold shadow-md')
                              : theme === 'dark'
                              ? 'bg-[#181e28]/70 text-slate-300 border-transparent hover:bg-[#202735] hover:border-slate-700'
                              : 'bg-white/80 text-slate-800 border-transparent hover:bg-white hover:border-[#cfc4b0]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                isSelected ? (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800') : 'bg-slate-500/10'
                              }`}>
                                ~{targetPage}. Sayfa
                              </span>
                              <span className="text-[10px] uppercase opacity-70 font-semibold truncate">{beat.act}</span>
                            </div>
                            <div className="font-bold text-xs truncate">{beat.name}</div>
                          </div>

                          <div className="pt-1 shrink-0">
                            {hasAnswer ? (
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                isSelected ? (theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-700 text-white') : (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-100 text-blue-700')
                              }`}>
                                <Check size={11} className="stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-slate-400/40" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT: FOCUSED BEAT WORKSPACE */}
                {selectedBeat && (
                  <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                    {/* SINGLE UNIFIED BEAT & GUIDANCE CARD */}
                    <div className={`p-4 rounded-xl border ${cardBg} shadow-sm space-y-2.5`}>
                      {/* Header: Beat Name & Target info */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className={`text-sm sm:text-base font-bold tracking-tight ${theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'}`}>
                          {selectedBeat.name}
                        </h3>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className={`px-2 py-0.5 rounded font-semibold border ${theme === 'dark' ? 'bg-[#6ba3e8]/15 text-[#6ba3e8] border-[#6ba3e8]/30' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                            Hedef: ~{Math.max(1, Math.round((selectedBeat.targetPercent / 100) * pageTarget))}. Sayfa (%{selectedBeat.targetPercent})
                          </span>
                          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-inherit opacity-75">
                            {selectedBeat.act}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs leading-relaxed opacity-85">
                        {selectedBeat.description}
                      </p>

                      {/* Embedded Guiding Questions */}
                      {selectedBeat.guidingQuestions.length > 0 && (
                        <div className="pt-2 border-t border-inherit/40 space-y-1">
                          <div className={`text-[11px] font-bold flex items-center gap-1.5 opacity-80 ${theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'}`}>
                            <HelpCircle size={13} />
                            <span>Rehber Sorular:</span>
                          </div>
                          <ul className="space-y-0.5 text-xs opacity-80 pl-4 list-disc">
                            {selectedBeat.guidingQuestions.map((q, qIdx) => (
                              <li key={qIdx} className="leading-relaxed">
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* WRITER'S NOTE TEXTAREA */}
                    <div className="flex-1 flex flex-col space-y-2 min-h-[220px]">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={14} className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'} />
                          <span>Bu Beat İçin Hikaye Notlarınız & Olay Örgüsü:</span>
                        </span>
                        <span className="text-[11px] opacity-60 font-mono">Otomatik Kaydedilir</span>
                      </div>

                      <textarea
                        value={beatAnswers[selectedBeat.id] || ''}
                        onChange={(e) => onSaveBeatAnswer(selectedBeat.id, e.target.value)}
                        placeholder={`Bu aşamada neler yaşanıyor? Karakterinizin eylemleri, karşılaştığı krizler, mekan ve diyalog detaylarını buraya yazın...`}
                        className={`flex-1 w-full p-4 text-xs sm:text-sm leading-relaxed rounded-xl border outline-none font-mono resize-none transition-all ${
                          theme === 'dark'
                            ? 'bg-[#1b212b] border-[#2c3746] text-slate-100 focus:border-[#6ba3e8] focus:bg-[#1e2531]'
                            : 'bg-white border-[#d8cdba] text-slate-900 focus:border-blue-600'
                        }`}
                      />
                    </div>

                    {/* NEXT / PREV BEAT NAVIGATION */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        disabled={selectedBeatIndex <= 0}
                        onClick={() => {
                          if (selectedBeatIndex > 0) {
                            setActiveBeatId(activeTemplate.beats[selectedBeatIndex - 1].id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          selectedBeatIndex <= 0
                            ? 'opacity-30 cursor-not-allowed'
                            : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-slate-50 border text-slate-800'
                        }`}
                      >
                        <ChevronLeft size={14} />
                        <span>Önceki Beat</span>
                      </button>

                      <div className="text-[11px] opacity-60 font-mono">
                        Beat {selectedBeatIndex + 1} / {activeTemplate.beats.length}
                      </div>

                      <button
                        disabled={selectedBeatIndex >= activeTemplate.beats.length - 1}
                        onClick={() => {
                          if (selectedBeatIndex < activeTemplate.beats.length - 1) {
                            setActiveBeatId(activeTemplate.beats[selectedBeatIndex + 1].id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          selectedBeatIndex >= activeTemplate.beats.length - 1
                            ? 'opacity-30 cursor-not-allowed'
                            : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-slate-50 border text-slate-800'
                        }`}
                      >
                        <span>Sonraki Beat</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* GLOBAL FOOTER */}
          {/* ============================================================ */}
          <div className={`px-6 py-3 border-t flex items-center justify-between shrink-0 ${theme === 'dark' ? 'border-slate-800 bg-[#141820]' : 'border-[#dfd6c5] bg-[#ece4d6]'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xs opacity-75 font-mono">
                Aktif Model: <strong className="opacity-100">{activeTemplate.title}</strong> ({activeTemplate.badge})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'editor' && (
                <button
                  onClick={() => setViewMode('catalog')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-50 border-[#dfd6c5] text-slate-800'
                  }`}
                >
                  Şablon Kataloğu ({STORY_TEMPLATES.length})
                </button>
              )}
              <button
                onClick={onClose}
                className={`px-6 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 ${
                  theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 hover:bg-[#82b4f0]' : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              >
                Kapat & Kaydet
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

