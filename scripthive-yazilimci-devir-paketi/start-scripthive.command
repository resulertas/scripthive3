#!/bin/bash
# ScriptHive Tek Tıkla Başlatıcı (Mac)
cd "$(dirname "$0")"
echo "================================================"
echo "🎬 ScriptHive Senaryo Editörü Başlatılıyor..."
echo "================================================"
echo "Yerel sunucu açılıyor: http://localhost:3000"
echo ""

# Tarayıcıyı 2 saniye sonra otomatik aç
(sleep 2 && open "http://localhost:3000") &

# Sunucuyu başlat
npm run dev
